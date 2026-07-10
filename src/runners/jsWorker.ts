import { compareValues } from './compare'
import type { CompareMode, RunResult, TestCase } from '../types'

interface RunMessage {
  code: string
  fnName: string
  tests: TestCase[]
  compare: CompareMode
  paramTypes?: string[] | null
  returnType?: string | null
  outputParam?: number | null
}

const ctx = self as unknown as {
  postMessage(msg: unknown): void
  onmessage: ((e: MessageEvent) => void) | null
}

// LeetCode-compatible node constructors, passed to user code as function
// parameters — so a user-declared `class ListNode {}` shadows them instead
// of colliding, and a leading "use strict" in user code still applies.
const ListNodeCtor = new Function(
  'return function ListNode(val, next) { this.val = (val === undefined ? 0 : val); this.next = (next === undefined ? null : next); }',
)() as unknown
const TreeNodeCtor = new Function(
  'return function TreeNode(val, left, right) { this.val = (val === undefined ? 0 : val); this.left = (left === undefined ? null : left); this.right = (right === undefined ? null : right); }',
)() as unknown

const NODE_LIMIT = 100_000

type Kind = 'plain' | 'list' | 'listArr' | 'tree'

function typeKind(t?: string | null): Kind {
  if (!t) return 'plain'
  const s = t.replace(/\s/g, '')
  if (s === 'ListNode') return 'list'
  if (s === 'ListNode[]' || s === 'list<ListNode>') return 'listArr'
  if (s === 'TreeNode') return 'tree'
  return 'plain'
}

interface LNode {
  val: unknown
  next: LNode | null
}
interface TNode {
  val: unknown
  left: TNode | null
  right: TNode | null
}

function arrayToList(arr: unknown[]): LNode | null {
  let head: LNode | null = null
  let tail: LNode | null = null
  for (const v of arr) {
    const node: LNode = { val: v, next: null }
    if (tail) tail.next = node
    else head = node
    tail = node
  }
  return head
}

function listToArray(node: LNode | null): unknown[] {
  const out: unknown[] = []
  let n = node
  while (n && out.length < NODE_LIMIT) {
    out.push(n.val)
    n = n.next
  }
  return out
}

function arrayToTree(arr: Array<unknown | null>): TNode | null {
  if (!arr.length || arr[0] == null) return null
  const root: TNode = { val: arr[0], left: null, right: null }
  const queue: TNode[] = [root]
  let i = 1
  let q = 0
  while (q < queue.length && i < arr.length) {
    const node = queue[q++]
    if (i < arr.length) {
      const v = arr[i++]
      if (v != null) {
        node.left = { val: v, left: null, right: null }
        queue.push(node.left)
      }
    }
    if (i < arr.length) {
      const v = arr[i++]
      if (v != null) {
        node.right = { val: v, left: null, right: null }
        queue.push(node.right)
      }
    }
  }
  return root
}

function treeToArray(root: TNode | null): Array<unknown | null> {
  if (!root) return []
  const out: Array<unknown | null> = []
  const queue: Array<TNode | null> = [root]
  let q = 0
  while (q < queue.length && out.length < NODE_LIMIT) {
    const node = queue[q++]
    if (!node) {
      out.push(null)
    } else {
      out.push(node.val)
      queue.push(node.left)
      queue.push(node.right)
    }
  }
  while (out.length && out[out.length - 1] === null) out.pop()
  return out
}

function buildArg(v: unknown, kind: Kind): unknown {
  if (kind === 'list') return arrayToList(v as unknown[])
  if (kind === 'listArr') return (v as unknown[][]).map(arrayToList)
  if (kind === 'tree') return arrayToTree(v as unknown[])
  return v
}

function convertResult(v: unknown, kind: Kind): unknown {
  if (kind === 'list') return listToArray(v as LNode | null)
  if (kind === 'listArr') return ((v as Array<LNode | null>) ?? []).map(listToArray)
  if (kind === 'tree') return treeToArray(v as TNode | null)
  return v
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
  const { code, fnName, tests, compare, paramTypes, returnType, outputParam } =
    e.data as RunMessage
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
    // user code runs in a nested function scope: class/let declarations of
    // ListNode/TreeNode legally shadow the provided constructors there
    if (fnName) {
      fn = new Function(
        'ListNode',
        'TreeNode',
        `return (function () {\n${code}\n;return typeof ${fnName} === 'function' ? ${fnName} : undefined;\n})();`,
      )(ListNodeCtor, TreeNodeCtor)
      if (typeof fn !== 'function') {
        throw new Error(`could not find a function named "${fnName}"`)
      }
    } else {
      // scratch mode: no test harness, just execute and capture output
      new Function('ListNode', 'TreeNode', `(function () {\n${code}\n})();`)(
        ListNodeCtor,
        TreeNodeCtor,
      )
    }
  } catch (err) {
    result.ok = false
    result.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }

  if (result.ok && typeof fn === 'function') {
    const kinds = (paramTypes ?? []).map(typeKind)
    const retKind =
      outputParam != null ? (kinds[outputParam] ?? 'plain') : typeKind(returnType)
    for (const t of tests) {
      const input = structuredClone(t.input)
      const start = performance.now()
      try {
        const args = input.map((v, i) => buildArg(v, kinds[i] ?? 'plain'))
        const ret = (fn as (...a: unknown[]) => unknown)(...args)
        const raw = outputParam != null ? args[outputParam] : ret
        const got = convertResult(raw, retKind)
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
