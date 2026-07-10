#!/usr/bin/env node
/**
 * Generates submission checks for every fetched problem by pairing
 * LeetCode's own sample inputs (exampleTestcases, in exact parameter order)
 * with the expected outputs parsed from the problem statement's examples.
 *
 * Deliberately conservative: any ambiguity (unparseable values, count
 * mismatches, cross-validation failure, multiple-valid-answer problems,
 * unsupported types) skips the problem rather than risking a wrong check.
 *
 * Usage: node scripts/generate-checks.mjs
 * Reads  public/data/content/<slug>.json  (needs meta + exampleTestcases)
 * Writes public/data/checks/<slug>.json + public/data/checks-index.json
 */
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'

const DATA_DIR = path.resolve(import.meta.dirname, '../public/data')
const CONTENT_DIR = path.join(DATA_DIR, 'content')
const CHECKS_DIR = path.join(DATA_DIR, 'checks')

// ---------- type support ----------

const SCALARS = new Set(['integer', 'long', 'double', 'float', 'boolean', 'string', 'character'])
const STRUCTS = new Set(['ListNode', 'TreeNode'])

/** Normalize `list<list<integer>>` → `integer[][]`, keep `integer[]` as-is. */
function normalizeType(t) {
  if (!t) return null
  let s = String(t).replace(/\s/g, '')
  let depth = 0
  while (/^list</.test(s) && s.endsWith('>')) {
    s = s.slice(5, -1)
    depth++
  }
  while (s.endsWith('[]')) {
    s = s.slice(0, -2)
    depth++
  }
  return { base: s, depth }
}

function isSupported(t) {
  const n = normalizeType(t)
  if (!n) return false
  if (SCALARS.has(n.base)) return n.depth <= 3
  if (STRUCTS.has(n.base)) return n.base === 'ListNode' ? n.depth <= 1 : n.depth === 0
  return false
}

// ---------- html → text ----------

const ENTITIES = {
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  apos: "'",
  minus: '-',
  ldquo: '"',
  rdquo: '"',
  lsquo: "'",
  rsquo: "'",
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => ENTITIES[name.toLowerCase()] ?? `&${name};`)
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<(br|\/p|\/div|\/pre|\/li|\/ul|\/ol)\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
}

// ---------- quote/bracket-aware scanning ----------

/** True when brackets are balanced outside of double-quoted strings. */
function isBalanced(s) {
  let depth = 0
  let inStr = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (ch === '\\') i++
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '[' || ch === '{' || ch === '(') depth++
    else if (ch === ']' || ch === '}' || ch === ')') depth--
  }
  return depth === 0 && !inStr
}

/** Split on top-level commas (outside brackets/strings). */
function topLevelSplit(s) {
  const parts = []
  let depth = 0
  let inStr = false
  let cur = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      cur += ch
      if (ch === '\\') {
        cur += s[++i] ?? ''
      } else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') {
      inStr = true
      cur += ch
    } else if (ch === '[' || ch === '{' || ch === '(') {
      depth++
      cur += ch
    } else if (ch === ']' || ch === '}' || ch === ')') {
      depth--
      cur += ch
    } else if (ch === ',' && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

/** Extract the leading JSON value from a string that may have trailing prose. */
function extractLeadingJson(s) {
  s = s.trim().replace(/[“”]/g, '"')
  try {
    return { ok: true, value: JSON.parse(s) }
  } catch {
    // fall through to token extraction
  }
  let token = null
  if (s[0] === '[' || s[0] === '{' || s[0] === '"') {
    let depth = 0
    let inStr = false
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      if (inStr) {
        if (ch === '\\') i++
        else if (ch === '"') {
          inStr = false
          if (depth === 0) {
            token = s.slice(0, i + 1)
            break
          }
        }
        continue
      }
      if (ch === '"') inStr = true
      else if (ch === '[' || ch === '{') depth++
      else if (ch === ']' || ch === '}') {
        depth--
        if (depth === 0) {
          token = s.slice(0, i + 1)
          break
        }
      }
    }
  } else {
    const m = s.match(/^(-?\d+(?:\.\d+)?(?:[eE]-?\d+)?|true|false|null)\b/)
    if (m) token = m[1]
  }
  if (token === null) return { ok: false }
  try {
    return { ok: true, value: JSON.parse(token) }
  } catch {
    return { ok: false }
  }
}

// ---------- example parsing from content ----------

function parseExamplePairs(text) {
  const lines = text.split('\n')
  const pairs = []
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*Input\s*:?/i.test(lines[i])) continue
    let inputText = lines[i].replace(/^\s*Input\s*:?\s*/i, '')
    let j = i + 1
    while (j < lines.length && !/^\s*Output\s*:?/i.test(lines[j]) && j - i < 30) {
      if (/^\s*Input\s*:?/i.test(lines[j])) break
      inputText += '\n' + lines[j]
      j++
    }
    if (j >= lines.length || !/^\s*Output\s*:?/i.test(lines[j])) {
      i = j - 1
      continue
    }
    let outText = lines[j].replace(/^\s*Output\s*:?\s*/i, '')
    let k = j + 1
    while (
      k < lines.length &&
      k - j < 30 &&
      !(outText.trim() && isBalanced(outText)) &&
      !/^\s*(Explanation|Note|Constraints|Example|Input)\b/i.test(lines[k])
    ) {
      outText += '\n' + lines[k]
      k++
    }
    pairs.push({ inputText: inputText.trim(), outText: outText.trim() })
    i = k - 1
  }
  return pairs
}

