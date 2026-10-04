import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The header's rule stands under the current route — Tata & Gerak, stage 2
 * (`vault/motion/route-marker`).
 *
 * Where it stands is what can go wrong quietly: the rule is placed against
 * the nav's box, so a nav that stopped being positioned would put it under
 * the wrong word with every check of the links themselves still green.
 */
async function expectUnder(page: Page, name: string) {
  const link = page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name, exact: true })
  // After a client navigation the last page's header is still in the
  // document, hidden; only the shown one counts.
  const marker = page.locator('[data-epic="route-marker"]:visible')

  // Placed once the header's script runs; a CI runner can be slow to get there.
  await expect(marker).toHaveAttribute('data-on', '', { timeout: 15_000 })
  await expect
    .poll(async () => {
      const [word, rule] = await Promise.all([
        link.boundingBox(),
        marker.boundingBox(),
      ])
      return word && rule
        ? Math.max(Math.abs(word.x - rule.x), Math.abs(word.width - rule.width))
        : Number.POSITIVE_INFINITY
    }, `the rule does not stand under ${name}`)
    .toBeLessThanOrEqual(1)
}

test.describe('the route marker stands under the current route', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('under Work on /work, and under Studio once Studio is pressed', async ({
    page,
  }) => {
    await page.goto('/en/work')
    await expectUnder(page, 'Work')

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Studio', exact: true })
      .click()
    await expect(page).toHaveURL(/\/en\/studio$/)
    await expectUnder(page, 'Studio')
  })

  test('gone where no route is current', async ({ page }) => {
    // From a placed rule, so its absence on arrival is not a page that never
    // ran its script.
    await page.goto('/en/work')
    await expectUnder(page, 'Work')

    await page
      .getByRole('banner')
      .getByRole('link', { name: 'Arth — home' })
      .click()
    await expect(page).toHaveURL(/\/en\/?$/)
    /*
     * The shown header's rule, found through the header itself: a rule that
     * stands under nothing is scaled to nothing, so it has no box, and
     * `:visible` — which is how the test above finds a placed one — finds
     * none here (CI, first run).
     */
    await expect(
      page.getByRole('banner').locator('[data-epic="route-marker"]')
    ).not.toHaveAttribute('data-on', '')
  })
})
