import { expect, test } from '@playwright/test'

/**
 * On a phone the case's spine is one line, and its current row has the rule
 * under it — Tata & Gerak, stage 4 (`vault/blocks/project-spine`, with
 * `vault/motion/route-marker` following the current item).
 *
 * The strip is held over the reading, so a second line of rows is a line of
 * the case hidden; and the rule is placed against the strip, so a strip that
 * stopped being its containing block would put it under the wrong word.
 */
const CASE = '/en/work/arus-balik'

test.describe('the spine is one line on a phone', () => {
  // The narrowest width the site supports.
  test.use({ viewport: { width: 320, height: 720 } })

  test('its rows never wrap, and the rule stands under the current row', async ({
    page,
  }) => {
    await page.goto(CASE)
    const spine = page.locator('[data-project-spine]')

    const lines = await spine
      .locator('li')
      .evaluateAll(
        (rows) =>
          new Set(
            rows.map((row) => Math.round(row.getBoundingClientRect().top))
          ).size
      )
    expect(lines, 'the spine wrapped onto more than one line').toBe(1)

    await page.evaluate(() =>
      document
        .querySelectorAll('[data-region]')[2]
        ?.scrollIntoView({ block: 'start' })
    )
    const rule = spine.locator('[data-epic="route-marker"]')
    // Placed once the page's script runs; give a slow runner time.
    await expect(rule).toHaveAttribute('data-on', '', { timeout: 15_000 })
    await expect
      .poll(async () => {
        const [word, line] = await Promise.all([
          spine.locator('a[aria-current]').boundingBox(),
          rule.boundingBox(),
        ])
        return word && line
          ? Math.max(
              Math.abs(word.x - line.x),
              Math.abs(word.width - line.width)
            )
          : Number.POSITIVE_INFINITY
      }, 'the rule does not stand under the current row')
      .toBeLessThanOrEqual(1)
  })
})
