import { expect, test } from '@playwright/test'

/**
 * The page grid is drawn on request — Tata & Gerak, stage 5
 * (`vault/motion/grid-underlay`).
 *
 * Asked for by the footer's toggle or the `g` key; never by someone typing;
 * and the toggle says which state the page is in.
 */
test.describe('the page grid is drawn on request', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the toggle and the g key draw it, and take it away', async ({
    page,
  }) => {
    await page.goto('/en/studio')
    // Hydrated first: the toggle is in the server's HTML, and a press before
    // its script arrives does nothing.
    await page.waitForLoadState('networkidle')
    const grid = page.locator('[data-epic="grid-underlay"]')
    const toggle = page.getByRole('button', { name: 'Show the grid' })

    await expect(grid, 'drawn before anyone asked').toHaveCount(0)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await toggle.click()
    await expect(grid).toHaveCount(1)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    // Twelve columns on a desktop, as the page grid has.
    await expect(grid.locator('span:visible')).toHaveCount(12)

    await page.keyboard.press('g')
    await expect(grid).toHaveCount(0)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  test('typing a g in search does not draw it', async ({ page }) => {
    await page.goto('/en/studio')
    await page.waitForLoadState('networkidle')
    await page.keyboard.press('Control+k')
    const field = page.getByRole('combobox')
    await expect(field).toBeFocused()

    await field.press('g')
    await expect(page.locator('[data-epic="grid-underlay"]')).toHaveCount(0)
  })
})
