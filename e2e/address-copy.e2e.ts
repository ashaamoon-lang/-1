import { expect, test } from '@playwright/test'

/**
 * The studio's address can be copied as well as opened.
 *
 * `vault/blocks/copy-address`. A `mailto:` link does nothing for a reader
 * whose mail lives in a browser tab, and says nothing about having done
 * nothing; the copy control is the other half of the contact block's one
 * action. Two things are held here: pressing it puts exactly the address shown
 * on the clipboard and says so, and without script the control is absent
 * rather than present and dead.
 */
test.describe('the studio address can be copied', () => {
  test('pressing copy puts the address on the clipboard and says so', async ({
    context,
    page,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/en')

    const contact = page.locator('#contact')
    await contact.getByRole('button', { name: 'Copy address' }).click()

    await expect(contact.getByRole('status')).toHaveText(/copied/i)

    const shown = await contact.locator('[data-press="email"]').textContent()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied, 'the clipboard does not hold the address shown').toBe(
      shown?.trim()
    )
  })

  test('without JavaScript there is no copy control, and the address stays', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    try {
      await page.goto('/en', { waitUntil: 'domcontentloaded' })

      const contact = page.locator('#contact')
      await expect(contact.locator('[data-press="email"]')).toBeVisible()
      await expect(
        contact.getByRole('button'),
        'a copy control without script is a button that does nothing'
      ).toHaveCount(0)
    } finally {
      await context.close()
    }
  })
})
