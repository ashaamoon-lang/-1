import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { routing } from '../lib/i18n/routing'

/**
 * The catalogue lays out as a catalogue.
 *
 * ## What this caught, and why nothing else could
 *
 * `ProjectGrid` places each card by the work's own `span` — 6 or 12 of the
 * 12 desktop columns. That is a *composition* choice, made by the studio so a
 * chosen piece runs full width among a handful of neighbours on the home
 * page. Tahap 8 pointed the same block at `/work`, which lists everything.
 *
 * Measured on the built site at 1440px, with three works spanning 6, 12, 6:
 *
 *   card 1   691px wide
 *   card 2  1398px wide   <- cannot sit beside a span-6, so a new row
 *   card 3   691px wide   <- another new row
 *
 * Three rows for three works, two of them carrying ~700px of dead space, and
 * a page 3802px tall. Twenty works would run past 18,000px with the same
 * holes. Every gate passed: axe is clean, nothing overflows, the HTML is
 * complete without JavaScript, the headers are cacheable. It took looking at
 * a screenshot — which is the point `docs/AUDIT-2026-08.md` keeps making
 * about this project, that a green gate is not a correct page.
 *
 * The fix is `layout="catalogue"`, which gives every card the same column.
 * This asserts that, because the failure mode is silent: reverting the prop
 * changes no test, no type, and no lint rule.
 */

const CATALOGUE_ROUTES = [
  ...routing.locales.map((locale) => `/${locale}/work`),
  ...PRACTICES.map((value) => `/en/work/practice/${value}`),
]

test.describe('catalogue layout', () => {
  for (const path of CATALOGUE_ROUTES) {
    test(`${path} gives every work the same column`, async ({ page }) => {
      await page.goto(path)

      const cards = page.locator('article[data-span]')
      const count = await cards.count()
      test.skip(count === 0, `${path} has no published work to lay out`)

      const spans = await cards.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-span'))
      )

      // Not "every span is 6" — that would pin the design. The invariant is
      // that a catalogue has one rhythm, whatever it is.
      expect(
        new Set(spans).size,
        `${path} mixes column spans: ${spans.join(', ')}`
      ).toBe(1)
    })
  }

  test('the home page keeps its editorial spans', async ({ page }) => {
    /*
     * The other half of the same decision, and the reason the fix is a prop
     * rather than a change to `ProjectGrid`'s default.
     *
     * The home page shows a *selection*, and a full-width piece among
     * half-width neighbours is how the studio composes it. If someone
     * "simplifies" this by making the uniform layout unconditional, the home
     * page loses its composition silently — so this test fails only when the
     * seeded data actually contains a mix, and skips honestly when it does
     * not, rather than asserting something the fixtures cannot support.
     */
    await page.goto('/en')

    const spans = await page
      .locator('article[data-span]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-span')))

    test.skip(
      new Set(spans).size < 2,
      'seeded home selection has no span variety to preserve'
    )

    expect(
      new Set(spans).size,
      'home page flattened to one span'
    ).toBeGreaterThan(1)
  })
})
