import { curatedProblems } from '../data/problems'
import type { CuratedProblem } from '../types'

export function todayString(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return todayString(d)
}

/** Deterministic problem-of-the-day drawn from the gradable curated set. */
export function dailyProblem(): CuratedProblem {
  const day = todayString()
  let hash = 0
  for (let i = 0; i < day.length; i++) {
    hash = (hash * 31 + day.charCodeAt(i)) >>> 0
  }
  return curatedProblems[hash % curatedProblems.length]
}
