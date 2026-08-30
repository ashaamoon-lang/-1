import { expect, test } from '@playwright/test'

import { LOCALE_TAGS, ogLocale, routing } from '../lib/i18n/routing'

/**
 * Every URL the sitemap submits must agree with the page it points at.
 *
 * This is the test that did not exist while three defects shipped together,
 * all from the same root cause — a locale-free path handed to a helper that
 * needed a localized one:
 *
 *  - `og:url` said `/work/panas-sore` while the canonical said
 *    `/en/work/panas-sore`. Two URLs for one page, from one function.
 *  - `og:locale` reported `en_US` on every Indonesian page, because the
 *    locale was read from a path that had no locale in it.
 *  - `/en/ai` and `/id/ai` both declared `canonical: /ai` — a URL this app
 *    does not serve, which is worse than declaring none.
 *
 * Every gate stayed green. `lib/seo/alternates.ts` states the invariant in
 * prose ("`path` must be the same URL `app/sitemap.ts` submits") and
 * `alternates.test.ts` checks the helper in isolation, but nothing compared
 * the sitemap to the pages it lists. Doing that is this file's whole job.
 *
 * Driven by the sitemap rather than a hardcoded list, so a new route is
 * covered the moment it is submitted — including CMS-driven ones, which no
 * hardcoded list could know about.
 */

function meta(html: string, property: string): string | null {
  const pattern = new RegExp(
    `<meta property="${property}" content="([^"]*)"`,
    'i'
  )
  return html.match(pattern)?.[1] ?? null
}

function metaAll(html: string, property: string): string[] {
  const pattern = new RegExp(
    `<meta property="${property}" content="([^"]*)"`,
    'gi'
  )
  return [...html.matchAll(pattern)].map((match) => match[1] ?? '')
}

test.describe('sitemap and page metadata agree', () => {
  test('every submitted URL is its own page canonical and og:url', async ({
    request,
  }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)

    const locs = [
      ...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map((match) => match[1] ?? '')

    // A sitemap that lists nothing would make every assertion below vacuous.
    expect(locs.length).toBeGreaterThan(0)

    for (const loc of locs) {
      const { pathname } = new URL(loc)
      const html = await (await request.get(pathname)).text()

      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]

      // The canonical is what a search engine indexes; the sitemap is what it
      // is asked to crawl. When they disagree the engine picks, and it does
      // not pick by asking.
      expect(canonical, `canonical of ${pathname}`).toBe(loc)
      expect(meta(html, 'og:url'), `og:url of ${pathname}`).toBe(loc)
    }
  })

  test('og:locale follows the URL prefix, in OpenGraph spelling', async ({
    request,
  }) => {
    for (const locale of routing.locales) {
      const html = await (await request.get(`/${locale}`)).text()

      // Underscore. `og:locale` is `language_TERRITORY`, not the hyphenated
      // BCP 47 tag that belongs in `<html lang>` and hreflang — a consumer
      // reading the wrong one silently falls back to its own default.
      expect(meta(html, 'og:locale')).toBe(ogLocale(locale))
      expect(html).toContain(`lang="${LOCALE_TAGS[locale]}"`)

      const alternates = metaAll(html, 'og:locale:alternate')
      expect(alternates).toEqual(
        routing.locales.filter((other) => other !== locale).map(ogLocale)
      )
    }
  })

  test('no shipped page still carries the starter identity', async ({
    request,
  }) => {
    /*
     * The share card, the PWA name, `og:site_name` and the JSON-LD graph all
     * said "Satūs" or `@darkroom.engineering/satus` long after the fork
     * became this site, because no gate reads any of them.
     *
     * The footer credit is the deliberate exception: Satūs is MIT, and the
     * notice stays. It lives in `messages/*.json` under `footer.builtOn`, so
     * the check below targets the metadata rather than the page text.
     */
    const html = await (await request.get('/en')).text()

    expect(meta(html, 'og:site_name')).not.toMatch(/satus|satūs/i)
    expect(meta(html, 'og:image:alt')).not.toMatch(/satus|satūs/i)

    const jsonLd = [
      ...html.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      ),
    ].map((match) => match[1] ?? '')
    expect(jsonLd.length).toBeGreaterThan(0)
    for (const block of jsonLd) {
      expect(block).not.toMatch(/satus|satūs/i)
    }

    const manifest = await (await request.get('/manifest.webmanifest')).text()
    expect(manifest).not.toMatch(/satus|satūs/i)
  })
})
