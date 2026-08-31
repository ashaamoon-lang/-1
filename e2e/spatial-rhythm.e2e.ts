import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'

/**
 * Every section on a page keeps the same header-to-body rhythm.
 *
 * ## What this caught
 *
 * Measured on the built home page at 1440×900:
 *
 *   #work      0px
 *   #studio   48px
 *   #contact  48px
 *
 * Two of three agreed and one did not, because the number was written as a
 * literal inside `StudioNote` and `ContactBlock` and simply absent from the
 * home page's work section, which composes `SectionHeader` + `ProjectGrid`
 * as plain children. The heading sat flush against the top edge of the first
 * cover — a large dark image — so "Recent commissions" read as that image's
 * caption rather than as the title of the section.
 *
 * `--section-lead` (`lib/styles/layout.mjs`) is now the only place the number
 * exists, so there is nowhere for a fourth copy to drift.
 *
 * ## Why it asserts sameness, not a number
 *
 * Pinning 48px would make this test fail every time the studio tunes the
 * rhythm, which is a design decision and none of a test's business. The
 * invariant worth protecting is that the page has *one* rhythm. Same shape as
 * `catalogue-layout.e2e.ts`, which demands one column span without saying
 * which.
 *
 * ## Measurement note
 *
 * The first version of this probe compared each `<h2>` to its next sibling.
 * Inside `SectionHeader` that sibling is the trailing count label sitting on
 * the same baseline, so it reported −17px — a number that describes nothing.
 * It measures `<header>` bottom to the next element's top now. A wrongly
 * shaped measurement is worse than no measurement, which is the lesson this
 * project keeps paying for.
 */

/** Sub-pixel layout noise; two gaps this close are the same gap. */
const TOLERANCE = 1.5

test.describe('spatial rhythm', () => {
  for (const locale of routing.locales) {
    test(`/${locale} keeps one header-to-body gap`, async ({ page }) => {
      await page.goto(`/${locale}`)

      const gaps = await page.evaluate(() => {
        const out: { section: string; gap: number }[] = []
        for (const section of document.querySelectorAll('section')) {
          const header = section.querySelector('header')
          const body = header?.nextElementSibling
          if (!header || !body) continue
          out.push({
            section: section.id || '(unnamed)',
            gap:
              body.getBoundingClientRect().top -
              header.getBoundingClientRect().bottom,
          })
        }
        return out
      })

      // A page with fewer than two sections cannot disagree with itself, and
      // passing vacuously would hide the CMS being empty.
      expect(
        gaps.length,
        'no sections with a header and a body'
      ).toBeGreaterThan(1)

      const spread =
        Math.max(...gaps.map((g) => g.gap)) -
        Math.min(...gaps.map((g) => g.gap))
      const detail = gaps
        .map((g) => `${g.section}=${Math.round(g.gap)}px`)
        .join(', ')

      expect(
        spread,
        `sections disagree on the rhythm: ${detail}`
      ).toBeLessThanOrEqual(TOLERANCE)
    })
  }
})
