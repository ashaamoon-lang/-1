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

import { axeTags } from './axe-tags'

/** Slugs of published projects, read from the site's own sitemap. */
async function publishedSlugs(request: {
  get: (url: string) => Promise<{ text: () => Promise<string> }>
}): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  return (
    [...xml.matchAll(/<loc>[^<]*\/en\/work\/([^<]+)<\/loc>/g)]
      .map((match) => match[1])
      .filter((slug): slug is string => slug !== undefined)
      // `/work/discipline/<value>` is a catalogue view sharing the prefix, not
      // a project. Without this the tests below would assert a project page's
      // shape against a filtered index.
      .filter((slug) => !slug.startsWith('discipline/'))
  )
}

/**
 * How far down the first screen a reader has to look before the page says
 * anything about the work.
 *
 * Desktop only, and that is measured rather than cautious: at 390x844 the
 * facts already sit at 611 against a fold of 844, because the stacked mobile
 * order puts them straight under the cover. The defect is a desktop one —
 * a half-width cover leaves the right half of the screen empty and pushes the
 * facts past the fold.
 *
 * Measured before Tahap 19 at 1280x800: title 130-220, cover 256-**1023**,
 * and the fact list beginning at **1059** — 259px below the fold, with 767px
 * of empty column beside the cover. The first screen of a project page held a
 * name and half a picture.
 */
test.describe('the project page says what the work is, before the fold', () => {
  test('the facts meet the first screen on desktop', async ({
    page,
    request,
  }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const match = sitemap.match(
      /<loc>[^<]*?(\/en\/work\/(?!practice\/)[^<]+)<\/loc>/
    )
    test.skip(!match, 'no published project in the sitemap to check')

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(match?.[1] ?? '')
    await page.waitForTimeout(2200)

    const measured = await page.evaluate(() => {
      const list = document.querySelector('dl')
      if (!list) return null
      const rect = list.getBoundingClientRect()
      return {
        top: Math.round(rect.top),
        fold: window.innerHeight,
        facts: document.querySelectorAll('dt').length,
      }
    })

    expect(measured, 'the project page rendered no fact list').not.toBeNull()
    expect(measured?.facts ?? 0, 'the fact list is empty').toBeGreaterThan(0)

    /*
     * Intersecting the fold, not merely near it: a reader who never scrolls
     * should still be told who the work was for and when. `Portfolio Grid`
     * asks for "visuals first", so the cover keeps its six columns and its
     * position — the facts move into the empty half beside it rather than
     * above it.
     */
    expect(
      measured?.top ?? Number.POSITIVE_INFINITY,
      `the facts begin ${measured?.top}px down, ${(measured?.top ?? 0) - (measured?.fold ?? 0)}px below a fold at ${measured?.fold}px`
    ).toBeLessThan(measured?.fold ?? 0)
  })
})

test.describe('project detail', () => {
  test('an unknown slug resolves as not-found in both locales', async ({
    request,
  }) => {
    /*
     * Two different answers, and both are measured rather than assumed.
     *
     * A slug the server has never seen returns **200** with a noindex
     * directive: Cache Components streams the prerendered shell and flushes
     * the status line before the cached lookup resolves, so `notFound()` runs
     * too late to change it. Once that miss is cached, the same URL returns a
     * real **404** — the route knows the answer before it responds.
     *
     * Measured on a fresh `next start`, five unseen slugs and five repeats of
     * one: unseen 200/200/200/200/200, repeated 200 then 404/404/404/404.
     *
     * Tahap 10 improved this — while the route read `draftMode()` it had no
     * static shell at all and every unknown slug stayed 200 forever. It did
     * not eliminate it, and this test says so rather than picking whichever
     * status happens to make it pass. What holds in *both* states is the
     * noindex directive, which is what a crawler actually reads, so that is
     * asserted unconditionally.
     */
    for (const path of ['/en/work/no-such-work', '/id/work/no-such-work']) {
      const first = await request.get(path)
      const html = await first.text()

      expect([200, 404], `${path} status: ${first.status()}`).toContain(
        first.status()
      )
      expect(html, `${path} is missing the noindex signal`).toContain(
        'name="robots" content="noindex"'
      )

      /*
       * Whatever the first response was, the URL must *settle* on a real 404.
       * This is the assertion that would have failed before Tahap 10, when
       * the route stayed 200 forever.
       *
       * Polled rather than a single second request: the cache entry is
       * written asynchronously, and the desktop and mobile projects request
       * this same URL concurrently, so "the second response" is not a
       * well-defined thing to assert on. Settling is.
       */
      await expect
        .poll(async () => (await request.get(path)).status(), {
          message: `${path} never settled on a 404`,
          timeout: 10_000,
        })
        .toBe(404)
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

    const results = await new AxeBuilder({ page }).withTags(axeTags()).analyze()
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
