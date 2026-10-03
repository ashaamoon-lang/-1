import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * A dead address points the way — `vault/blocks/wayfinder`.
 *
 * The 404 matches the address the reader typed against the site's own search
 * index and offers what was close. Two halves are held here: a slug one letter
 * short of a real work offers that work, and an address close to nothing
 * offers nothing at all rather than a wrong guess.
 */
test.describe('a dead address points the way', () => {
  test('a mistyped work offers the work it was close to', async ({ page }) => {
    await page.goto(`/en/work/${FEATURED_WORK.slice(0, -1)}`)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()

    await expect(
      page.locator(
        `#main-content [data-wayfinder] a[href="/en/work/${FEATURED_WORK}"]`
      )
    ).toBeVisible()
  })

  test('an address close to nothing offers nothing', async ({ page }) => {
    await page.goto('/en/this-route-does-not-exist-e2e')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('[data-wayfinder]')).toHaveCount(0)
  })
})
