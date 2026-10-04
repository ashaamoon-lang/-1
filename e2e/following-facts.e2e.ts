import { expect, test } from '@playwright/test'

/**
 * The case's name follows the reader down the page — Tata & Gerak, stage 4
 * (`vault/blocks/project-spine`, `following-facts`).
 *
 * Once the hero's title has left the screen, the spine says which work this
 * is in its label's place; back at the top, the label returns.
 */
const CASE = '/en/work/arus-balik'

test.describe('the spine keeps the case name once the title has gone', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('handed over below the hero, and back at the top', async ({ page }) => {
    await page.goto(CASE)
    const spine = page.locator('[data-project-spine]')
    const facts = spine.locator('[data-epic="following-facts"]')
    const title = (await page.locator('h1').first().textContent())?.trim()

    expect(title, 'the case has no title to follow').toBeTruthy()
    await expect(facts).toContainText(title ?? '')
    await expect(spine).not.toHaveAttribute('data-past', '')

    await page.evaluate(() =>
      document
        .querySelectorAll('[data-region]')[1]
        ?.scrollIntoView({ block: 'start' })
    )
    // Told by an observer the page's script sets up; give a slow runner time.
    await expect(spine).toHaveAttribute('data-past', '', { timeout: 15_000 })
    await expect
      .poll(() => facts.evaluate((node) => getComputedStyle(node).opacity))
      .toBe('1')

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(spine).not.toHaveAttribute('data-past', '')
  })
})
