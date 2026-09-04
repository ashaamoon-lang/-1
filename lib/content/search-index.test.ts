import { describe, expect, test } from 'bun:test'

import { resolveJournalEntries } from './journal-fallback'
import {
  buildSearchIndex,
  journalEntries,
  matchScore,
  pageEntries,
  projectEntries,
  searchHaystack,
} from './search-index'

/**
 * What these assert, and why each one is here.
 *
 * The palette is the fourth consumer of facts the sitemap, `/llms.txt` and
 * `/[locale]/ai` already read. The risk is not that it renders wrong — that is
 * visible — but that it drifts: a page added to the catalogue and missing from
 * the palette, or an Indonesian palette listing English prose. Both are silent,
 * and both are checked here.
 */

const PRACTICE_COUNT = 3

describe('page entries', () => {
  test('every static route reaches the palette, in both languages', () => {
    const en = pageEntries('en')
    const id = pageEntries('id')

    expect(en.length).toBe(id.length)
    expect(en.length).toBeGreaterThan(PRACTICE_COUNT)

    // Same routes, different prose — the failure this catches is an
    // Indonesian palette carrying English labels, which is exactly what
    // `route-catalog.ts` was localized to prevent.
    expect(en.map((entry) => entry.id)).toEqual(id.map((entry) => entry.id))
    expect(en.map((entry) => entry.label)).not.toEqual(
      id.map((entry) => entry.label)
    )
  })

  test('practice pages are told apart from the rest', () => {
    const practices = pageEntries('en').filter(
      (entry) => entry.kind === 'practice'
    )
    expect(practices.length).toBe(PRACTICE_COUNT)
    for (const entry of practices) {
      expect(entry.href).toStartWith('/en/practice/')
    }
  })

  test('every entry carries a label, a description and a locale-prefixed href', () => {
    for (const locale of ['en', 'id'] as const) {
      for (const entry of pageEntries(locale)) {
        expect(entry.label.trim()).not.toBe('')
        expect(entry.description.trim()).not.toBe('')
        expect(entry.href).toStartWith(`/${locale}`)
      }
    }
  })
})

describe('project entries', () => {
  const projects = [
    {
      slug: { current: 'arus-balik' },
      title: 'Arus Balik',
      client: 'Museum MACAN',
      year: 2025,
      engagement: 'Commissioned work',
    },
    // No slug: there is no page to open, so it must not become a result.
    { slug: null, title: 'Untitled', client: null, year: null },
    // No title: nothing to show on the row.
    { slug: { current: 'ghost' }, title: '  ', client: 'X', year: 2024 },
  ]

  test('a project becomes one result, with its client and year', () => {
    const entries = projectEntries('en', projects)

    expect(entries.length).toBe(1)
    expect(entries[0]?.label).toBe('Arus Balik')
    expect(entries[0]?.href).toBe('/en/work/arus-balik')
    expect(entries[0]?.meta).toBe('Museum MACAN · 2025')
  })

  test('the client name is searchable even though the title omits it', () => {
    const [entry] = projectEntries('en', projects)
    expect(entry).toBeDefined()
    if (!entry) return
    expect(searchHaystack(entry)).toContain('macan')
  })

  test('no projects is not an error', () => {
    expect(projectEntries('en', null)).toEqual([])
    expect(projectEntries('en', [])).toEqual([])
  })
})

describe('journal entries', () => {
  test('the date is formatted in the reader’s locale, from the ISO string', () => {
    const entries = resolveJournalEntries('id', null)
    const results = journalEntries('id', entries)

    expect(results.length).toBe(entries.length)
    // Indonesian month names, not English ones — the same reason the journal
    // index formats at render time rather than storing a formatted string.
    expect(results.some((entry) => entry.meta?.includes('Februari'))).toBe(true)
  })

  test('every entry points at its own page', () => {
    for (const entry of journalEntries('en', resolveJournalEntries('en', null)))
      expect(entry.href).toStartWith('/en/journal/')
  })
})

describe('the whole index', () => {
  const index = buildSearchIndex('en', {
    projects: [
      {
        slug: { current: 'arus-balik' },
        title: 'Arus Balik',
        client: 'Museum MACAN',
        year: 2025,
        engagement: 'Commissioned work',
      },
    ],
    journal: resolveJournalEntries('en', null),
  })

  test('ids are unique, so a listbox can point at exactly one row', () => {
    const ids = index.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('it carries all four kinds, pages first and writing last', () => {
    const kinds = index.map((entry) => entry.kind)
    expect(new Set(kinds)).toEqual(
      new Set(['page', 'practice', 'project', 'journal'])
    )
    expect(kinds[0]).toBe('page')
    expect(kinds.at(-1)).toBe('journal')
  })

  test('the haystack is lowercased and holds everything the row shows', () => {
    for (const entry of index) {
      const haystack = searchHaystack(entry)
      expect(haystack).toBe(haystack.toLowerCase())
      expect(haystack).toContain(entry.label.toLowerCase())
    }
  })
})

describe('match score', () => {
  const journal = journalEntries('en', resolveJournalEntries('en', null))
  const scope = journal.find((entry) => entry.label.startsWith('Scope'))
  const home = pageEntries('en').find((entry) => entry.href === '/en')

  test('the defect it was written for: a title beats a passing mention', () => {
    expect(scope).toBeDefined()
    expect(home).toBeDefined()
    if (!scope || !home) return

    /*
     * Measured before this function existed. The home page's description
     * contains "scopes", so with structural ordering alone, typing the first
     * word of this journal entry's own headline highlighted the home page and
     * Enter opened it.
     */
    expect(searchHaystack(home)).toContain('scope')
    expect(matchScore(scope, 'scope')).toBeGreaterThan(
      matchScore(home, 'scope')
    )
  })

  test('the four grades', () => {
    expect(scope).toBeDefined()
    if (!scope) return

    expect(matchScore(scope, 'scope')).toBe(3) // title starts with it
    expect(matchScore(scope, 'deliverable')).toBe(2) // title contains it
    expect(matchScore(scope, 'ships')).toBe(1) // only the summary carries it
    expect(matchScore(scope, 'zzzz')).toBe(0) // not a result at all
  })

  test('an empty query leaves every entry equal, so the resting order stands', () => {
    const index = buildSearchIndex('en', {
      projects: null,
      journal: resolveJournalEntries('en', null),
    })
    for (const entry of index) {
      expect(matchScore(entry, '')).toBe(1)
      expect(matchScore(entry, '   ')).toBe(1)
    }
  })

  test('it is case- and whitespace-insensitive, like the field a reader types in', () => {
    expect(scope).toBeDefined()
    if (!scope) return
    expect(matchScore(scope, '  SCOPE ')).toBe(3)
  })
})
