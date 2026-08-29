/**
 * hreflang and canonical invariants.
 *
 * The rule this file protects is stated in `alternates.ts` itself: a page's
 * canonical must be the same URL `app/sitemap.ts` submits. If they disagree, a
 * search engine is asked to crawl one URL and index another, and it picks —
 * usually not the one you wanted. Bilingual routing is where that breaks most
 * easily, because every page gains a second, nearly identical URL.
 */

import { describe, expect, it } from 'bun:test'

import { LOCALE_TAGS, routing } from '@/lib/i18n/routing'

import { routeAlternates } from './alternates'
import { STATIC_ROUTES } from './route-catalog'

/**
 * `Metadata['alternates']` is `AlternateURLs | null | undefined`, so every
 * access needs narrowing. Asserting once here keeps the tests readable and
 * makes a genuinely absent return fail with a clear message rather than a
 * cascade of "possibly undefined".
 */
function alternates(path: string) {
  const result = routeAlternates(path)
  if (!result) throw new Error(`routeAlternates('${path}') returned nothing`)
  return result
}

describe('routeAlternates', () => {
  it('is self-referential — canonical is the path passed in', () => {
    expect(alternates('/en').canonical).toBe('/en')
    expect(alternates('/id/ai').canonical).toBe('/id/ai')
  })

  it('matches the URL the sitemap submits, for every advertised route', () => {
    // The invariant, asserted against the real catalogue rather than a fixture:
    // whatever the sitemap emits must be exactly what that page canonicalizes
    // to.
    for (const route of STATIC_ROUTES) {
      expect(alternates(route.path).canonical).toBe(route.path)
    }
  })

  it('advertises every locale plus x-default, keyed by BCP 47 tag', () => {
    const languages = alternates('/en/ai').languages

    // BCP 47 tags, not the URL segment: hreflang is a language declaration,
    // and `en` and `en-US` are not interchangeable to a search engine.
    for (const locale of routing.locales) {
      expect(languages?.[LOCALE_TAGS[locale]]).toBe(`/${locale}/ai`)
    }

    // Without x-default, engines guess which version to serve a visitor whose
    // language matches neither.
    expect(languages?.['x-default']).toBe('/en/ai')
  })

  it('points every locale at the same template, not at itself', () => {
    // A common bilingual bug: each page advertising only its own URL under
    // every hreflang key, which tells engines the translations do not exist.
    const fromEn = alternates('/en').languages
    const fromId = alternates('/id').languages

    expect(fromEn).toEqual(fromId ?? {})
  })

  it('advertises no hreflang for an unlocalized route', () => {
    // /studio has no translation. Advertising one would point crawlers at a
    // URL that does not exist.
    expect(alternates('/studio').languages).toBeUndefined()
  })

  it('keeps the shared llms.txt alternate on every route', () => {
    // Regression guard for the exact bug alternates.ts documents: Next merges
    // metadata shallowly, so a route declaring its own `alternates` drops the
    // parent's entire object. Every route must therefore go through this
    // helper and keep the plain-text link.
    const types = alternates('/id').types
    expect(types?.['text/plain']).toEqual([
      { url: '/llms.txt', title: 'llms.txt' },
    ])
  })
})
