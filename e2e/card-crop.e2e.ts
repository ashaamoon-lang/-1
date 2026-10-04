import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * A card in hand shows crop marks at its plate's corners — Tata & Gerak,
 * stage 3 (`vault/motion/crop-marks`, in `vault/blocks/project-card`).
 *
 * The marks live outside the plate, in the space a card shares with its
 * caption and its neighbours, so where they end is what can go wrong
 * quietly: a mark that reaches the caption draws through the work's title.
 */
const CARD = 'article[data-span] a[data-press="card"]'

/** The opacity of each of the first card's corners, top left round. */
function corners(page: Page) {
  return page
    .locator(CARD)
    .first()
    .evaluate((link) =>
      [...link.querySelectorAll('[data-epic="card-crop"] [data-corner]')].map(
        (corner) => getComputedStyle(corner).opacity
      )
    )
}

test.describe('a card in hand shows its crop marks', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('drawn under the pointer, gone when it leaves', async ({ page }) => {
    await page.goto('/en/work')
    const card = page.locator(CARD).first()
    expect(await corners(page), 'marks before the pointer came').toEqual([
      '0',
      '0',
      '0',
      '0',
    ])

    await card.hover()
    await expect.poll(() => corners(page)).toEqual(['1', '1', '1', '1'])

    await page.mouse.move(2, 2)
    await expect.poll(() => corners(page)).toEqual(['0', '0', '0', '0'])
  })

  test('drawn for the keyboard too', async ({ page }) => {
    await page.goto('/en/work')
    // A real key first, so the focus below is `:focus-visible`.
    await page.keyboard.press('Tab')
    await page.locator(CARD).first().focus()

    await expect.poll(() => corners(page)).toEqual(['1', '1', '1', '1'])
  })

  test('the marks below the plate end above the caption', async ({ page }) => {
    for (const width of [800, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/en/work')

      const room = await page
        .locator(CARD)
        .first()
        .evaluate((link) => {
          const plate = link.querySelector('[data-plate-frame]')
          const title = link.querySelector('h3')
          const corner = link.querySelector('[data-corner="bottom-left"]')
          if (!plate || !title || !corner) return null
          // The column's line under the plate: from its top inset, its height.
          const line = getComputedStyle(corner, '::after')
          const reach =
            Number.parseFloat(line.top) + Number.parseFloat(line.height)
          const gap =
            title.getBoundingClientRect().top -
            plate.getBoundingClientRect().bottom
          return gap - reach
        })

      expect(room, `${width}px: no card to measure`).not.toBeNull()
      expect(
        room,
        `${width}px: the crop mark reaches the caption`
      ).toBeGreaterThan(0)
    }
  })
})
