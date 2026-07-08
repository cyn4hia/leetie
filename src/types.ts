export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Lang = 'javascript' | 'python'
export type LayoutMode = 'split' | 'problem' | 'editor'
export type Theme = 'light' | 'dark'

/** How a result is compared against the expected value. */
export type CompareMode =
  | 'exact' // deep equality
  | 'unordered' // top-level array, any order
  | 'set' // array of arrays: inner + outer order both ignored
  | 'float' // numeric tolerance 1e-5

export interface CatalogEntry {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  paidOnly: boolean
  acRate: number
  tags: string[]
}

export interface TestCase {
  input: unknown[]
  expected: unknown
}

/** A bundled problem with everything needed to run + grade locally. */
export interface CuratedProblem {
  id: string
  title: string
  slug: string
  difficulty: Difficulty
  tags: string[]
  /** Markdown problem statement. */
  description: string
  fnName: string
  pyFnName: string
  compare: CompareMode
  starter: Record<Lang, string>
  solution: Record<Lang, string>
  tests: TestCase[]
}

/** Fetched content for a non-curated catalog problem. */
export interface RemoteContent {
  content: string // HTML
  snippets: Partial<Record<Lang, string>>
}

export interface CaseResult {
  pass: boolean
  got?: unknown
  expected: unknown
  input: unknown[]
  timeMs: number
  error?: string
}

export interface RunResult {
  ok: boolean
  error?: string
  cases: CaseResult[]
  logs: string[]
  totalMs: number
}

export type Grade = 'S' | 'A' | 'B'

export interface SolveRecord {
  grade: Grade
  date: string // YYYY-MM-DD
  lang: Lang
}
