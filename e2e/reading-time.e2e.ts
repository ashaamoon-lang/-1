import { expect, test } from '@playwright/test'

/**
 * An essay says how long it takes, and how long is left — Tata & Gerak,
 * stage 2 (`lib/content/reading-time`, `vault/blocks/reading-left`).
 *
 * The header gives the total, rendered on the server. Once the essay has
 * begun and the header has gone, a tag in the corner keeps the reader told
 * how much remains.
 */
const ENTRY = '/en/journal/scope-is-the-deliverable'

test.describe('an essay says how long it takes, and how long is left', () => {
  test('the header gives the reading time', async ({ page }) => {
    await page.goto(ENTRY)

    await expect(
      page.locator('header[data-epic="journal-transport"]')
    ).toContainText(/\d+ min read/)
  })

  test('once the essay has begun, the corner tag says what is left', async ({
    page,
  }) => {
    // Short enough that the essay cannot be on screen whole once it begins.
    await page.setViewportSize({ width: 390, height: 600 })
    await page.goto(ENTRY)
    const tag = page.locator('[data-reading-left]')
    expect(
      await tag.getAttribute('data-shown'),
      'the tag showed before the essay began'
    ).toBeNull()

    await page.evaluate(() =>
      document
        .querySelector('[data-paragraph]')
        ?.scrollIntoView({ block: 'start' })
    )

    // Told by observers the page's script sets up; give a slow runner time.
    await expect(tag).toHaveAttribute('data-shown', '', { timeout: 15_000 })
    await expect(tag).toHaveText(/\d+ min left/)

    // Once the essay's end is on screen, the tag gets out of the way.
    await page.evaluate(() =>
      [...document.querySelectorAll('[data-paragraph]')]
        .at(-1)
        ?.scrollIntoView({ block: 'center' })
    )
    await expect(tag).not.toHaveAttribute('data-shown', '')
  })
})
