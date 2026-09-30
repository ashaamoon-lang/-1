import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'

/**
 * The phone menu opens, leads somewhere, and lets go — with or without a
 * script.
 *
 * ## The defect this was written for
 *
 * MENU was a React state toggle over the nav, which the stylesheet kept at
 * `display: none` below the desktop breakpoint. With scripting off the button
 * did nothing, so on a phone the header carried **no** route links; only the
 * footer led anywhere. And nothing in this suite ever opened the menu at all:
 * `agent-readiness.e2e.ts` checks that `id="header-nav"` is in the HTML, and
 * `keyboard-focus.e2e.ts` runs at desktop width, where there is no menu.
 *
 * The fork made the nav itself a `popover="auto"` (`components/layout/header`),
 * so the browser opens it, closes it on Escape, and hands focus back.
 *
 * ## Found the way a reader finds it
 *
 * The menu is located as the **visible navigation named "Primary"**, not by
 * an id. The first version of this file used the id of a second, sheet-only
 * nav, and against the build before the change every test failed with
 * "element not found" — red because the id did not exist yet, which says
 * nothing about what the old menu did. Located by role, the same tests run
 * against both menus and fail only on behaviour.
 *
 * Measured against the build before the change: scripting off, the sheet's
 * geometry (the dropdown ended at 216px of an 844px screen) and Escape were
 * red — the defects. Navigating from it, reduced motion and axe were green
 * there too: the old dropdown did those, and these tests keep the new sheet
 * doing them. Tab into the menu was green there once hydrated and red once
 * when Enter landed before hydration — the old toggle needed React to exist;
 * a popover does not.
 *
 * ## What review added
 *
 * The first popover version rendered that second nav, and a read-only review
 * with an adversarial verifier found what these tests had not: a hidden copy
 * of every route link in the desktop page (five other gates walked into it),
 * focus able to Tab out onto page content under the opaque sheet, ⌘K opening
 * the palette underneath it, the page scrolling behind it, and three tests
 * here that could not fail — Escape never moved focus into the sheet, the
 * "closes behind it" check passed without the close, and reduced motion was
 * read after the entrance had ended anyway. Each is a test below now.
 */

/** The words on the sheet are display type, not an 11px list. */
const DISPLAY_MIN_PX = 44

/** The open menu: the visible primary navigation. */
const menuOf = (page: Page) => page.getByRole('navigation', { name: 'Primary' })

async function openMenu(page: Page) {
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(menuOf(page)).toBeVisible()
}

/** Transitions still running inside the header's nav. */
function runningInNav(page: Page) {
  return page.evaluate(
    () =>
      document.getAnimations().filter((animation) => {
        const target = (animation.effect as KeyframeEffect | null)?.target
        return (
          target instanceof Element &&
          target.closest('header nav') !== null &&
          animation.playState === 'running'
        )
      }).length
  )
}

/** Waits for the entrance to end, so what is measured is the settled menu. */
async function settle(page: Page) {
  await expect.poll(() => runningInNav(page)).toBe(0)
}

/**
 * The search palette is open, its field holds focus, and nothing is painted
 * over that field.
 *
 * Focus is waited for **inside the dialog**: review found the first version
 * hit-testing whatever `:focus` was — still MENU, before the palette's chunk
 * had loaded — and passing on the bar. And the hit test is polled, because
 * the palette has an entrance of its own: read in its first frames it found
 * something other than the field, 800ms later the field itself (measured).
 * A sheet left over the palette never lets go, so this still times out red.
 */
async function expectPaletteOnTop(page: Page) {
  const field = page.getByRole('dialog').locator(':focus')
  await expect(field).toBeVisible()
  await expect
    .poll(
      () =>
        field.evaluate((node) => {
          const rect = node.getBoundingClientRect()
          const hit = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          )
          return hit !== null && (node.contains(hit) || hit.contains(node))
        }),
      { message: 'the palette field is painted over' }
    )
    .toBe(true)
}

