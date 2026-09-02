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
      // The catalogue and its filter views. These were `no-store` until the
      // route shape changed in Tahap 10 — the index because it read
      // `searchParams`, so listing them here is the assertion that the query
      // string does not come back.
      '/en/work',
      '/id/work',
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
