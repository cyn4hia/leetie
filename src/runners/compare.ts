import type { CompareMode } from '../types'

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a === 'number' && typeof b === 'number') {
    return Number.isNaN(a) && Number.isNaN(b)
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as object)
    const kb = Object.keys(b as object)
    return (
      ka.length === kb.length &&
      ka.every((k) =>
        deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
      )
    )
  }
  return false
}

const key = (v: unknown) => JSON.stringify(v) ?? 'undefined'

/** Any deterministic total order works — both sides get the same one. */
const byKey = (x: unknown, y: unknown) => {
  const a = key(x)
  const b = key(y)
  return a < b ? -1 : a > b ? 1 : 0
}

function floatEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-5
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => floatEqual(v, b[i]))
  }
  return deepEqual(a, b)
}

export function compareValues(got: unknown, expected: unknown, mode: CompareMode): boolean {
  switch (mode) {
    case 'exact':
      return deepEqual(got, expected)
    case 'float':
      return floatEqual(got, expected)
    case 'unordered': {
      if (!Array.isArray(got) || !Array.isArray(expected)) return false
      return deepEqual([...got].sort(byKey), [...expected].sort(byKey))
    }
    case 'set': {
      if (!Array.isArray(got) || !Array.isArray(expected)) return false
      const canon = (arr: unknown[]) =>
        arr.map((el) => (Array.isArray(el) ? [...el].sort(byKey) : el)).sort(byKey)
      return deepEqual(canon(got), canon(expected))
    }
  }
}