/** Parse `name = value, name2 = value2` into a map (values as raw JSON). */
function parseNamedInputs(inputText) {
  const joined = inputText.replace(/\n/g, ' ')
  const out = {}
  for (const part of topLevelSplit(joined)) {
    const m = part.match(/^\s*([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/)
    if (!m) return null
    const parsed = extractLeadingJson(m[2])
    if (!parsed.ok) return null
    out[m[1]] = parsed.value
  }
  return out
}

// ---------- compare-mode inference ----------

// must reference the ANSWER's order ("return ... in any order"), not setup prose
// like "you can order the deck in any order" — and only makes sense for arrays
const ANY_ORDER_RE =
  /(?:\breturn|\banswer)[^.]{0,80}?\bin any order\b|\border of (?:the )?(?:output|answers?|elements|pairs|triplets)[^.]{0,50}\bdoes(?:n't| not) matter\b/i

function inferCompare(text, returnType) {
  const rt = normalizeType(returnType)
  if (rt && (rt.base === 'double' || rt.base === 'float')) return 'float'
  if (rt && SCALARS.has(rt.base) && rt.depth >= 1 && ANY_ORDER_RE.test(text)) {
    // depth>=2 uses 'set' (inner order ignored too). For pair/coordinate
    // returns that is looser than ideal, but the strict alternative would
    // reject correct solutions on group/triplet problems — rejecting correct
    // code is the worse failure for a practice app.
    return rt.depth >= 2 ? 'set' : 'unordered'
  }
  return 'exact'
}

const MULTI_ANSWER_RE =
  /also (?:a )?valid|also (?:be )?accepted|any of (?:them|the)|multiple (?:valid |possible |correct )?answers|any valid (?:answer|order will|string|array|node|point|permutation)|answers? (?:that )?will be accepted|return any|one possible answer|another valid|other valid answers?|answers? may vary/i

const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// ---------- main ----------

async function main() {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.json'))
  await rm(CHECKS_DIR, { recursive: true, force: true })
  await mkdir(CHECKS_DIR, { recursive: true })

  const stats = {
    total: files.length,
    generated: 0,
    noMeta: 0,
    design: 0,
    unsupportedType: 0,
    multiAnswer: 0,
    noExampleInputs: 0,
    badInputs: 0,
    countMismatch: 0,
    badOutputs: 0,
    crossCheckFailed: 0,
  }
  const index = []

  for (const file of files) {
    const slug = file.replace(/\.json$/, '')
    const data = JSON.parse(await readFile(path.join(CONTENT_DIR, file), 'utf8'))
    const { content, meta, exampleTestcases } = data

    if (!meta || !content) {
      stats.noMeta++
      continue
    }
    if (meta.classname || meta.systemdesign || !meta.name || !Array.isArray(meta.params) || !meta.return) {
      stats.design++
      continue
    }
    if (meta.manual) {
      stats.design++
      continue
    }

    const returnType = meta.return.type
    const isVoid = returnType === 'void'
    const outputParam = isVoid ? (meta.output?.paramindex ?? 0) : null
    const effectiveReturn = isVoid ? meta.params[outputParam]?.type : returnType
    if (
      !meta.params.every((p) => isSupported(p.type)) ||
      !effectiveReturn ||
      !isSupported(effectiveReturn)
    ) {
      stats.unsupportedType++
      continue
    }

    const text = htmlToText(content)
    if (MULTI_ANSWER_RE.test(text)) {
      stats.multiAnswer++
      continue
    }

    // inputs: official sample testcases, one JSON value per line, param-ordered
    if (!exampleTestcases) {
      stats.noExampleInputs++
      continue
    }
    const lines = exampleTestcases.split('\n').filter((l) => l.trim() !== '')
    const k = meta.params.length
    if (k === 0 || lines.length === 0 || lines.length % k !== 0) {
      stats.countMismatch++
      continue
    }
    const parsedLines = []
    let inputsOk = true
    for (const line of lines) {
      const v = extractLeadingJson(line)
      if (!v.ok) {
        inputsOk = false
        break
      }
      parsedLines.push(v.value)
    }
    if (!inputsOk) {
      stats.badInputs++
      continue
    }
    const n = lines.length / k
    const inputSets = []
    for (let i = 0; i < n; i++) inputSets.push(parsedLines.slice(i * k, i * k + k))

    // outputs: parsed from the statement's Example blocks
    const pairs = parseExamplePairs(text)
    if (pairs.length !== n) {
      stats.countMismatch++
      continue
    }
    const expecteds = []
    let outputsOk = true
    for (const p of pairs) {
      const v = extractLeadingJson(p.outText)
      if (!v.ok) {
        outputsOk = false
        break
      }
      expecteds.push(v.value)
    }
    if (!outputsOk) {
      stats.badOutputs++
      continue
    }

    // cross-validation: the statement's example-1 named inputs must agree
    // with the official testcase lines (guards against ordering surprises)
    const named = parseNamedInputs(pairs[0].inputText)
    if (named) {
      const fromContent = meta.params.map((p) => named[p.name])
      if (
        Object.keys(named).length !== k ||
        fromContent.some((v) => v === undefined) ||
        !deepEq(fromContent, inputSets[0])
      ) {
        stats.crossCheckFailed++
        continue
      }
    } else {
      stats.crossCheckFailed++
      continue
    }

    const checks = {
      fnName: meta.name,
      params: meta.params.map((p) => ({ name: p.name, type: p.type })),
      returnType,
      outputParam,
      compare: inferCompare(text, effectiveReturn),
      tests: inputSets.map((input, i) => ({ input, expected: expecteds[i] })),
    }
    await writeFile(path.join(CHECKS_DIR, `${slug}.json`), JSON.stringify(checks))
    index.push(slug)
    stats.generated++
  }

  index.sort()
  await writeFile(path.join(DATA_DIR, 'checks-index.json'), JSON.stringify(index))
  console.log(stats)
  console.log(`wrote ${index.length} check files + checks-index.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
