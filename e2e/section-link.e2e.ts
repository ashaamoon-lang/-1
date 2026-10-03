import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * A case study's sections can be pointed at — the spine's copy control,
 * `vault/blocks/copy-address/copy-link.tsx`.
 *
 * What one reader wants a colleague to see is usually one part of a case. The
 * spine copies this page's address with the section being read, so the
 * address on the clipboard must be this page, ending in a section's id.
 */
test.describe('a section of a case can be pointed at', () => {
  test('arriving by a section link marks that section in the spine', async ({
    page,
  }) => {
    await page.goto(`/en/work/${FEATURED_WORK}#onward`)

    const arrived = page.locator('[data-project-spine] li[data-arrived]')
    await expect(arrived).toHaveCount(1)
    await expect(arrived.locator('a')).toHaveAttribute('href', '#onward')
  })

  test('copying puts this page and the section being read on the clipboard', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(`/en/work/${FEATURED_WORK}`)

    const spine = page.locator('[data-project-spine]')
    await spine.getByRole('button', { name: 'Copy section link' }).click()
    await expect(spine.getByRole('status')).toHaveText(/copied/i)

    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied, 'the clipboard does not hold a link to a section').toMatch(
      new RegExp(`/en/work/${FEATURED_WORK}#[\\w-]+$`)
    )
  })
})
