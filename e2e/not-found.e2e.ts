import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

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
    await expect(page).toHaveTitle(/.+/)
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
    await expect(page.getByText('Page not found')).toBeVisible()
    /*
     * `/ai` is a page and carries the locale prefix; `/llms.txt` and
     * `/sitemap.xml` are static endpoints and must not.
     *
     * These are the links a reader reaches for when everything else has
     * already failed, so getting either half wrong is expensive: an
     * unprefixed `/ai` throws away the language they were reading in, and a
     * prefixed `/en/llms.txt` 404s from the 404 page. The rule lives in
     * `lib/i18n/paths.ts` (`isLocalizableRoute`) and is unit-tested in
     * `components/ui/link/link.test.ts`; this asserts it end to end.
     */
    await expect(
      page.getByRole('link', { name: 'Agent index' })
    ).toHaveAttribute('href', '/en/ai')
    await expect(page.getByRole('link', { name: 'llms.txt' })).toHaveAttribute(
      'href',
      '/llms.txt'
    )
    await expect(page.getByRole('link', { name: 'Sitemap' })).toHaveAttribute(
      'href',
      '/sitemap.xml'
    )

    // Verified empirically: this 404 navigation logs zero console errors and
    // zero pageerrors (Chromium's "Failed to load resource" console message
    // only fires for a genuinely non-200 document response, and this route's
    // document response is 200 — see comment above).
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])

    // Every violation, at every impact. See the note in `route-sweep.e2e.ts`:
    // the starter's critical+serious filter is gone now that these routes
    // measure clean at the full severity level.
    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.map(
        (v) => `${v.impact}: ${v.id} (${v.nodes.length} node(s))`
      )
    ).toEqual([])
  })
})
