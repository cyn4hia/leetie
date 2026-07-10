import type { CatalogEntry, GeneratedChecks, RemoteContent } from '../types'
import { curatedProblems } from '../data/problems'

const MIRROR = 'https://alfa-leetcode-api.onrender.com'
const CACHE_PREFIX = 'leetie:content:'
const CACHE_MAX_BYTES = 120_000

const base = import.meta.env.BASE_URL

/**
 * Full problem catalog. Prefers the statically generated
 * public/data/catalog.json (see scripts/fetch-problems.mjs); falls back to
 * the curated bundle so the app still works with no data fetch.
 */
export async function loadCatalog(): Promise<CatalogEntry[]> {
  try {
    const res = await fetch(`${base}data/catalog.json`)
    if (res.ok) {
      const entries = (await res.json()) as CatalogEntry[]
      return entries.filter((e) => !e.paidOnly)
    }
  } catch {
    // offline / not generated yet
  }
  return curatedProblems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    paidOnly: false,
    acRate: 0,
    tags: p.tags,
  }))
}

/** Slugs that have auto-generated submission checks. */
export async function loadChecksIndex(): Promise<string[]> {
  try {
    const res = await fetch(`${base}data/checks-index.json`)
    if (res.ok) return (await res.json()) as string[]
  } catch {
    // not generated yet
  }
  return []
}

/** Auto-generated checks for one problem (static file, same origin). */
export async function loadChecks(slug: string): Promise<GeneratedChecks | null> {
  try {
    const res = await fetch(`${base}data/checks/${slug}.json`)
    if (res.ok) return (await res.json()) as GeneratedChecks
  } catch {
    // no checks for this problem
  }
  return null
}

function cacheGet(slug: string): RemoteContent | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + slug)
    return raw ? (JSON.parse(raw) as RemoteContent) : null
  } catch {
    return null
  }
}

function cacheSet(slug: string, content: RemoteContent) {
  try {
    const raw = JSON.stringify(content)
    if (raw.length <= CACHE_MAX_BYTES) localStorage.setItem(CACHE_PREFIX + slug, raw)
  } catch {
    // quota exceeded — fine, it's just a cache
  }
}

/**
 * Problem statement for a non-curated problem.
 * Resolution order: localStorage cache → prefetched static file → live mirror.
 */
export async function loadContent(slug: string): Promise<RemoteContent | null> {
  const cached = cacheGet(slug)
  if (cached) return cached

  try {
    const res = await fetch(`${base}data/content/${slug}.json`)
    if (res.ok) {
      const content = (await res.json()) as RemoteContent
      cacheSet(slug, content)
      return content
    }
  } catch {
    // not prefetched
  }

  try {
    const res = await fetch(`${MIRROR}/select?titleSlug=${encodeURIComponent(slug)}`)
    if (res.ok) {
      const data = await res.json()
      if (typeof data.question === 'string' && data.question.length > 0) {
        const content: RemoteContent = { content: data.question, snippets: {} }
        cacheSet(slug, content)
        return content
      }
    }
  } catch {
    // mirror down
  }
  return null
}
