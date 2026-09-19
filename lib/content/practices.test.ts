/**
 * The vocabulary agrees with itself.
 *
 * ## What this catches that nothing else did
 *
 * Three separate places name what this studio does, and until this test they
 * were three independent lists that happened to agree:
 *
 *  - `lib/content/disciplines.ts` — the canonical keys, which drive the
 *    routes, the schema's closed list, and the sitemap;
 *  - `messages/{en,id}.json` — the human labels for those keys;
 *  - `lib/seo/site.ts` `services` — what the JSON-LD tells an answer engine.
 *
 * Nothing checked that a key added in one appeared in the others. Adding a
 * fourth discipline would have produced a route with an untranslated label
 * (React renders the key, so `/work/discipline/etching` would offer a chip
 * reading "etching"), and structured data that advertises three services for
 * a catalogue that filters into four. Neither fails a build, a type check, or
 * axe.
 *
 * ## Why it reads the JSON rather than the typed dictionary
 *
 * `messages/en.d.json.ts` gives next-intl its types, so a *missing* key is
 * already a type error at the call site. What it cannot say is whether the
 * Indonesian file has the same keys as the English one — the types are
 * generated from `en` alone. Reading both files is the only way to compare
 * them.
 */

import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

import { SITE } from '@/lib/seo/site'

import { capabilityItems, PRACTICES } from './practices'

/**
 * Read from disk, not imported.
 *
 * `import … from '../../messages/en.json'` resolves to `messages/en.d.json.ts`
 * — the declaration next-intl's types are generated into — and `tsc` rejects
 * it without `allowArbitraryExtensions`. Reading the file is also the more
 * honest instrument: the claim is about what the *dictionaries* hold, and a
 * declaration file is a description of one of them.
 */
function labelsFor(locale: string): Record<string, string | undefined> {
  const parsed: unknown = JSON.parse(
    readFileSync(`messages/${locale}.json`, 'utf8')
  )
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`messages/${locale}.json is not an object`)
  }
  // SAFETY: established as a non-null object immediately above, and every
  // value read from it below is either compared to a string or treated as
  // missing — a wrong shape reads as "no label", which fails loudly rather
  // than passing quietly.
  const index = parsed as Record<string, Record<string, string | undefined>>
  return index.workIndex ?? {}
}

/**
 * The capability lines, read from the same dictionaries.
 *
 * Separate from `labelsFor` rather than generalised: that one reaches
 * `workIndex`, this one reaches `studio.capabilities`, and a single helper
 * taking a path would be a small parser standing between the test and the
 * thing it is asserting about.
 */
function capabilityLinesFor(
  locale: string
): Record<string, string | undefined> {
  const parsed: unknown = JSON.parse(
    readFileSync(`messages/${locale}.json`, 'utf8')
  )
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`messages/${locale}.json is not an object`)
  }
  // SAFETY: established as a non-null object immediately above. Every value
  // read below is either split as a string or treated as missing, so a wrong
  // shape reads as "no capabilities" and fails loudly.
  const index = parsed as Record<
    string,
    Record<string, Record<string, string | undefined> | undefined> | undefined
  >
  return index.studio?.capabilities ?? {}
}

const LOCALES = ['en', 'id'] as const

describe('the work vocabulary agrees with itself', () => {
  it('has something to check', () => {
    // A vocabulary that emptied would pass every assertion below.
    expect(PRACTICES.length).toBeGreaterThan(1)
  })

  for (const locale of LOCALES) {
    it(`labels every key in ${locale}`, () => {
      const dictionary = labelsFor(locale)

      const missing = PRACTICES.filter(
        (key) => (dictionary[key] ?? '').trim() === ''
      )

      expect(
        missing,
        `${locale}: keys with no label — a chip would render the raw key`
      ).toEqual([])
    })
  }

  it('advertises exactly as many services as it can filter by', () => {
    /*
     * Deliberately a count, not a mapping.
     *
     * `services` is prose for an answer engine — "Commissioned painting"
     * rather than the key `painting` — so it cannot be compared key by key
     * without inventing a second translation table that would then need its
     * own test. What is worth guarding is the arithmetic: the JSON-LD must
     * not claim a different number of things than the catalogue can show.
     */
    for (const locale of LOCALES) {
      expect(
        SITE.services[locale].length,
        `${locale}: JSON-LD advertises ${SITE.services[locale].length} services for ${PRACTICES.length} filterable kinds of work`
      ).toBe(PRACTICES.length)
    }
  })

  it('says the same number of things in both languages', () => {
    // A locale that lost an entry would still pass the count above if the
    // other lost one too, but this catches the ordinary case: one language
    // edited and the other forgotten.
    expect(SITE.services.en.length).toBe(SITE.services.id.length)
    expect(SITE.knowsAbout.en.length).toBe(SITE.knowsAbout.id.length)
  })

  /*
   * `vault/blocks/capability-set` renders these as four separate statements a
   * reader moves through, and `/studio` renders the same line joined by the
   * same dot. Both read the dictionary through `capabilityItems`, so the
   * count is load-bearing in two places and authored in neither.
   *
   * What this catches: a translator who drops a dot (four items become three
   * in one language and stay four in the other), and a practice added to
   * `PRACTICES` with no capability line at all — which would render an empty
   * pinned section rather than failing.
   */
  for (const locale of LOCALES) {
    it(`gives every practice its capabilities in ${locale}`, () => {
      const lines = capabilityLinesFor(locale)

      const missing = PRACTICES.filter(
        (key) => (lines[key] ?? '').trim() === ''
      )

      expect(
        missing,
        `${locale}: practices with no capability line — the section would render empty`
      ).toEqual([])
    })
  }

  it('splits into the same number of capabilities in both languages', () => {
    const counts = Object.fromEntries(
      LOCALES.map((locale) => {
        const lines = capabilityLinesFor(locale)
        return [
          locale,
          PRACTICES.map((key) => capabilityItems(lines[key] ?? '').length),
        ]
      })
    )

    // Nothing above proves an item survived the split: a line of only
    // separators passes "not empty" and yields zero items.
    for (const locale of LOCALES) {
      expect(
        Math.min(...(counts[locale] ?? [0])),
        `${locale}: a practice split into no capabilities at all`
      ).toBeGreaterThan(1)
    }

    expect(
      counts.id,
      'the two dictionaries disagree on how many capabilities a practice has'
    ).toEqual(counts.en)
  })
})