test.describe('the phone menu', () => {
  test.beforeEach(() => {
    test.skip(
      test.info().project.name !== 'mobile',
      'desktop has no menu; its routes sit in the header row'
    )
  })

  test('with scripting off, MENU opens the routes and they lead somewhere', async ({
    browser,
  }) => {
    // Inherits the mobile project's device.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto('/en/studio', { waitUntil: 'load' })
      await openMenu(page)

      const menu = menuOf(page)
      const work = menu.getByRole('link', { name: 'Work', exact: true })
      await expect(work).toBeInViewport()

      const size = await work.evaluate((link) =>
        Number.parseFloat(getComputedStyle(link).fontSize)
      )
      expect(size, `the route words are ${size}px`).toBeGreaterThanOrEqual(
        DISPLAY_MIN_PX
      )

      await expect(
        menu.getByRole('link', { name: 'Studio', exact: true }),
        'the page the reader is on is not marked'
      ).toHaveAttribute('aria-current', 'page')

      /*
       * The entrance ends before the tap. With scripting off, Playwright's
       * "stable" check did not settle on a link still rising — measured, two
       * attempts in eight seconds and a timeout — while the same click made
       * after the rise navigated at once. A finger does not wait for
       * stability; the harness does, so it is given a still target.
       */
      await settle(page)
      await menu.getByRole('link', { name: 'Journal', exact: true }).click()
      await expect(page).toHaveURL(/\/en\/journal$/)
    } finally {
      await context.close()
    }
  })

  test('the sheet fills the screen under the bar, and the bar stays', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)

    const sheet = await menuOf(page).evaluate((node) =>
      node.getBoundingClientRect().toJSON()
    )
    // The site's header is the banner landmark; articles carry headers too.
    const bar = await page
      .getByRole('banner')
      .evaluate((node) => node.getBoundingClientRect().height)
    const viewport = page.viewportSize() ?? { width: 0, height: 0 }

    expect(
      Math.abs(sheet.top - bar),
      'the sheet does not start at the bar'
    ).toBeLessThanOrEqual(1)
    expect(
      sheet.bottom,
      'the sheet stops short of the screen'
    ).toBeGreaterThanOrEqual(viewport.height - 1)
    expect(sheet.width).toBeGreaterThanOrEqual(viewport.width - 1)
    // MENU is still on screen, and it is now the way out.
    await expect(page.getByRole('button', { name: 'Close' })).toBeInViewport()
  })

  test('Escape from inside the sheet closes it and focus comes back to MENU', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)

    // Focus goes into the sheet first, so the return is a return.
    await page.keyboard.press('Tab')
    const inside = await menuOf(page).evaluate((nav) =>
      nav.contains(document.activeElement)
    )
    expect(inside, 'Tab from MENU did not enter the sheet').toBe(true)

    await page.keyboard.press('Escape')
    await expect(menuOf(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused()
  })

  test('from the keyboard, Tab goes from MENU into the menu, and the stop is visible', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'load' })
    await page.getByRole('button', { name: 'Menu' }).focus()
    await page.keyboard.press('Enter')
    await expect(menuOf(page)).toBeVisible()

    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active) return null
      const rect = active.getBoundingClientRect()
      const style = getComputedStyle(active)
      const nav = active.closest('nav')
      return {
        inMenu:
          nav !== null &&
          nav.getAttribute('aria-label') === 'Primary' &&
          nav.getClientRects().length > 0,
        text: active.textContent?.trim() ?? '',
        onScreen:
          rect.top >= 0 &&
          rect.bottom <= innerHeight &&
          rect.left >= 0 &&
          rect.right <= innerWidth,
        outlined: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
      }
    })

    expect(stop?.inMenu, `Tab from MENU went to "${stop?.text}"`).toBe(true)
    expect(stop?.onScreen, 'the first stop in the menu is off screen').toBe(
      true
    )
    expect(stop?.outlined, 'the first stop in the menu has no ring').toBe(true)
  })

  test('Tab past the last link never lands focus under the sheet', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)
    const links = await menuOf(page).getByRole('link').count()
    expect(links).toBeGreaterThan(0)

    // What the sheet covers cannot take focus while it covers it.
    const inert = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main, footer')]
        .filter((node) => node.getClientRects().length > 0)
        .map((node) => node.inert)
    )
    expect(inert.length, 'no page content to cover').toBeGreaterThan(0)
    expect(inert, 'content under the open sheet can take focus').not.toContain(
      false
    )

    for (let stop = 0; stop <= links; stop += 1)
      await page.keyboard.press('Tab')

    /*
     * Wherever focus went, nothing is painted over it. With the covered
     * content inert, a Tab past the last link leaves the page for the
     * browser's own controls — that is allowed; landing on the page under
     * the sheet, which the first popover version did, is not.
     */
    const covered = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null
      if (!active || active === document.body) return null
      const rect = active.getBoundingClientRect()
      const hit = document.elementFromPoint(
        rect.left + Math.min(rect.width, 8) / 2,
        rect.top + Math.min(rect.height, 8) / 2
      )
      return hit && (active.contains(hit) || hit.contains(active))
        ? null
        : `${active.tagName} under ${hit?.tagName ?? 'nothing'}`
    })
    expect(covered, 'the focused element is painted over').toBeNull()
  })

  test('⌘K with the menu open puts the palette on top, not under the sheet', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)

    await page.keyboard.press('Control+k')
    await expect(menuOf(page)).toBeHidden()
    await expectPaletteOnTop(page)
  })

  test('focus going anywhere outside the sheet closes it, and search from the keyboard lands on top', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    const menu = page.getByRole('button', { name: 'Menu' })
    await menu.focus()
    await page.keyboard.press('Enter')
    await expect(menuOf(page)).toBeVisible()

    /*
     * Shift+Tab from MENU never passes through the sheet — review found this
     * path left it open over whatever took focus next, and search opened its
     * palette underneath it.
     */
    await page.keyboard.press('Shift+Tab')
    await expect(menuOf(page)).toBeHidden()

    await page.locator('[data-search-trigger]').focus()
    await page.keyboard.press('Enter')
    await expectPaletteOnTop(page)
  })

  test('after a client navigation, MENU opens this page’s sheet', async ({
    page,
  }) => {
    /*
     * Next keeps the previous page mounted in a hidden `<Activity>`, so the
     * document now holds two `#header-nav` — measured — and a `popovertarget`
     * resolved by id takes the first one in the tree.
     */
    await page.goto('/en', { waitUntil: 'networkidle' })
    await page.locator('footer a[href="/en/studio"]').first().click()
    await expect(page).toHaveURL(/\/en\/studio$/)
    await page.waitForLoadState('networkidle')

    await openMenu(page)
    await expect(
      menuOf(page).getByRole('link', { name: 'Studio', exact: true })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('a link in the menu navigates, and the menu is shut when the reader comes back', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)
    await settle(page)

    await menuOf(page).getByRole('link', { name: 'Work', exact: true }).click()
    await expect(page).toHaveURL(/\/en\/work$/)
    await expect(menuOf(page)).toBeHidden()

    /*
     * Each page renders its own header, and Next keeps the previous page in a
     * hidden `<Activity>` (`cacheComponents`). Back reveals it as it was — so
     * a sheet left open there comes back open. Review found the first version
     * of this test checking only the destination, where it could not fail.
     */
    await page.goBack()
    await expect(page).toHaveURL(/\/en$/)
    await expect(menuOf(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
  })

  test('the page behind holds still while the sheet is open', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(300)
    await openMenu(page)

    const before = await page.evaluate(() => window.scrollY)
    const overflow = await page.evaluate(
      () => getComputedStyle(document.documentElement).overflowY
    )
    await page.mouse.move(195, 600)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(600)
    const after = await page.evaluate(() => window.scrollY)

    expect(overflow, 'the document can still scroll').toBe('hidden')
    expect(after, `the page moved from ${before} to ${after}`).toBe(before)
  })

  test('under reduced motion the words are there at once', async ({
    browser,
  }) => {
    /*
     * A control first: without the preference, the entrance is running the
     * moment the sheet opens. Review found the first version reading
     * opacities once, late enough that the entrance had ended either way.
     */
    const plain = await browser.newContext()
    const control = await plain.newPage()
    const reduced = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await reduced.newPage()
    try {
      await control.goto('/en', { waitUntil: 'networkidle' })
      await control.getByRole('button', { name: 'Menu' }).click()
      expect(
        await runningInNav(control),
        'no entrance ran without the preference — this test cannot see one'
      ).toBeGreaterThan(0)

      await page.goto('/en', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: 'Menu' }).click()
      expect(await runningInNav(page), 'the entrance ran anyway').toBe(0)
      await expect(menuOf(page)).toBeVisible()
    } finally {
      await plain.close()
      await reduced.close()
    }
  })

  test('the open menu passes axe', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await openMenu(page)
    await settle(page)

    const results = await new AxeBuilder({ page })
      .withTags(axeTags())
      .include('header')
      .analyze()
    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious'
    )
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.help}`)
    ).toEqual([])
  })
})

test.describe('the same nav on desktop', () => {
  test('is the header row: visible, with no hidden copy of any link', async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'a phone opens the nav as a sheet; the tests above cover it'
    )
    /*
     * The first popover version rendered a second nav for the sheet, and on
     * desktop its links sat in the page hidden: two `aria-current` in the
     * header, and pressables no one could see — `site-reach`,
     * `interaction-grammar`, `journey`, `motion` and `navigation-landing`
     * each walked into one.
     */
    await page.goto('/en/work', { waitUntil: 'networkidle' })

    await expect(menuOf(page)).toBeVisible()
    // Each route once, by name — not a count, which `next dev` breaks with
    // its fourth, Storybook, link (found in review).
    for (const name of ['Work', 'Studio', 'Journal']) {
      await expect(
        page.getByRole('banner').getByRole('link', { name, exact: true })
      ).toHaveCount(1)
    }
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden()

    const header = await page.getByRole('banner').evaluate((bar) => ({
      current: bar.querySelectorAll('[aria-current="page"]').length,
      hiddenPressables: [...bar.querySelectorAll('[data-press]')].filter(
        (node) => node.getClientRects().length === 0
      ).length,
    }))
    expect(
      header.current,
      'more than one link says "you are here"'
    ).toBeLessThanOrEqual(1)
    expect(
      header.hiddenPressables,
      'pressables in the header no one can see'
    ).toBe(0)
  })
})
