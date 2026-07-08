import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CatalogEntry,
  Difficulty,
  Grade,
  Lang,
  LayoutMode,
  RunResult,
  SolveRecord,
  Theme,
} from './types'
import type { PyStatus } from './runners/runner'
import { todayString, yesterdayString } from './lib/daily'

export type CatMood = 'celebrate' | 'sad' | 'greet' | 'roll'
export interface CatEvent {
  kind: CatMood
  n: number
}

const GRADE_RANK: Record<Grade, number> = { S: 3, A: 2, B: 1 }

export const codeKey = (slug: string, lang: Lang) => `${slug}|${lang}`

interface LeetieState {
  // persisted
  theme: Theme
  layout: LayoutMode
  lang: Lang
  difficulties: Difficulty[]
  selectedSlug: string
  sidebarOpen: boolean
  code: Record<string, string>
  solved: Record<string, SolveRecord>
  streak: { count: number; lastDay: string }

  // ephemeral
  search: string
  catalog: CatalogEntry[]
  catalogLoaded: boolean
  result: RunResult | null
  resultKind: 'run' | 'submit' | null
  running: boolean
  pyStatus: PyStatus
  revealed: Record<string, boolean>
  catEvent: CatEvent | null

  toggleTheme: () => void
  setLayout: (layout: LayoutMode) => void
  setLang: (lang: Lang) => void
  toggleDifficulty: (d: Difficulty) => void
  setSearch: (s: string) => void
  selectProblem: (slug: string) => void
  toggleSidebar: () => void
  setCode: (slug: string, lang: Lang, code: string) => void
  clearCode: (slug: string, lang: Lang) => void
  setCatalog: (entries: CatalogEntry[]) => void
  setResult: (result: RunResult | null, kind: 'run' | 'submit' | null) => void
  setRunning: (running: boolean) => void
  setPyStatus: (status: PyStatus) => void
  reveal: (slug: string) => void
  recordSolve: (slug: string, grade: Grade, lang: Lang) => void
  pokeCat: (kind: CatMood) => void
}

export const useLeetie = create<LeetieState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      layout: 'split',
      lang: 'javascript',
      difficulties: ['Easy', 'Medium', 'Hard'],
      // starts empty on purpose: a problem appears once you roll (or pick the daily)
      selectedSlug: '',
      sidebarOpen: true,
      code: {},
      solved: {},
      streak: { count: 0, lastDay: '' },

      search: '',
      catalog: [],
      catalogLoaded: false,
      result: null,
      resultKind: null,
      running: false,
      pyStatus: 'off',
      revealed: {},
      catEvent: null,

      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setLayout: (layout) => set({ layout }),
      setLang: (lang) => set({ lang }),
      toggleDifficulty: (d) =>
        set((s) => {
          const has = s.difficulties.includes(d)
          const next = has ? s.difficulties.filter((x) => x !== d) : [...s.difficulties, d]
          // never allow an empty filter — that just looks broken
          return { difficulties: next.length ? next : s.difficulties }
        }),
      setSearch: (search) => set({ search }),
      selectProblem: (slug) => set({ selectedSlug: slug, result: null, resultKind: null }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCode: (slug, lang, value) =>
        set((s) => ({ code: { ...s.code, [codeKey(slug, lang)]: value } })),
      clearCode: (slug, lang) =>
        set((s) => {
          const next = { ...s.code }
          delete next[codeKey(slug, lang)]
          return { code: next }
        }),
      setCatalog: (catalog) => set({ catalog, catalogLoaded: true }),
      setResult: (result, resultKind) => set({ result, resultKind }),
      setRunning: (running) => set({ running }),
      setPyStatus: (pyStatus) => set({ pyStatus }),
      reveal: (slug) => set((s) => ({ revealed: { ...s.revealed, [slug]: true } })),
      recordSolve: (slug, grade, lang) => {
        const { solved, streak } = get()
        const today = todayString()
        const prev = solved[slug]
        const best =
          prev && GRADE_RANK[prev.grade] >= GRADE_RANK[grade]
            ? prev
            : { grade, date: today, lang }
        let nextStreak = streak
        if (streak.lastDay !== today) {
          nextStreak = {
            count: streak.lastDay === yesterdayString() ? streak.count + 1 : 1,
            lastDay: today,
          }
        }
        set({ solved: { ...solved, [slug]: best }, streak: nextStreak })
      },
      pokeCat: (kind) => set((s) => ({ catEvent: { kind, n: (s.catEvent?.n ?? 0) + 1 } })),
    }),
    {
      name: 'leetie',
      version: 1,
      migrate: (persisted) => {
        // v0 persisted the selected problem; now every visit starts at the generator
        const s = persisted as Record<string, unknown>
        delete s.selectedSlug
        return s
      },
      partialize: (s) => ({
        theme: s.theme,
        layout: s.layout,
        lang: s.lang,
        difficulties: s.difficulties,
        sidebarOpen: s.sidebarOpen,
        code: s.code,
        solved: s.solved,
        streak: s.streak,
      }),
    },
  ),
)
