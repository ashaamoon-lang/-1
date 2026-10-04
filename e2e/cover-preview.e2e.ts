import type { Locator } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The catalogue's frame carries the cover of the work in hand — Tata &
 * Gerak, stage 3 (`vault/motion/cover-preview`, placed by
 * `vault/blocks/catalogue-frame/reader.tsx`).
 *
 * What can go wrong quietly is where the plate lands. It is placed against
 * the frame's own box, which clips and scrolls, so a plate past its edge adds
 * a scrollbar instead of a picture, and one placed carelessly covers the very
 * words it illustrates.
 */
async function expectBeside(frame: Locator, work: Locator) {
  const plate = frame.locator('[data-epic="cover-preview"]')
  await expect(plate).toHaveAttribute('data-on', '')
  // The glide is the fast band; read the plate once it has arrived.
  await expect
    .poll(() => plate.evaluate((node) => node.getAnimations().length))
    .toBe(0)

  const placed = await work.evaluate((node) => {
    const reader = node.closest('[data-epic="frame-crosshair"]')
    const plateNode = reader?.querySelector('[data-epic="cover-preview"]')
    if (!reader || !plateNode) return null
    const range = document.createRange()
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    let words = Number.NEGATIVE_INFINITY
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      range.selectNodeContents(text)
      words = Math.max(words, range.getBoundingClientRect().right)
    }
    const box = reader.getBoundingClientRect()
    const at = plateNode.getBoundingClientRect()
    const scroller = reader.parentElement
    return {
      clearOfWords: at.left - words,
      inside:
        at.left >= box.left - 0.5 &&
        at.right <= box.right + 0.5 &&
        at.top >= box.top - 0.5 &&
        at.bottom <= box.bottom + 0.5,
      overflow: scroller ? scroller.scrollHeight - scroller.clientHeight : 0,
    }
  })

  expect(placed, 'no frame or plate around the work').not.toBeNull()
  expect(placed?.clearOfWords, 'the plate covers the words').toBeGreaterThan(0)
  expect(placed?.inside, 'the plate leaves the frame').toBe(true)
  expect(
    placed?.overflow,
    'the plate makes the frame scroll'
  ).toBeLessThanOrEqual(0)
}

test.describe('the frame carries the cover of the work in hand', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('beside the work under the pointer, and the next one', async ({
    page,
  }) => {
    await page.goto('/en/work')
    const frame = page.locator('[data-epic="frame-crosshair"]')
    const works = frame.locator('[data-work-id]')
    expect(await works.count(), 'the frame holds no work').toBeGreaterThan(1)

    for (const index of [0, 1]) {
      const work = works.nth(index)
      await work.hover()
      await expectBeside(frame, work)
    }

    // The cover on show is a picture, not an empty plate.
    await expect
      .poll(() =>
        frame
          .locator('[data-epic="cover-preview"] [data-shown] img')
          .evaluate((img) =>
            img instanceof HTMLImageElement ? img.naturalWidth : 0
          )
      )
      .toBeGreaterThan(0)
  })

  test('beside the work that holds the keyboard focus', async ({ page }) => {
    await page.goto('/en/work')
    // A real key first, so the focus below is `:focus-visible`.
    await page.keyboard.press('Tab')
    const frame = page.locator('[data-epic="frame-crosshair"]')
    const work = frame.locator('[data-work-id]').first()
    await work.focus()

    await expectBeside(frame, work)
  })
})
