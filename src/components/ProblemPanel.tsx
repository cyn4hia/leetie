import { useEffect, useState } from 'react'
import { useLeetie } from '../store'
import { curatedBySlug } from '../data/problems'
import { loadContent } from '../lib/catalog'
import { renderMarkdown, sanitizeHtml } from '../lib/markdown'
import { RetroWindow } from './RetroWindow'
import type { RemoteContent } from '../types'

function SolutionBox({ slug }: { slug: string }) {
  const lang = useLeetie((s) => s.lang)
  const revealed = useLeetie((s) => s.revealed)
  const solvedRecord = useLeetie((s) => s.solved[slug])
  const reveal = useLeetie((s) => s.reveal)
  const pokeCat = useLeetie((s) => s.pokeCat)
  const [armed, setArmed] = useState(false)

  useEffect(() => setArmed(false), [slug])

  const problem = curatedBySlug.get(slug)
  if (!problem) return null

  const isOpen = revealed[slug] || !!solvedRecord

  if (!isOpen) {
    return (
      <div className="solution-box">
        {!armed ? (
          <button className="btn small" onClick={() => setArmed(true)}>
            🙈 peek at solution?
          </button>
        ) : (
          <>
            <button
              className="btn small"
              onClick={() => {
                reveal(slug)
                pokeCat('greet')
              }}
            >
              fur real? peek! 🙉
            </button>{' '}
            <button className="btn small" onClick={() => setArmed(false)}>
              no, I got this 💪
            </button>
          </>
        )}
        <p className="peek-note">solutions unlock automatically when you pass a submit ✓</p>
      </div>
    )
  }

  return (
    <div className="solution-box">
      <div className="list-section">reference solution · {lang}</div>
      <pre>{problem.solution[lang]}</pre>
    </div>
  )
}

function RemoteProblem({ slug }: { slug: string }) {
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading')
  const [content, setContent] = useState<RemoteContent | null>(null)

  useEffect(() => {
    let alive = true
    setState('loading')
    setContent(null)
    loadContent(slug).then((c) => {
      if (!alive) return
      setContent(c)
      setState(c ? 'ok' : 'error')
    })
    return () => {
      alive = false
    }
  }, [slug])

  if (state === 'loading') {
    return <div className="loading-note">fetching problem… ᓚᘏᗢ~</div>
  }
  if (state === 'error' || !content) {
    return (
      <div className="loading-note">
        couldn't fetch this one (mirror may be napping 😴) —{' '}
        <a href={`https://leetcode.com/problems/${slug}/`} target="_blank" rel="noreferrer">
          open it on leetcode ↗
        </a>
      </div>
    )
  }
  return (
    <div
      className="problem-content"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content) }}
    />
  )
}

export function ProblemPanel() {
  const slug = useLeetie((s) => s.selectedSlug)
  const catalog = useLeetie((s) => s.catalog)

  const curated = curatedBySlug.get(slug)
  const entry = curated ?? catalog.find((e) => e.slug === slug)

  return (
    <RetroWindow
      title={`problem — ${entry ? `#${entry.id}` : slug}`}
      className="pane-problem"
    >
      <div className="problem-scroll">
        {entry && (
          <>
            <div className="problem-head">
              <h2>
                {entry.id}. {entry.title}
              </h2>
              <span className={`diff-badge ${entry.difficulty.toLowerCase()}`}>
                {entry.difficulty.toLowerCase()}
              </span>
            </div>
            <div className="tag-row">
              {entry.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
              <a
                className="tag"
                href={`https://leetcode.com/problems/${slug}/`}
                target="_blank"
                rel="noreferrer"
              >
                leetcode ↗
              </a>
            </div>
          </>
        )}

        {curated ? (
          <>
            <div
              className="problem-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(curated.description) }}
            />
            <SolutionBox slug={slug} />
          </>
        ) : (
          <RemoteProblem slug={slug} />
        )}
      </div>
    </RetroWindow>
  )
}
