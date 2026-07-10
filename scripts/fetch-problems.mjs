#!/usr/bin/env node
/**
 * Pulls the LeetCode problem catalog (and optionally per-problem content)
 * into public/data/ so leetie can be served fully statically.
 *
 * Usage:
 *   node scripts/fetch-problems.mjs                 # catalog only
 *   node scripts/fetch-problems.mjs --content 200   # + content for first 200 free problems
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const GRAPHQL = 'https://leetcode.com/graphql'
const OUT_DIR = path.resolve(import.meta.dirname, '../public/data')
const CONTENT_DIR = path.join(OUT_DIR, 'content')
const PAGE_SIZE = 100
const DELAY_MS = 350

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function gql(query, variables) {
  const res = await fetch(GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      'User-Agent': 'leetie-fetch (personal practice app)',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

const LIST_QUERY = `
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    total: totalNum
    questions: data {
      frontendQuestionId: questionFrontendId
      title
      titleSlug
      difficulty
      paidOnly: isPaidOnly
      acRate
      topicTags { name }
    }
  }
}`

const CONTENT_QUERY = `
query questionContent($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    content
    codeSnippets { langSlug code }
    metaData
    exampleTestcases
  }
}`

async function fetchCatalog() {
  const all = []
  let skip = 0
  let total = Infinity
  while (skip < total) {
    for (let attempt = 1; ; attempt++) {
      try {
        const data = await gql(LIST_QUERY, { categorySlug: '', skip, limit: PAGE_SIZE, filters: {} })
        total = data.problemsetQuestionList.total
        all.push(...data.problemsetQuestionList.questions)
        break
      } catch (err) {
        if (attempt >= 4) throw err
        console.warn(`  page @${skip} failed (${err.message}), retrying...`)
        await sleep(1500 * attempt)
      }
    }
    skip += PAGE_SIZE
    process.stdout.write(`\r  catalog: ${Math.min(skip, total)}/${total}`)
    await sleep(DELAY_MS)
  }
  console.log()
  return all.map((q) => ({
    id: q.frontendQuestionId,
    title: q.title,
    slug: q.titleSlug,
    difficulty: q.difficulty,
    paidOnly: q.paidOnly,
    acRate: Math.round(q.acRate * 10) / 10,
    tags: q.topicTags.map((t) => t.name),
  }))
}

async function fetchContent(slug) {
  const data = await gql(CONTENT_QUERY, { titleSlug: slug })
  const q = data.question
  if (!q?.content) return null
  const snippets = {}
  for (const s of q.codeSnippets ?? []) {
    if (s.langSlug === 'python3') snippets.python = s.code
    if (s.langSlug === 'javascript') snippets.javascript = s.code
  }
  let meta = null
  try {
    meta = q.metaData ? JSON.parse(q.metaData) : null
  } catch {
    // a handful of problems have malformed metaData — checks just won't generate
  }
  return {
    content: q.content,
    snippets,
    meta,
    exampleTestcases: q.exampleTestcases ?? null,
  }
}

async function main() {
  const args = process.argv.slice(2)
  const contentIdx = args.indexOf('--content')
  const contentArg = contentIdx >= 0 ? (args[contentIdx + 1] ?? '0') : '0'
  const contentCount = contentArg === 'all' ? Infinity : parseInt(contentArg, 10)

  await mkdir(CONTENT_DIR, { recursive: true })

  const catalogPath = path.join(OUT_DIR, 'catalog.json')
  let catalog
  if (existsSync(catalogPath) && args.includes('--skip-catalog')) {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
    console.log(`catalog: reusing existing (${catalog.length} problems)`)
  } else {
    console.log('fetching catalog...')
    catalog = await fetchCatalog()
    await writeFile(catalogPath, JSON.stringify(catalog))
    console.log(`wrote ${catalogPath} (${catalog.length} problems)`)
  }

  if (contentCount > 0) {
    const free = catalog.filter((q) => !q.paidOnly)
    const wanted = contentCount === Infinity ? free : free.slice(0, contentCount)
    console.log(`fetching content for ${wanted.length} problems...`)
    let done = 0
    let skipped = 0
    const failures = []
    for (const q of wanted) {
      const file = path.join(CONTENT_DIR, `${q.slug}.json`)
      done++
      if (existsSync(file)) {
        skipped++
        continue
      }
      let fetched = false
      for (let attempt = 1; attempt <= 4 && !fetched; attempt++) {
        try {
          const content = await fetchContent(q.slug)
          if (content) await writeFile(file, JSON.stringify(content))
          fetched = true
        } catch (err) {
          if (attempt === 4) failures.push(`${q.slug}: ${err.message}`)
          else await sleep(2000 * attempt)
        }
      }
      process.stdout.write(`\r  content: ${done}/${wanted.length}`)
      await sleep(DELAY_MS)
    }
    console.log(`\ncontent done (${skipped} already cached, ${failures.length} failed)`)
    for (const f of failures) console.warn('  FAILED ' + f)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
