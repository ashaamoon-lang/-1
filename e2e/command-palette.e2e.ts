import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'

/**
 * The search palette — Tahap 28, Fase 4 of the approved scaffold.
 *
 * ## What this file exists to catch, and it is not "does it open"
 *
 * Three failures, each of which shipped somewhere in this project's history in
 * a different form:
 *
 * 1. **The wrong answer.** Ordering results structurally and highlighting the
 *    first one meant that typing `scope` — the first word of the journal entry
 *    "Scope is the deliverable" — highlighted the **home page**, whose
 *    description happens to contain "scopes". Enter took the reader somewhere
 *    they had not asked for. Measured before `matchScore` existed; the unit
 *    test in `lib/content/search-index.test.ts` pins the scoring, and the
 *    ranking test below pins what a reader actually sees.
 *
 * 2. **An audit that proves nothing.** `axe` inspects what is rendered, and a
 *    closed dialog is not rendered — so every route on this site could stay
 *    green forever while carrying a broken palette. This is Tahap 25 §7.5's
 *    lesson (three defects survived because axe ran at `scrollY 0` while the
 *    element sat below the fold) in the shape it takes for an overlay: the
 *    audit below runs with the palette **open**.
 *
 * 3. **A control that lies.** Without JavaScript the palette cannot exist, so
 *    the trigger must not be there either. A button that renders and does
 *    nothing when pressed is worse than no button.
 */

/** Opens the palette with the keyboard, the way the shortcut advertises. */
async function openWithShortcut(page: Page) {
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(600)
}

test.describe('the search palette', () => {
  for (const locale of ['en', 'id'] as const) {
    test(`/${locale}: the button and the shortcut both open it`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)
      await page.waitForTimeout(1200)

      const trigger = page.locator('[data-search-trigger]')
      await expect(
        trigger,
        'the search trigger is not in the header — a shortcut nobody can see is not a feature'
      ).toBeVisible()

      await trigger.click()
      await page.waitForTimeout(600)
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Escape, then the shortcut, so both doors are proved in one pass.
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      await expect(page.locator('[role="dialog"]')).toBeHidden()

      await openWithShortcut(page)
      await expect(
        page.locator('[role="dialog"]'),
        'Ctrl/Cmd-K did not open the palette'
      ).toBeVisible()

      const rows = await page.locator('[role="option"]').count()
      expect(
        rows,
        'the palette opened with no results at all — the index never arrived'
      ).toBeGreaterThan(5)
    })
  }

  test('it searches content, not only route names', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    /*
     * A client name that appears on no page title anywhere on the site. If
     * this finds nothing, the palette is a filtered navigation menu wearing a
     * search field, which is the version of this feature that should not
     * have been built (`docs/stages/TAHAP-28.md` §1).
     */
    await page.keyboard.type('kedai')
    await page.waitForTimeout(400)

    const results = await page.locator('[role="option"]').allTextContents()
    expect(
      results.length,
      'searching a client name found nothing — only titles are being matched'
    ).toBeGreaterThan(0)
    expect(results.join(' ')).toContain('Kedai')
  })

  test('a title match outranks a passing mention', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    await page.keyboard.type('scope')
    await page.waitForTimeout(400)

    const highlighted = await page.evaluate(
      () =>
        document
          .querySelector('[role="option"][data-highlighted]')
          ?.textContent?.trim() ?? ''
    )

    /*
     * Proved red on 2026-09-03: this returned the home page, because its
     * description contains "scopes". Enter would have opened it.
     */
    expect(
      highlighted,
      `Enter would open "${highlighted}" — a page that merely mentions the word, rather than the entry whose title is it`
    ).toContain('Scope is the deliverable')
  })

  test('it is operable from the keyboard alone, and gives focus back', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)

    // Focus the trigger by tabbing to it rather than clicking, so this test
    // never touches a pointer.
    await page.locator('[data-search-trigger]').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)

    const focusRole = await page.evaluate(() =>
      document.activeElement?.getAttribute('role')
    )
    expect(
      focusRole,
      'focus did not land in the search field when the palette opened'
    ).toBe('combobox')

    await page.keyboard.type('journal')
    await page.waitForTimeout(400)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(200)

    const pointer = await page.evaluate(() => {
      const input = document.querySelector('[role="combobox"]')
      const id = input?.getAttribute('aria-activedescendant')
      return { id, exists: id ? Boolean(document.getElementById(id)) : false }
    })
    expect(
      pointer.id,
      'the combobox names no active option, so a screen reader is told nothing as the highlight moves'
    ).toBeTruthy()
    expect(
      pointer.exists,
      `aria-activedescendant points at "${pointer.id}", which is not in the document`
    ).toBe(true)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    await expect(page.locator('[role="dialog"]')).toBeHidden()
    const returned = await page.evaluate(() =>
      document.activeElement?.hasAttribute('data-search-trigger')
    )
    expect(
      returned,
      'closing the palette dropped focus somewhere else, so a keyboard reader loses their place'
    ).toBe(true)
  })

  test('Enter opens the highlighted result', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    await page.keyboard.type('arus')
    await page.waitForTimeout(400)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2500)

    expect(
      new URL(page.url()).pathname,
      'Enter on the only result did not navigate to it'
    ).toBe('/en/work/arus-balik')
    await expect(page.locator('[role="dialog"]')).toBeHidden()
  })

  for (const locale of ['en', 'id'] as const) {
    test(`/${locale}: axe is clean with the palette open`, async ({ page }) => {
      await page.goto(`/${locale}`)
      await page.waitForTimeout(1200)
      await page.locator('[data-search-trigger]').click()
      await page.waitForTimeout(700)

      const rows = await page.locator('[role="option"]').count()
      expect(
        rows,
        'nothing was rendered, so this run proves nothing about the open palette'
      ).toBeGreaterThan(0)

      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()
      const found = results.violations.map(
        (violation) =>
          `${violation.impact}: ${violation.id} (${violation.nodes.length} node(s))`
      )
      expect(found, found.join('\n')).toEqual([])
    })
  }

  test('without JavaScript the trigger is not offered at all', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto('/en', { waitUntil: 'domcontentloaded' })

      // Present in the markup — the header is a client component and React
      // renders it server-side — but never shown, which is the contract.
      await expect(
        page.locator('[data-search-trigger]'),
        'the search button is offered without JavaScript, where pressing it does nothing'
      ).toBeHidden()

      // And the page is still the page.
      await expect(page.locator('h1')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
