import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * Switching language keeps the reader's place —
 * `components/ui/language-switcher`, Orientasi stage 4.
 *
 * A reader halfway down a case who switches to Bahasa Indonesia used to land
 * back at the top. The switch now carries the section being read; at the top
 * of a page it stays the plain link it always was.
 */
test.describe("switching language keeps the reader's place", () => {
  test('from a later section of a case, the other language opens at that section', async ({
    page,
  }) => {
    await page.goto(`/en/work/${FEATURED_WORK}`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() =>
      document.getElementById('onward')?.scrollIntoView({ block: 'start' })
    )
    await page.waitForTimeout(800)

    await page.getByRole('link', { name: 'Switch to Bahasa Indonesia' }).click()

    await expect(page).toHaveURL(
      new RegExp(`/id/work/${FEATURED_WORK}#onward$`)
    )
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const top = await page.evaluate(
      () => document.getElementById('onward')?.getBoundingClientRect().top
    )
    const height = page.viewportSize()?.height ?? 0
    expect(top, 'the section is not on the page').toBeDefined()
    expect(
      top ?? Number.POSITIVE_INFINITY,
      'the other language did not open at the section'
    ).toBeLessThan(height / 2)
  })

  test('at the top of a page, the switch is the plain link it always was', async ({
    page,
  }) => {
    await page.goto(`/en/work/${FEATURED_WORK}`)
    await page.getByRole('link', { name: 'Switch to Bahasa Indonesia' }).click()

    await expect(page).toHaveURL(new RegExp(`/id/work/${FEATURED_WORK}$`))
  })
})
