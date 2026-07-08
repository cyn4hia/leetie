import type { CompareMode, Lang, RunResult, TestCase } from '../types'

const JS_TIMEOUT_MS = 8_000
const PY_RUN_TIMEOUT_MS = 20_000
const PY_LOAD_TIMEOUT_MS = 120_000

export interface RunRequest {
  lang: Lang
  code: string
  fnName: string
  tests: TestCase[]
  compare: CompareMode
}

function failure(error: string): RunResult {
  return { ok: false, error, cases: [], logs: [], totalMs: 0 }
}

// ---------- JavaScript ----------

let jsWorker: Worker | null = null

function runJs(req: RunRequest): Promise<RunResult> {
  return new Promise((resolve) => {
    if (!jsWorker) {
      jsWorker = new Worker(new URL('./jsWorker.ts', import.meta.url), { type: 'module' })
    }
    const worker = jsWorker
    const timer = setTimeout(() => {
      worker.terminate()
      jsWorker = null
      resolve(failure('time limit exceeded (8s) — infinite loop somewhere? ᓚᘏᗢ …?'))
    }, JS_TIMEOUT_MS)
    worker.onmessage = (e) => {
      clearTimeout(timer)
      resolve(e.data as RunResult)
    }
    worker.onerror = (e) => {
      clearTimeout(timer)
      worker.terminate()
      jsWorker = null
      resolve(failure(e.message || 'worker crashed'))
    }
    worker.postMessage({
      code: req.code,
      fnName: req.fnName,
      tests: req.tests,
      compare: req.compare,
    })
  })
}

// ---------- Python (Pyodide) ----------

export type PyStatus = 'off' | 'loading' | 'ready' | 'error'

let pyWorker: Worker | null = null
let pyReady = false
let pyResolve: ((r: RunResult) => void) | null = null
let readyListeners: Array<(ok: boolean) => void> = []

function notifyReady(ok: boolean) {
  pyReady = ok
  readyListeners.forEach((cb) => cb(ok))
  readyListeners = []
}

function ensurePyWorker(): Worker {
  if (pyWorker) return pyWorker
  pyWorker = new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' })
  pyWorker.onmessage = (e) => {
    const msg = e.data as { type: string; result?: RunResult; error?: string }
    if (msg.type === 'ready') {
      notifyReady(true)
    } else if (msg.type === 'loadError') {
      notifyReady(false)
      pyWorker?.terminate()
      pyWorker = null
    } else if (msg.type === 'result' && msg.result) {
      pyReady = true
      pyResolve?.(msg.result)
      pyResolve = null
    }
  }
  pyWorker.onerror = () => {
    notifyReady(false)
    pyResolve?.(failure('python runtime crashed — it will restart on the next run'))
    pyResolve = null
    pyWorker?.terminate()
    pyWorker = null
    pyReady = false
  }
  return pyWorker
}

/** Kick off the (~10 MB, one-time) Pyodide download so the first run is snappy. */
export function warmupPython(onDone: (ok: boolean) => void): PyStatus {
  if (pyReady) return 'ready'
  readyListeners.push(onDone)
  ensurePyWorker().postMessage({ type: 'warmup' })
  return 'loading'
}

export function isPythonReady(): boolean {
  return pyReady
}

function runPy(req: RunRequest): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = ensurePyWorker()
    const timeoutMs = pyReady ? PY_RUN_TIMEOUT_MS : PY_LOAD_TIMEOUT_MS
    const timer = setTimeout(() => {
      worker.terminate()
      pyWorker = null
      pyReady = false
      pyResolve = null
      resolve(
        failure(
          `time limit exceeded (${Math.round(timeoutMs / 1000)}s) — the python runtime will restart on the next run`,
        ),
      )
    }, timeoutMs)
    pyResolve = (result) => {
      clearTimeout(timer)
      resolve(result)
    }
    worker.postMessage({
      type: 'run',
      code: req.code,
      fnName: req.fnName,
      tests: req.tests,
      compare: req.compare,
    })
  })
}

// ---------- entry point ----------

let running = false

export async function runTests(req: RunRequest): Promise<RunResult> {
  if (running) return failure('already running — patience, young grasshopper 🐾')
  running = true
  try {
    return req.lang === 'javascript' ? await runJs(req) : await runPy(req)
  } finally {
    running = false
  }
}
