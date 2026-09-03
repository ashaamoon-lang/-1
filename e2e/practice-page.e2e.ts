import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { routing } from '../lib/i18n/routing'

/**
 * Each practice has a page, and exactly one URL.
 *
 * ## Why a page and not a filter
 *
 * Consulting, AI & Data and Commission have been structural vocabulary since
 * Tahap 13 — a closed schema value, a URL segment, a JSON-LD entry, the
 * catalogue's filter chips, three lines in the hero, a `<details>` on the home
 * page. What they never had was somewhere that is *about* them.
 *
 * ## Why canonicality is asserted, not assumed
 *
 * `/work/practice/<value>` used to be the filtered catalogue. Leaving it in
 * place beside a topic page would give one subject two URLs — splitting what
 * an answer engine reads and making a reader choose between them for no
 * reason. The redirect is the load-bearing half of "one page per topic", so
 * it is measured rather than trusted.
 *
 * ## Why the filter is checked by counting, not by looking
 *
 * A page that renders *every* work while claiming to be about one practice is
 * the failure that looks correct: the grid is full, the heading is right, and
 * nothing errors. So this compares the page's own count against the full
 * catalogue's and requires it to be smaller — the only assertion that
 * distinguishes a working filter from an absent one without hardcoding how
 * many works the CMS happens to hold.
 */

test.describe('practice pages', () => {
  for (const locale of routing.locales) {
    for (const practice of PRACTICES) {
      test(`/${locale}/practice/${practice} is a page about the practice`, async ({
        page,
      }) => {
        const response = await page.goto(`/${locale}/practice/${practice}`)
        expect(response?.status(), 'the practice page must exist').toBe(200)

        // The practice names itself, at the top of the outline.
        const h1 = page.locator('main h1')
        await expect(h1, 'the page has no h1').toHaveCount(1)
        expect(
          (await h1.textContent())?.trim().length ?? 0,
          'the h1 is empty'
        ).toBeGreaterThan(0)

        // A statement — the thing that makes this a page and not a listing.
        const statement = page.locator('[data-practice-statement]')
        await expect(
          statement,
          'the page carries no statement, so it is a filtered listing wearing a heading'
        ).toHaveCount(1)

        // Somewhere to go next, so the three pages form a circuit.
        await expect(
          page.locator('[data-next-practice]'),
          'the page is a dead end — no route to the next practice'
        ).toHaveCount(1)
      })
    }
  }

  test('a practice page shows only that practice, not the whole catalogue', async ({
    page,
  }) => {
    await page.goto('/en/work')
    const total = await page.locator('[data-press="card"]').count()
    expect(
      total,
      '/en/work rendered no work to compare against'
    ).toBeGreaterThan(1)

    const counts: Record<string, number> = {}
    for (const practice of PRACTICES) {
      await page.goto(`/en/practice/${practice}`)
      counts[practice] = await page.locator('[data-press="card"]').count()
    }

    const sum = Object.values(counts).reduce((a, b) => a + b, 0)
    const detail = Object.entries(counts)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ')

    // Each page shows a subset...
    for (const [practice, n] of Object.entries(counts)) {
      expect(
        n,
        `/en/practice/${practice} shows ${n} of ${total} works — the filter is not narrowing anything (${detail})`
      ).toBeLessThan(total)
    }

    // ...and together they account for the catalogue, so nothing is dropped.
    expect(
      sum,
      `the three practices show ${sum} works between them but the catalogue has ${total} (${detail})`
    ).toBe(total)
  })

  for (const practice of PRACTICES) {
    test(`/en/work/practice/${practice} redirects to the one canonical URL`, async ({
      page,
    }) => {
      const response = await page.goto(`/en/work/practice/${practice}`)
      expect(response?.status(), 'the old URL should resolve').toBe(200)
      expect(
        new URL(page.url()).pathname,
        'the old filtered-catalogue URL still serves its own page, so this topic has two URLs'
      ).toBe(`/en/practice/${practice}`)
    })
  }
})
