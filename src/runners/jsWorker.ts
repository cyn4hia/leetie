import { compareValues } from './compare'
import type { CompareMode, RunResult, TestCase } from '../types'

interface RunMessage {
  code: string
  fnName: string
  tests: TestCase[]
  compare: CompareMode
}

const ctx = self as unknown as {
  postMessage(msg: unknown): void
  onmessage: ((e: MessageEvent) => void) | null
}

/** Make an arbitrary return value safe to postMessage + display. */
function jsonSafe(v: unknown): unknown {
  if (v === undefined) return null
  try {
    return JSON.parse(JSON.stringify(v))
  } catch {
    return String(v)
  }
}

ctx.onmessage = (e: MessageEvent) => {
  const { code, fnName, tests, compare } = e.data as RunMessage
  const logs: string[] = []
  const fmt = (v: unknown) => (typeof v === 'string' ? v : (JSON.stringify(v) ?? String(v)))
  const origLog = console.log
  console.log = (...args: unknown[]) => {
    if (logs.length < 200) logs.push(args.map(fmt).join(' '))
  }

  const t0 = performance.now()
  const result: RunResult = { ok: true, cases: [], logs, totalMs: 0 }

  let fn: unknown
  try {
    if (fnName) {
      fn = new Function(
        `${code}\n;return typeof ${fnName} === 'function' ? ${fnName} : undefined;`,
      )()
      if (typeof fn !== 'function') {
        throw new Error(`could not find a function named "${fnName}"`)
      }
    } else {
      // scratch mode: no test harness, just execute and capture output
      new Function(code)()
    }
  } catch (err) {
    result.ok = false
    result.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }

  if (result.ok && typeof fn === 'function') {
    for (const t of tests) {
      const input = structuredClone(t.input)
      const start = performance.now()
      try {
        const got = (fn as (...args: unknown[]) => unknown)(...input)
        const timeMs = performance.now() - start
        result.cases.push({
          pass: compareValues(got, t.expected, compare),
          got: jsonSafe(got),
          expected: t.expected,
          input: t.input,
          timeMs,
        })
      } catch (err) {
        result.cases.push({
          pass: false,
          expected: t.expected,
          input: t.input,
          timeMs: performance.now() - start,
          error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
        })
      }
    }
  }

  result.totalMs = performance.now() - t0
  console.log = origLog
  ctx.postMessage(result)
}
