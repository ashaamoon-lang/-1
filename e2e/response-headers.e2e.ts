import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'

/**
 * What the server actually puts in its headers.
 *
 * No gate in this project had ever read one. `bun run check` and the rest of
 * the e2e suite look at markup; `Cache-Control` is invisible to all of them,
 * which is how `/en/work/arus-balik` came to be served `no-store` — every view of
 * the most-shared page class hitting the origin — while hashed, immutable
 * build assets were served `max-age=0` and refetched on every navigation
 * (`docs/AUDIT-2026-08.md` §Tier 3).
 *
 * The assertions are per class of route rather than per URL, because the
 * classes are the decision: a static page may be cached hard, a page that
 * reads request data may not, and a content-hashed asset is immutable by
 * construction.
 */

function cacheControl(headers: Record<string, string>): string {
  return headers['cache-control'] ?? ''
}

test.describe('response headers', () => {
  test('statically prerendered pages are cacheable', async ({ request }) => {
    const paths = [
      '/en',
      '/id',
      '/en/ai',
      /*
       * The practice views. `/en/work` and `/id/work` are **not** here any
       * more, and that is a deliberate move rather than an omission.
       *
       * They were listed from Tahap 10, with the comment "listing them here
       * is the assertion that the query string does not come back". Tahap 39
       * brought it back, having measured that the reason it went away — the
       * page rendering no work at all without JavaScript, behind the Suspense
       * boundary `cacheComponents` then required — does not reproduce under
       * `export const instant = false`. `app/[locale]/work/page.tsx` carries
       * the numbers and the price: the route is `ƒ` now, and `no-store`.
       *
       * The property that assertion was standing in for is asserted directly
       * instead, below and in `e2e/catalogue-layout.e2e.ts`: the catalogue
       * must render in full, server-side, filtered or not.
       */
      ...PRACTICES.map((value) => `/en/work/practice/${value}`),
    ]

    for (const path of paths) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)

      const value = cacheControl(response.headers())
      expect(value, `${path}: ${value}`).toMatch(/s-maxage=\d+/)
      expect(value, `${path} must not be no-store`).not.toContain('no-store')
    }
  })

  test('the catalogue is dynamic, and complete anyway', async ({ request }) => {
    /*
     * The replacement for the cache assertion above, and a stronger one.
     *
     * A cacheable header never proved the catalogue rendered; it proved the
     * route shape. This asserts the thing that shape was protecting — that a
     * crawler fetching either form over plain HTTP gets the work itself, not
     * a shell — which is exactly the failure Tahap 10 found and
     * `docs/AUDIT-2026-08.md` §2.1 was about.
     */
    for (const path of [
      '/en/work',
      '/id/work',
      '/en/work?practice=consulting',
    ]) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)

      const html = await response.text()
      expect(html, `${path} served no markup`).toContain('<h1')
      // The catalogue's payload: links to individual works, in the HTML
      // itself. A Suspense fallback has a heading and prose and none of these.
      const links = [...html.matchAll(/href="[^"]*\/work\/[a-z0-9-]+"/g)]
      expect(
        links.length,
        `${path} rendered no project links server-side`
      ).toBeGreaterThan(0)
    }
  })

  test('project pages are cacheable', async ({ request }) => {
    // The most-shared page class on the site, and the one the audit caught
    // being served `no-store` (§Tier 3). Discovered from the sitemap rather
    // than hardcoded, so the test cannot pass against a slug that no longer
    // exists.
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const path = sitemap.match(
      /<loc>[^<]*?(\/en\/work\/(?!practice\/)[^<]+)<\/loc>/
    )?.[1]
    test.skip(!path, 'no published project in the sitemap to check')

    const response = await request.get(path ?? '')
    expect(response.status(), path).toBe(200)

    const value = cacheControl(response.headers())
    expect(value, `${path}: ${value}`).toMatch(/s-maxage=\d+/)
    expect(value, `${path} must not be no-store`).not.toContain('no-store')
  })

  test('content-hashed build assets are immutable', async ({ request }) => {
    // Discover a real asset rather than hardcoding a hash that changes on
    // every build.
    const html = await (await request.get('/en')).text()
    const asset = html.match(/\/_next\/static\/chunks\/[\w.-]+\.js/)?.[0]
    expect(asset, 'no hashed chunk found in the page').toBeTruthy()

    const value = cacheControl((await request.get(asset ?? '')).headers())
    expect(value, `chunk: ${value}`).toContain('immutable')
  })

  test('the icon and share card are not refetched on every navigation', async ({
    request,
  }) => {
    for (const path of ['/icon.png', '/opengraph-image.png']) {
      const value = cacheControl((await request.get(path)).headers())

      // `max-age=0, must-revalidate` costs a round trip per navigation for a
      // file whose bytes only change when the build does.
      expect(value, `${path}: ${value}`).not.toMatch(/max-age=0/)
    }
  })

  test('Vary: Accept is set wherever content is negotiated', async ({
    request,
  }) => {
    // `proxy.ts` negotiates Markdown for page documents. A cache that ignores
    // this would serve Markdown to a browser.
    const response = await request.get('/en')
    expect((response.headers().vary ?? '').toLowerCase()).toContain('accept')
  })
})
