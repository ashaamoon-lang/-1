import { expect, test } from '@playwright/test'

/**
 * A long page offers a way back up — Tata & Gerak, stage 5
 * (`vault/blocks/back-to-top`).
 *
 * Absent near the top, so it is no extra stop for anyone who never needs
 * it; offered two screens down; and pressing it returns the reader, and the
 * keyboard, to the top of the page.
 */
test.describe('a long page offers a way back up', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('offered two screens down, and takes the reader back up', async ({
    page,
  }) => {
    await page.goto('/en')
    const back = page.locator('[data-epic="back-to-top"]')
    await expect(back, 'offered at the top of the page').toHaveCount(0)

    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3))
    // Rendered once the page's script reads the scroll; give a slow runner time.
    await expect(back).toBeVisible({ timeout: 15_000 })

    await back.click()
    await expect
      .poll(() => page.evaluate(() => window.scrollY), {
        message: 'the page did not return to its top',
      })
      .toBeLessThan(2)
    await expect(page.locator('#main-content')).toBeFocused()
    await expect(back).toHaveCount(0)
  })
})
