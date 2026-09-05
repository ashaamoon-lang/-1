import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'

/**
 * The `/ai` route's generic smoke (render, console errors, a11y) is now
 * covered by `e2e/route-sweep.e2e.ts` — it's a static page like any other.
 * This file keeps only what the sweep can't generate: the 404 route's
 * bespoke soft-404 assertions below, which need real knowledge of Cache
 * Components' status-line behavior, not a copy-pastable smoke.
 */

test.describe('branded 404', () => {
  test('renders, returns 404, has no console errors, passes a11y', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    const response = await page.goto('/this-route-does-not-exist-e2e')

    // Empirically verified (both `next dev` and a `next build && next start`
    // production run, via curl and Playwright): this route's top-level
    // document response is HTTP 200, not 404. Cache Components (PPR, enabled
    // globally — see AGENTS.md "Next.js 16 Cache Components") prerenders the
    // route's static shell and flushes its 200 status before the dynamic
    // hole resolves; `notFound()` runs inside that hole, so by the time it's
    // known the response is a 404, the status line was already sent. This is
    // a genuine soft-404 (curl shows a `NEXT_HTTP_ERROR_FALLBACK;404` marker
    // and a `<meta name="robots" content="noindex">` tag in the same
    // response), not a test bug — assert the real status plus the noindex
    // signal, rather than the 404 status this route cannot produce.
    expect(response?.status()).toBe(200)

    // `networkidle` never settles here — the WebGL scene and the dev HMR
    // socket keep the connection busy — so anchor on web assertions instead.
    // Page renders: assert a non-empty document title (auto-waits).
    await expect(page).toHaveTitle(/not found|tidak ditemukan/i)
    await expect(page.locator('body')).toBeVisible()

    // The noindex signal Next.js injects for a page resolved via notFound() —
    // the actual "this is a 404" marker crawlers see, since the HTTP status
    // itself can't carry it (see comment above). Scoped to the noindex meta
    // rather than all robots metas: the layout's SEO defaults can emit their
    // own robots tag, and matching the pair trips Playwright's strict mode.
    await expect(
      page.locator('meta[name="robots"][content*="noindex"]').first()
    ).toBeAttached()

    // Branded not-found copy from components/ui/not-found-view/index.tsx —
    // rendered as sentence-case text nodes ("404" heading, "Page not found"
    // message) that CSS uppercases visually via `text-transform: uppercase`.
    // Assert on the actual DOM text, not the rendered case.
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    // Scoped to the rendered message. Since Tahap 9 the `<title>` also says
    // "Page not found" — deliberately, because a soft 404 has no status code
    // to signal with — and an unscoped text match now resolves to both.
    await expect(
      page.getByText('Page not found', { exact: true })
    ).toBeVisible()
    /*
     * The three destinations, each carrying the reader's locale.
     *
     * These were `Agent index` (`/en/ai`), `llms.txt` and `Sitemap` until
     * Tahap 38 — three machine-readable surfaces offered to the one visitor
     * on the site who is certainly a person and has certainly just got lost.
     * `docs/stages/TAHAP-38.md` §3 carries the count that forced it.
     *
     * **What that cost this file, said rather than quietly dropped.** The old
     * trio asserted *both* halves of the prefix rule end to end: a page link
     * carries the locale, a static endpoint does not. No rendered page links
     * to a static endpoint any more, so the second half has no end-to-end
     * home left. It keeps its unit coverage in `components/ui/link/
     * link.test.ts` and `proxy.test.ts`. The first half is now asserted more
     * widely than it was here — `e2e/site-reach.e2e.ts` requires *every*
     * chrome link on three routes to be locale-prefixed, which is the rule
     * that, unasserted, let the footer's Studio link serve the CMS for
     * fourteen stages.
     */
    /*
     * Scoped to `<main>`, and the reason is the change itself: these three
     * names now also appear in the header (Tahap 38 put route navigation on
     * every page) and in the footer's Index column, so an unscoped
     * `getByRole('link', { name: 'Work' })` resolves to three elements and
     * trips Playwright's strict mode. What this asserts is the **404's own**
     * offer, not the chrome's.
     */
    const recovery = page.locator('#main-content')
    for (const [name, href] of [
      ['Work', '/en/work'],
      ['Studio', '/en/studio'],
      ['Journal', '/en/journal'],
    ] as const) {
      await expect(
        recovery.getByRole('link', { name, exact: true })
      ).toHaveAttribute('href', href)
    }

    // Verified empirically: this 404 navigation logs zero console errors and
    // zero pageerrors (Chromium's "Failed to load resource" console message
    // only fires for a genuinely non-200 document response, and this route's
    // document response is 200 — see comment above).
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])

    // Every violation, at every impact. See the note in `route-sweep.e2e.ts`:
    // the starter's critical+serious filter is gone now that these routes
    // measure clean at the full severity level.
    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze()
    expect(
      results.violations.map(
        (v) => `${v.impact}: ${v.id} (${v.nodes.length} node(s))`
      )
    ).toEqual([])
  })
})
