/**
 * The one promise this module makes, checked rather than intended.
 *
 * Scaffolding content is only defensible while it is guaranteed to disappear.
 * If the resolver ever merged the two sources — or preferred the fallback for
 * a field the CMS left blank — a reader would be shown invented articles
 * beside the studio's real ones with nothing on the page to tell them apart,
 * and that is a worse failure than the blank page this file exists to avoid.
 */

import { describe, expect, it } from 'bun:test'

import {
  fallbackEntry,
  fallbackSlugs,
  resolveJournalEntries,
} from './journal-fallback'
import { PRACTICES } from './practices'

describe('journal fallback', () => {
  it('yields the scaffolding when the CMS has nothing', () => {
    for (const locale of ['en', 'id'] as const) {
      const entries = resolveJournalEntries(locale, null)
      expect(entries.length, `${locale} has no scaffolding`).toBeGreaterThan(0)
      expect(resolveJournalEntries(locale, [])).toEqual(entries)
    }
  })

  it('yields only the CMS once the CMS has one entry', () => {
    const published = resolveJournalEntries('en', [
      {
        slug: 'a-real-entry',
        title: 'A real entry',
        summary: 'Written by the studio.',
        date: '2026-03-01',
        practice: 'consulting',
      },
    ])

    expect(published).toHaveLength(1)
    expect(published[0]?.slug).toBe('a-real-entry')

    // The whole point: not one scaffolding entry survives alongside it.
    const scaffolded = new Set(fallbackSlugs())
    expect(
      published.filter((entry) => scaffolded.has(entry.slug)),
      'scaffolding leaked into a published journal'
    ).toEqual([])
  })

  it('drops CMS entries that cannot be rendered', () => {
    // A document mid-edit has a title and no slug, or the reverse. Rendering
    // either produces a link to nowhere or an untitled row.
    const entries = resolveJournalEntries('en', [
      { slug: 'ok', title: 'Fine', summary: 's', date: '2026-01-01' },
      { slug: '', title: 'No slug', summary: 's', date: '2026-01-01' },
      { slug: 'no-title', title: '   ', summary: 's', date: '2026-01-01' },
    ])

    expect(entries.map((entry) => entry.slug)).toEqual(['ok'])
  })

  it('keeps a practice only when the site still has it', () => {
    const [kept] = resolveJournalEntries('en', [
      {
        slug: 'a',
        title: 'A',
        summary: 's',
        date: '2026-01-01',
        practice: 'consulting',
      },
    ])
    expect(kept?.practice).toBe('consulting')

    const [dropped] = resolveJournalEntries('en', [
      {
        slug: 'b',
        title: 'B',
        summary: 's',
        date: '2026-01-01',
        practice: 'retired-practice',
      },
    ])
    expect(
      dropped?.practice,
      'a practice that no longer exists must not render a label'
    ).toBeNull()
  })

  it('carries the same slugs in both languages', () => {
    // The URL is shared; only the words change. A slug present in one
    // language and not the other would 404 on the language switcher.
    const en = resolveJournalEntries('en', null).map((entry) => entry.slug)
    const id = resolveJournalEntries('id', null).map((entry) => entry.slug)
    expect(id).toEqual(en)
  })

  it('gives every scaffolding entry a body and a known practice', () => {
    for (const locale of ['en', 'id'] as const) {
      for (const entry of resolveJournalEntries(locale, null)) {
        expect(entry.body.length, `${entry.slug} has no body`).toBeGreaterThan(
          0
        )
        expect(
          entry.summary.length,
          `${entry.slug} has no summary`
        ).toBeGreaterThan(0)
        if (entry.practice !== null) {
          expect(PRACTICES).toContain(entry.practice)
        }
      }
    }
  })

  it('finds an entry by slug, and nothing by a slug it does not have', () => {
    const slug = fallbackSlugs()[0] ?? ''
    expect(fallbackEntry('en', slug)?.slug).toBe(slug)
    expect(fallbackEntry('en', 'not-a-real-entry')).toBeUndefined()
  })
})
