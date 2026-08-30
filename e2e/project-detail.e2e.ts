/**
 * The project detail route, end to end.
 *
 * ## Why most of this skips on an empty dataset
 *
 * Two of Tahap 4's exit criteria need a real published project, and the
 * `production` dataset ships empty. Rather than assert against fabricated
 * content or fail CI for a repository that is simply not yet filled in, the
 * data-dependent tests **skip with a message** — the same posture as the
 * Storybook a11y gate. A run against an empty dataset says "skipped", never
 * "passed".
 *
 * To exercise them, seed temporary fixtures first:
 *
 * ```bash
 * bun --env-file .env.local lib/scripts/seed-fixtures.ts
 * CI=true bun run test:e2e e2e/project-detail.e2e.ts
 * bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
 * ```
 *
 * The unknown-slug test needs no data and always runs.
 */

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/** Slugs of published projects, read from the site's own sitemap. */
async function publishedSlugs(request: {
  get: (url: string) => Promise<{ text: () => Promise<string> }>
}): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  return [...xml.matchAll(/<loc>[^<]*\/en\/work\/([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .filter((slug): slug is string => slug !== undefined)
}

test.describe('project detail', () => {
  test('an unknown slug resolves as not-found in both locales', async ({
    request,
  }) => {
    for (const path of ['/en/work/no-such-work', '/id/work/no-such-work']) {
      const response = await request.get(path)
      const html = await response.text()

      /*
       * 200, not 404, and that is not a bug in this route.
       *
       * Cache Components prerenders the static shell and flushes its 200
       * status before the dynamic hole resolves; `notFound()` runs inside that
       * hole, so the status line is already sent by the time the 404 is known.
       * Every CMS route in this app behaves the same way —
       * `e2e/not-found.e2e.ts` documents the same measurement for `[...slug]`.
       * What a crawler actually reads is the noindex directive, so that is
       * what this asserts.
       */
      expect(response.status(), `${path} status`).toBe(200)
      expect(html, `${path} is missing the noindex signal`).toContain(
        'name="robots" content="noindex"'
      )
    }
  })

  test('renders a real project in both locales', async ({ page, request }) => {
    const slugs = await publishedSlugs(request)
    test.skip(
      slugs.length === 0,
      'no published projects — run lib/scripts/seed-fixtures.ts to exercise this'
    )

    const slug = slugs[0] as string

    for (const locale of ['en', 'id']) {
      const response = await page.goto(`/${locale}/work/${slug}`)
      expect(response?.status()).toBe(200)

      // Exactly one h1, and it names the work rather than the site.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()

      // The canonical is the URL the sitemap submits for this page — the
      // invariant `lib/seo/alternates.ts` exists to hold.
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        new RegExp(`/${locale}/work/${slug}$`)
      )
    }
  })

  test('every internal work link carries exactly one locale prefix', async ({
    page,
    request,
  }) => {
    const slugs = await publishedSlugs(request)
    test.skip(slugs.length === 0, 'no published projects')

    /*
     * The bug this guards shipped: components pre-localized their href with
     * `localizedPath` and `components/ui/link` prefixed it again, producing
     * `/en/en/work/foo`. That matches the CMS catch-all rather than the work
     * route, so every card in the grid led to a not-found page — served with
     * a 200 status, so nothing anywhere reported a problem.
     */
    await page.goto('/en')
    const hrefs = await page
      .locator('a[href*="/work/"]')
      .evaluateAll((links) =>
        links.map((link) => link.getAttribute('href') ?? '')
      )

    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href, `${href} is double-prefixed`).not.toMatch(
        /^\/(en|id)\/(en|id)\//
      )
      expect(href, `${href} has no locale prefix`).toMatch(/^\/(en|id)\/work\//)
    }
  })

  test('passes axe at every impact', async ({ page, request }) => {
    const slugs = await publishedSlugs(request)
    test.skip(slugs.length === 0, 'no published projects')

    await page.goto(`/en/work/${slugs[0]}`, { waitUntil: 'domcontentloaded' })

    const results = await new AxeBuilder({ page }).analyze()
    expect(
      results.violations.map(
        (v) => `${v.impact}: ${v.id} (${v.nodes.length} node(s))`
      )
    ).toEqual([])
  })

  test('the sitemap lists every project once per locale', async ({
    request,
  }) => {
    const slugs = await publishedSlugs(request)
    test.skip(slugs.length === 0, 'no published projects')

    const xml = await (await request.get('/sitemap.xml')).text()

    for (const slug of slugs) {
      for (const locale of ['en', 'id']) {
        expect(xml, `sitemap is missing /${locale}/work/${slug}`).toContain(
          `/${locale}/work/${slug}</loc>`
        )
      }
    }
  })
})
