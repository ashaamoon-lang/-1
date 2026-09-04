import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/routing'
import { STATIC_ROUTE_TEMPLATES } from '@/lib/seo/route-catalog'

import type { JournalEntry } from './journal-fallback'
import { PRACTICE_SEGMENT } from './practices'

/**
 * What the command palette searches, assembled from sources that already
 * exist.
 *
 * ## Nothing here is a new source of truth
 *
 * Every page entry comes from `lib/seo/route-catalog.ts` — the same module
 * that feeds the sitemap, `/llms.txt` and `/[locale]/ai`, and which already
 * carries a label and a description in both languages because those strings
 * are read by people and by crawlers alike. Projects come from the catalogue's
 * own GROQ query, journal entries from `resolveJournalEntries`. The palette is
 * the fourth consumer of those facts rather than a fifth copy that can drift.
 *
 * That is also why this module takes already-fetched data as arguments rather
 * than fetching anything itself: the fetch belongs to the route handler, with
 * its `'use cache'` boundary, and a pure function is the part worth unit
 * testing.
 *
 * ## Why `/ai` is in here
 *
 * It is a real page with a real description, it is listed in the footer, and
 * a palette that omits pages the footer offers is a second, quieter site map
 * that disagrees with the first. Its description says plainly what it is, so
 * nobody arrives there by accident.
 */

export type SearchKind = 'page' | 'practice' | 'project' | 'journal'

export interface SearchEntry {
  /** Stable, unique within one index. Also the DOM id the listbox points at. */
  id: string
  kind: SearchKind
  label: string
  /** One line, already in the reader's language. */
  description: string
  /** Locale-prefixed path — what the item navigates to. */
  href: string
  /**
   * The secondary line: a client and year, or a date. `null` when the entry
   * has no such fact, which is not the same as an empty string — an empty
   * string would render an empty element and take vertical space.
   */
  meta: string | null
}

/**
 * A project as the catalogue's own query returns it.
 *
 * `slug` is Sanity's slug object, matching the shape
 * `vault/blocks/project-card` already declares — not a union with a bare
 * string. A union would mean branching on a representation here instead of
 * knowing the shape, which is the thing `anti-slop/no-runtime-typeof` exists
 * to prevent: parse at the boundary, then work with the domain value.
 */
export interface SearchProject {
  slug?: { current?: string | undefined } | null
  title?: string | null
  client?: string | null
  year?: number | string | null
  engagement?: string | null
}

