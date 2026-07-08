import type { Grade, RunResult } from '../types'

/** A grade is only awarded when every test passes. */
export function computeGrade(result: RunResult): Grade | null {
  if (!result.ok || result.cases.length === 0) return null
  if (result.cases.some((c) => !c.pass)) return null
  const total = result.cases.reduce((sum, c) => sum + c.timeMs, 0)
  if (total < 150) return 'S'
  if (total < 800) return 'A'
  return 'B'
}

export const GRADE_LABEL: Record<Grade, string> = {
  S: 'purrfect!!',
  A: 'pawsome!',
  B: 'solid work!',
}
