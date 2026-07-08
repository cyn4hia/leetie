import { useEffect, useMemo, useRef, useState } from 'react'
import { useLeetie } from '../store'
import { curatedProblems, curatedBySlug } from '../data/problems'
import { dailyProblem } from '../lib/daily'
import { RetroWindow } from './RetroWindow'
import type { CatalogEntry } from '../types'

const MAX_ROWS = 150
const ROLL_STEPS = 16

function Row({ entry, curated }: { entry: CatalogEntry; curated: boolean }) {
  const selectedSlug = useLeetie((s) => s.selectedSlug)
  const selectProblem = useLeetie((s) => s.selectProblem)
  const solved = useLeetie((s) => s.solved)
  const record = solved[entry.slug]

  return (
    <div
      className={`problem-row ${selectedSlug === entry.slug ? 'active' : ''}`}
      onClick={() => selectProblem(entry.slug)}
    >
      <span className={`dot ${entry.difficulty.toLowerCase()}`} />
      <span className="row-id">{entry.id}.</span>
      <span className="row-title">{entry.title}</span>
      {curated && (
        <span className="star" title="gradable: bundled tests + reference solution">
          ★
        </span>
      )}
      {record && (
        <span className="solved-badge" title={`solved ${record.date} (${record.lang})`}>
          {record.grade}✓
        </span>
      )}
    </div>
  )
}

const asEntry = (p: (typeof curatedProblems)[number]): CatalogEntry => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  difficulty: p.difficulty,
  paidOnly: false,
  acRate: 0,
  tags: p.tags,
})

function RollTab() {
  const difficulties = useLeetie((s) => s.difficulties)
  const catalog = useLeetie((s) => s.catalog)
  const selectProblem = useLeetie((s) => s.selectProblem)
  const pokeCat = useLeetie((s) => s.pokeCat)
  const solved = useLeetie((s) => s.solved)

  const [includeAll, setIncludeAll] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [ticker, setTicker] = useState<string | null>(null)
  const rollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const daily = dailyProblem()

  const pool = useMemo(() => {
    const curated = curatedProblems.map(asEntry).filter((e) => difficulties.includes(e.difficulty))
    if (!includeAll) return curated
    return [
      ...curated,
      ...catalog.filter((e) => !curatedBySlug.has(e.slug) && difficulties.includes(e.difficulty)),
    ]
  }, [difficulties, includeAll, catalog])

  useEffect(() => () => clearTimeout(rollTimer.current), [])

  function roll() {
    if (rolling || pool.length === 0) return
    setRolling(true)
    let step = 0
    const spin = () => {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      setTicker(pick.title)
      step++
      if (step < ROLL_STEPS) {
        // ease out like a slot machine settling
        rollTimer.current = setTimeout(spin, 45 + step * 16)
      } else {
        setRolling(false)
        selectProblem(pick.slug)
        pokeCat('roll')
      }
    }
    spin()
  }

  return (
    <>
      <div className="daily-card" onClick={() => selectProblem(daily.slug)}>
        <div className="daily-label px">✦ today's byte ✦</div>
        <div className="daily-title">
          {daily.id}. {daily.title} {solved[daily.slug] ? '✓' : ''}
        </div>
      </div>

      <div className="roll-box">
        <div className="roll-label px">♡ problem gacha ♡</div>
        <div className={`slot-window ${rolling ? 'rolling' : ''}`}>
          {ticker ?? 'press roll! (◕ᴥ◕)'}
        </div>
        <button className="btn primary roll-btn" onClick={roll} disabled={rolling || pool.length === 0}>
          {rolling ? '⟳ rolling…' : '✦ ROLL ✦'}
        </button>
        <label className="roll-opt">
          <input
            type="checkbox"
            checked={includeAll}
            onChange={(e) => setIncludeAll(e.target.checked)}
          />
          include un-gradable problems
        </label>
        <div className="roll-hint">
          rolling {pool.length} problems · {difficulties.map((d) => d.toLowerCase()).join(' · ')}
        </div>
      </div>
    </>
  )
}

function BrowseTab() {
  const search = useLeetie((s) => s.search)
  const setSearch = useLeetie((s) => s.setSearch)
  const difficulties = useLeetie((s) => s.difficulties)
  const catalog = useLeetie((s) => s.catalog)
  const catalogLoaded = useLeetie((s) => s.catalogLoaded)

  const query = search.trim().toLowerCase()

  const matches = (e: CatalogEntry) =>
    difficulties.includes(e.difficulty) &&
    (query === '' ||
      e.title.toLowerCase().includes(query) ||
      e.id === query ||
      e.tags.some((t) => t.toLowerCase().includes(query)))

  const curatedEntries = useMemo(
    () => curatedProblems.map(asEntry).filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [difficulties, query],
  )

  const catalogEntries = useMemo(
    () => catalog.filter((e) => !curatedBySlug.has(e.slug) && matches(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalog, difficulties, query],
  )

  const shown = catalogEntries.slice(0, MAX_ROWS)

  return (
    <>
      <input
        className="search-box"
        placeholder="search problems… (◕ᴥ◕)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="list-section">★ gradable ({curatedEntries.length})</div>
      {curatedEntries.map((e) => (
        <Row key={e.slug} entry={e} curated />
      ))}

      <div className="list-section">
        all problems {catalogLoaded ? `(${catalogEntries.length})` : '(loading…)'}
      </div>
      {shown.map((e) => (
        <Row key={e.slug} entry={e} curated={false} />
      ))}
      {catalogEntries.length > MAX_ROWS && (
        <div className="list-more">
          showing {MAX_ROWS} of {catalogEntries.length} — refine your search ᓚᘏᗢ
        </div>
      )}
    </>
  )
}

export function ProblemList() {
  const [tab, setTab] = useState<'roll' | 'browse'>('roll')

  return (
    <RetroWindow title="problems.db" className="sidebar">
      <div className="side-tabs">
        <button className={tab === 'roll' ? 'on' : ''} onClick={() => setTab('roll')}>
          ✦ roll
        </button>
        <button className={tab === 'browse' ? 'on' : ''} onClick={() => setTab('browse')}>
          ☰ browse
        </button>
      </div>
      {tab === 'roll' ? <RollTab /> : <BrowseTab />}
    </RetroWindow>
  )
}
