/**
 * Python runner: Pyodide (CPython → WASM) loaded from CDN inside a worker so
 * user code can never freeze the UI. Comparison + grading logic runs inside
 * the Python harness, mirroring compare.ts.
 */
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.28.3/full/'

const ctx = self as unknown as {
  postMessage(msg: unknown): void
  onmessage: ((e: MessageEvent) => void) | null
}

interface PyodideLike {
  globals: { set(name: string, value: unknown): void }
  runPythonAsync(code: string): Promise<string>
}

let pyodidePromise: Promise<PyodideLike> | null = null

function getPyodide(): Promise<PyodideLike> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const mod = await import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`)
      return (await mod.loadPyodide({ indexURL: PYODIDE_BASE })) as PyodideLike
    })()
  }
  return pyodidePromise
}

const HARNESS = `
import json, time, sys, io, copy

_payload = json.loads(LEETIE_PAYLOAD)
_code = _payload['code']
_fn_name = _payload['fn']
_tests = _payload['tests']
_mode = _payload['compare']

def _canon(v):
    if isinstance(v, tuple):
        v = list(v)
    if isinstance(v, list):
        return [_canon(x) for x in v]
    if isinstance(v, dict):
        return {k: _canon(x) for k, x in v.items()}
    if isinstance(v, set):
        return sorted((_canon(x) for x in v), key=lambda x: json.dumps(x, default=str))
    return v

def _deep_eq(a, b):
    if isinstance(a, bool) != isinstance(b, bool):
        return False
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_deep_eq(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_deep_eq(a[k], b[k]) for k in a)
    return a == b

def _float_eq(a, b):
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool):
        return abs(a - b) < 1e-5
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_float_eq(x, y) for x, y in zip(a, b))
    return _deep_eq(a, b)

def _key(v):
    return json.dumps(v, sort_keys=True, default=str)

def _compare(got, expected, mode):
    got = _canon(got)
    if mode == 'float':
        return _float_eq(got, expected)
    if mode == 'unordered':
        if not isinstance(got, list) or not isinstance(expected, list):
            return False
        return _deep_eq(sorted(got, key=_key), sorted(expected, key=_key))
    if mode == 'set':
        if not isinstance(got, list) or not isinstance(expected, list):
            return False
        def canon_outer(arr):
            inner = [sorted(x, key=_key) if isinstance(x, list) else x for x in arr]
            return sorted(inner, key=_key)
        return _deep_eq(canon_outer(got), canon_outer(expected))
    return _deep_eq(got, expected)

_result = {'ok': True, 'error': None, 'cases': [], 'logs': [], 'totalMs': 0.0}
_buf = io.StringIO()
_stdout = sys.stdout
sys.stdout = _buf
_t_all = time.perf_counter()
try:
    _ns = {}
    exec(_code, _ns)
    _fn = _ns.get(_fn_name) if _fn_name else None
    if _fn_name and not callable(_fn):
        raise NameError('could not find a function named "' + _fn_name + '"')
    for _t in (_tests if _fn_name else []):
        _args = copy.deepcopy(_t['input'])
        _start = time.perf_counter()
        try:
            _got = _fn(*_args)
            _ms = (time.perf_counter() - _start) * 1000
            _pass = _compare(_got, _t['expected'], _mode)
            _got_c = _canon(_got)
            try:
                json.dumps(_got_c)
            except Exception:
                _got_c = repr(_got)
            _result['cases'].append({'pass': _pass, 'got': _got_c, 'expected': _t['expected'], 'input': _t['input'], 'timeMs': _ms})
        except Exception as _ex:
            _result['cases'].append({'pass': False, 'expected': _t['expected'], 'input': _t['input'], 'timeMs': (time.perf_counter() - _start) * 1000, 'error': type(_ex).__name__ + ': ' + str(_ex)})
except Exception as _ex:
    _result['ok'] = False
    _result['error'] = type(_ex).__name__ + ': ' + str(_ex)
finally:
    sys.stdout = _stdout

_result['logs'] = _buf.getvalue().splitlines()[:200]
_result['totalMs'] = (time.perf_counter() - _t_all) * 1000
json.dumps(_result)
`

ctx.onmessage = async (e: MessageEvent) => {
  const msg = e.data as {
    type: 'warmup' | 'run'
    code?: string
    fnName?: string
    tests?: unknown[]
    compare?: string
  }

  if (msg.type === 'warmup') {
    try {
      await getPyodide()
      ctx.postMessage({ type: 'ready' })
    } catch (err) {
      ctx.postMessage({ type: 'loadError', error: String(err) })
    }
    return
  }

  try {
    const pyodide = await getPyodide()
    pyodide.globals.set(
      'LEETIE_PAYLOAD',
      JSON.stringify({ code: msg.code, fn: msg.fnName, tests: msg.tests, compare: msg.compare }),
    )
    const out = await pyodide.runPythonAsync(HARNESS)
    ctx.postMessage({ type: 'result', result: JSON.parse(out) })
  } catch (err) {
    ctx.postMessage({
      type: 'result',
      result: {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        cases: [],
        logs: [],
        totalMs: 0,
      },
    })
  }
}