/** A CMS string that is present and not an empty box an editor left. */
function usable(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/** Joins the facts an entry actually has, with the site's own separator. */
function joinMeta(
  parts: readonly (string | null | undefined)[]
): string | null {
  const present = parts.filter(usable)
  return present.length > 0 ? present.join(' · ') : null
}

/**
 * The static pages, including one entry per practice.
 *
 * The practice pages are already in `STATIC_ROUTE_TEMPLATES` — they are `○`
 * static routes with their own `<h1>` and canonical, not filter permutations
 * — so they arrive here for free and only need to be told apart by kind, so
 * the palette can group them.
 */
export function pageEntries(locale: Locale): SearchEntry[] {
  return STATIC_ROUTE_TEMPLATES.map((route) => {
    const isPractice = route.path.startsWith(`/${PRACTICE_SEGMENT}/`)

    return {
      id: `page:${route.path}`,
      kind: isPractice ? ('practice' as const) : ('page' as const),
      label: route.label[locale],
      description: route.description[locale],
      href: localizedPath(locale, route.path),
      /*
       * The path, locale-free, because `meta` is "the fact that identifies
       * this thing" and for a page that is where it lives. A project is
       * identified by its client and year, an entry by its date; leaving a
       * page's rail empty would be the only row in the index that answers
       * nothing.
       *
       * Locale-free deliberately: `/journal` is the same page in both
       * languages, and `/id/journal` in the rail would be repeating the
       * prefix every row already shares.
       */
      meta: route.path,
    }
  })
}

export function projectEntries(
  locale: Locale,
  projects: readonly SearchProject[] | null
): SearchEntry[] {
  return (projects ?? []).flatMap((project) => {
    const slug = project.slug?.current
    /*
     * A project with no slug has no page to navigate to, and a project with
     * no title has nothing to show on the row. Skipping is the only honest
     * option — `project-card` drops the same document for the same reason,
     * so the palette and the catalogue agree on what exists.
     */
    if (!usable(slug) || !usable(project.title)) return []

    const year = project.year == null ? null : String(project.year)

    return [
      {
        id: `project:${slug}`,
        kind: 'project' as const,
        label: project.title,
        description: project.engagement ?? '',
        href: localizedPath(locale, `/work/${slug}`),
        meta: joinMeta([project.client, year]),
      },
    ]
  })
}

export function journalEntries(
  locale: Locale,
  entries: readonly JournalEntry[]
): SearchEntry[] {
  /*
   * The reader's own date formatting, from the stored ISO string — the same
   * decision the journal index page records. A pre-formatted string in the
   * content would be English inside the Indonesian palette.
   */
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return entries.map((entry) => ({
    id: `journal:${entry.slug}`,
    kind: 'journal' as const,
    label: entry.title,
    description: entry.summary,
    href: localizedPath(locale, `/journal/${entry.slug}`),
    meta: entry.date ? formatter.format(new Date(entry.date)) : null,
  }))
}

/**
 * The whole index, in the order the palette shows it before anything is
 * typed: pages first, then practices, then work, then writing.
 *
 * That order is the site's own — it is the order the footer's Index column
 * lists, and the order a visitor meets these things scrolling the home page.
 * Sorting by relevance happens only once there is a query to be relevant to.
 */
export function buildSearchIndex(
  locale: Locale,
  sources: {
    projects: readonly SearchProject[] | null
    journal: readonly JournalEntry[]
  }
): SearchEntry[] {
  const pages = pageEntries(locale)

  return [
    ...pages.filter((entry) => entry.kind === 'page'),
    ...pages.filter((entry) => entry.kind === 'practice'),
    ...projectEntries(locale, sources.projects),
    ...journalEntries(locale, sources.journal),
  ]
}

/**
 * The haystack one entry is matched against.
 *
 * Everything the reader can see on the row, lowercased and joined — so typing
 * a client's name finds the project whose title does not contain it, which is
 * the case that makes this feature more than a second navigation menu.
 */
export function searchHaystack(entry: SearchEntry): string {
  return [entry.label, entry.description, entry.meta ?? '']
    .join(' ')
    .toLowerCase()
}

/**
 * How well an entry answers a query. `0` means it does not.
 *
 * ## The wrong answer this exists to prevent, measured
 *
 * Without it the palette showed results in structural order — pages, then
 * practices, then work, then writing — and highlighted the first one. Typing
 * **`scope`**, the first word of the journal entry "Scope is the
 * deliverable", highlighted the **home page**, because the home page's
 * description happens to contain "scopes". Pressing Enter took the reader
 * somewhere they had not asked for.
 *
 * Matching on everything the row shows (`searchHaystack`) is what makes a
 * client's name findable; it is also what lets a passing mention outrank a
 * title. Both are true at once, so the fix is not to narrow the haystack but
 * to say which kind of match is worth more:
 *
 * | score | meaning                                   |
 * | ----- | ----------------------------------------- |
 * | 3     | the title starts with what was typed       |
 * | 2     | the title contains it                      |
 * | 1     | something else on the row contains it      |
 * | 0     | no match — the row is not a result at all  |
 *
 * An empty query scores everything `1`, which leaves the resting order alone:
 * before anything is typed there is nothing to be relevant to, and the
 * site's own order is the honest one.
 */
export function matchScore(entry: SearchEntry, query: string): number {
  const needle = query.trim().toLowerCase()
  if (needle === '') return 1

  const label = entry.label.toLowerCase()
  if (label.startsWith(needle)) return 3
  if (label.includes(needle)) return 2

  return searchHaystack(entry).includes(needle) ? 1 : 0
}
