/**
 * Python runner: Pyodide (CPython → WASM) loaded from CDN inside a worker so
 * user code can never freeze the UI. Comparison, grading, and LeetCode-style
 * conveniences (class Solution, ListNode/TreeNode, void/in-place problems)
 * run inside the Python harness, mirroring jsWorker.ts.
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
import json, time, sys, io, copy, collections

_payload = json.loads(LEETIE_PAYLOAD)
_code = _payload['code']
_fn_name = _payload['fn']
_tests = _payload['tests']
_mode = _payload['compare']
_param_types = _payload.get('paramTypes') or []
_return_type = _payload.get('returnType')
_output_param = _payload.get('outputParam')

_PRELUDE = '''
from typing import List, Optional, Dict, Set, Tuple, Any
import collections, math, heapq, bisect, itertools, functools, string, re

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
'''

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

_NODE_LIMIT = 100000

def _type_kind(t):
    if not t:
        return 'plain'
    t = ''.join(str(t).split())
    if t == 'ListNode':
        return 'list'
    if t in ('ListNode[]', 'list<ListNode>'):
        return 'listArr'
    if t == 'TreeNode':
        return 'tree'
    return 'plain'

_result = {'ok': True, 'error': None, 'cases': [], 'logs': [], 'totalMs': 0.0}
_buf = io.StringIO()
_stdout = sys.stdout
sys.stdout = _buf
_t_all = time.perf_counter()
try:
    _ns = {}
    exec(_PRELUDE, _ns)
    exec(_code, _ns)

    def _to_list(arr):
        _LN = _ns['ListNode']
        head = tail = None
        for v in arr:
            node = _LN(v)
            if head is None:
                head = node
            else:
                tail.next = node
            tail = node
        return head

    def _from_list(node):
        out = []
        while node is not None and len(out) < _NODE_LIMIT:
            out.append(node.val)
            node = node.next
        return out

    def _to_tree(arr):
        _TN = _ns['TreeNode']
        if not arr or arr[0] is None:
            return None
        root = _TN(arr[0])
        queue = collections.deque([root])
        i = 1
        while queue and i < len(arr):
            node = queue.popleft()
            if i < len(arr):
                v = arr[i]; i += 1
                if v is not None:
                    node.left = _TN(v)
                    queue.append(node.left)
            if i < len(arr):
                v = arr[i]; i += 1
                if v is not None:
                    node.right = _TN(v)
                    queue.append(node.right)
        return root

    def _from_tree(root):
        if root is None:
            return []
        out = []
        queue = collections.deque([root])
        while queue and len(out) < _NODE_LIMIT:
            node = queue.popleft()
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                queue.append(node.left)
                queue.append(node.right)
        while out and out[-1] is None:
            out.pop()
        return out

    def _build_arg(v, kind):
        if kind == 'list':
            return _to_list(v)
        if kind == 'listArr':
            return [_to_list(x) for x in v]
        if kind == 'tree':
            return _to_tree(v)
        return v

    def _convert_result(v, kind):
        if kind == 'list':
            return _from_list(v)
        if kind == 'listArr':
            return [_from_list(x) for x in (v or [])]
        if kind == 'tree':
            return _from_tree(v)
        return v

    _fn = _ns.get(_fn_name) if _fn_name else None
    _sol_cls = None
    if _fn_name and not callable(_fn):
        _sol_cls = _ns.get('Solution')
        if _sol_cls is not None and not callable(getattr(_sol_cls(), _fn_name, None)):
            _sol_cls = None
    if _fn_name and not callable(_fn) and _sol_cls is None:
        raise NameError('could not find a function named "' + _fn_name + '" (a def or a Solution method)')

    _kinds = [_type_kind(t) for t in _param_types]
    if _output_param is not None:
        _ret_kind = _kinds[_output_param] if _output_param < len(_kinds) else 'plain'
    else:
        _ret_kind = _type_kind(_return_type)

    for _t in (_tests if _fn_name else []):
        _start = time.perf_counter()
        try:
            _args = [
                _build_arg(copy.deepcopy(a), _kinds[i] if i < len(_kinds) else 'plain')
                for i, a in enumerate(_t['input'])
            ]
            # fresh Solution per test, matching LeetCode — no state leaks
            _call = getattr(_sol_cls(), _fn_name) if _sol_cls is not None else _fn
            _ret = _call(*_args)
            if _output_param is not None:
                _got = _convert_result(_args[_output_param], _ret_kind)
            else:
                _got = _convert_result(_ret, _ret_kind)
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
    paramTypes?: string[] | null
    returnType?: string | null
    outputParam?: number | null
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
      JSON.stringify({
        code: msg.code,
        fn: msg.fnName,
        tests: msg.tests,
        compare: msg.compare,
        paramTypes: msg.paramTypes ?? null,
        returnType: msg.returnType ?? null,
        outputParam: msg.outputParam ?? null,
      }),
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
