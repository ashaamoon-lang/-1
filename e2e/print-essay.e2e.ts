import { expect, test } from '@playwright/test'

/**
 * An essay on paper — the print sheet, Tata & Gerak stage 1.
 *
 * A reader may print an essay, or save it as a PDF, to take into a meeting.
 * On paper it must be the essay: the site's header and footer left off, and
 * every paragraph printed — including the ones never scrolled to, which on
 * screen are still waiting for their reveal.
 */
test.describe('an essay on paper', () => {
  test('printing keeps the essay and leaves the site chrome off', async ({
    page,
  }) => {
    await page.goto('/en/journal/scope-is-the-deliverable')
    await page.emulateMedia({ media: 'print' })

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('banner')).toBeHidden()
    await expect(page.getByRole('contentinfo')).toBeHidden()

    const last = page.locator('main p:visible').last()
    await expect(last).toBeVisible()
    expect(
      await last.evaluate((node) => getComputedStyle(node).opacity),
      'a paragraph never scrolled to printed blank'
    ).toBe('1')
  })
})
