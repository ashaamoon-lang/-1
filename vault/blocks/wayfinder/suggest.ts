/**
 * What a reader who reached a dead address was most likely looking for.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the matching is testable without a page. The candidates are the
 * site's own search index — the one `/{locale}/search.json` already serves the
 * ⌘K palette — so a suggestion can only ever be somewhere that exists. Pages
 * are left out: the 404 already offers Work, Studio and Journal by name, and a
 * second link with the same name would be the same offer twice.
 *
 * Dead addresses fail in two ways, so there are two signals. A mistyped slug
 * ("arus-balk") is close in spelling to the real one, which an edit distance
 * measures. An address whose words are right but whose shape is not
 * ("/work/scope-deliverable") shares the title's words, which the palette's
 * own `matchScore` already ranks. A candidate close in neither is not offered:
 * no suggestion is better than a wrong one.
 */

import { matchScore, type SearchEntry } from '@/lib/content/search-index'

/** The most the 404 offers. More than three is a list to read, not a hint. */
export const MOST = 3

/** How alike two slugs must be to be offered, where 1 is identical. */
const ALIKE = 0.6

/** A slug this short says too little to match on. */
const SHORTEST = 3

interface Scored {
  entry: SearchEntry
  score: number
}

/** Levenshtein distance: the fewest single-character edits from a to b. */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const substitution =
        (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1)
      current.push(
        Math.min(
          (previous[j] ?? 0) + 1,
          (current[j - 1] ?? 0) + 1,
          substitution
        )
      )
    }
    previous = current
  }
  return previous[b.length] ?? 0
}

/** 1 for identical strings, 0 for nothing in common. */
export function likeness(a: string, b: string): number {
  const longest = Math.max(a.length, b.length)
  if (longest === 0) return 1
  return 1 - editDistance(a, b) / longest
}

function decoded(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** The last segment of an address, decoded and lowercased, locales removed. */
export function deadSlug(pathname: string, locales: readonly string[]): string {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decoded(segment).toLowerCase())
    .filter((segment) => !locales.includes(segment))
  return segments.at(-1) ?? ''
}

/** The last segment of a candidate's own address. */
function ownSlug(entry: SearchEntry): string {
  return entry.href.split('/').findLast(Boolean)?.toLowerCase() ?? ''
}

export function suggest(
  pathname: string,
  entries: readonly SearchEntry[],
  locales: readonly string[]
): SearchEntry[] {
  const slug = deadSlug(pathname, locales)
  if (slug.length < SHORTEST) return []

  const words = slug.replaceAll(/[-_]+/g, ' ')
  const scored: Scored[] = []
  for (const entry of entries) {
    if (entry.kind === 'page') continue
    const alike = likeness(slug, ownSlug(entry))
    const named = matchScore(entry, words)
    if (alike < ALIKE && named < 2) continue
    scored.push({ entry, score: alike + named / 3 })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MOST)
    .map(({ entry }) => entry)
}
