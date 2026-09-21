import { devices, expect, test } from '@playwright/test'

/**
 * The search palette can be left, and read, without a keyboard — Tahap 88.
 *
 * ## The defect this exists for
 *
 * Opened by a tap on an emulated iPhone and iPad, the palette offered a
 * sighted reader no way out: its only close control was `sr-only`, 1×1px,
 * there for screen readers. Tapping outside the panel did close it, but
 * nothing said so, and on a phone the panel covers most of the screen. Its
 * foot read "Enter to open, Escape to close." with ↑↓ beside it — keys a phone
 * does not have, and VoiceOver reads that line too, because it is the search
 * field's `aria-describedby`.
 *
 * The repo owner asked for touch navigation and, explicitly, for no scroll
 * buttons. So this holds a visible close control and touch wording, and
 * asserts the absence of anything else to press.
 *
 * ## Why it is decided by pointer, not width
 *
 * The iPad measures 810px — the desktop layout. A width rule would give it
 * the keyboard version. `usePointerIsFine()` reads `(hover: hover) and
 * (pointer: fine)`, which is what separates a finger from a mouse.
 *
 * ## Red-proof
 *
 * Against the palette before this stage, on both devices: no visible button
 * at all, and a foot that named Enter and Escape.
 *
 * Emulation is Chromium's, not Safari's. What it exercises is the media query
 * the decision rests on, which both report the same way for touch; it is not
 * claimed to be an iOS test.
 */

/** A device descriptor without the engine it names, so it can run here. */
function asChromium(device: (typeof devices)[string]) {
  const { defaultBrowserType: _engine, ...rest } = device
  return rest
}

const TOUCH = [
  ['iPhone', asChromium(devices['iPhone 13'] ?? devices['Pixel 5']!)],
  ['iPad', asChromium(devices['iPad (gen 7)'] ?? devices['Pixel 5']!)],
] as const

/** The smallest touch target WCAG 2.5.5 names, in CSS pixels. */
const TOUCH_TARGET = 44

for (const [name, device] of TOUCH) {
  test.describe(`search palette on ${name}`, () => {
    test.use(device)

    test('has a visible way out and speaks to a finger', async ({ page }) => {
      await page.goto('/en')
      await page.locator('[data-search-trigger]').first().tap()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const buttons = await dialog.evaluate((node) =>
        [...node.querySelectorAll('button')].map((button) => {
          const box = button.getBoundingClientRect()
          return {
            label: (button.textContent ?? '').trim(),
            width: box.width,
            height: box.height,
          }
        })
      )
      const visible = buttons.filter(
        (button) => button.width > 2 && button.height > 2
      )

      expect(
        visible.length,
        `${name}: the palette offers no visible button — ${JSON.stringify(buttons)}`
      ).toBe(1)
      // Nothing else to press: no scroll buttons, by request.
      const [close] = visible
      expect(close?.height ?? 0).toBeGreaterThanOrEqual(TOUCH_TARGET)
      expect(close?.width ?? 0).toBeGreaterThanOrEqual(TOUCH_TARGET)

      // What is seen: the whole foot, keys glyph included whenever it is
      // rendered at all. What is announced: the field's `aria-describedby`.
      const foot = await dialog.locator('[data-palette-foot]').textContent()
      expect(foot ?? '', `${name}: the foot names a key`).not.toMatch(
        /Enter|Escape|↑|↓/
      )
      const described = await page
        .getByRole('combobox')
        .evaluate(
          (field) =>
            document.getElementById(
              field.getAttribute('aria-describedby') ?? ''
            )?.textContent ?? ''
        )
      expect(described, `${name}: the hint is empty`).not.toBe('')
      expect(described, `${name}: the hint names a key`).not.toMatch(
        /Enter|Escape|↑|↓/
      )

      await page.getByRole('button', { name: close?.label ?? '' }).tap()
      await expect(dialog).toBeHidden()
    })
  })
}

/*
 * The rail never runs into the title — Tahap 88.
 *
 * Found by looking at the iPad screenshot this stage took for its own
 * change: at 800 and 810px (a tablet, on the desktop layout) the practice
 * paths had no break opportunity and overran the 2/12 rail by about 30px, so
 * "/practice/consulting" printed straight into "Consulting". `/practice/
 * ai-data` escaped only because it has a hyphen. Clean from 1024 up.
 */
test.describe('search palette rail', () => {
  for (const width of [800, 810, 1024, 1440] as const) {
    test(`no path runs into its title at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/en')
      await page.locator('[data-search-trigger]').first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      // Measured in the face the reader sees. The first version of this
      // check read the rail before the mono face had loaded, in a fallback
      // narrow enough to fit, and passed against the overrunning build.
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(700)

      const overruns = await page.evaluate(() =>
        [...document.querySelectorAll('[role="option"]')].flatMap((option) => {
          const [rail, title] = [...option.children]
          if (!rail || !title) return []
          const text = document.createRange()
          text.selectNodeContents(rail)
          const reach = text.getBoundingClientRect().right
          const start = title.getBoundingClientRect().left
          return reach > start + 1
            ? [
                `"${(rail.textContent ?? '').trim()}" reaches ${Math.round(reach - start)}px into its title`,
              ]
            : []
        })
      )
      expect(overruns, overruns.join('\n')).toEqual([])
    })
  }
})

test.describe('search palette with a mouse', () => {
  test('keeps the keyboard version it was designed with', async ({ page }) => {
    await page.goto('/en')
    await page.locator('[data-search-trigger]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    const described = await page
      .getByRole('combobox')
      .evaluate(
        (field) =>
          document.getElementById(field.getAttribute('aria-describedby') ?? '')
            ?.textContent ?? ''
      )
    expect(described).toMatch(/Escape/)

    // The close control is still there for a screen reader, and still hidden
    // from the eye — the palette's original reasoning holds for a mouse.
    const closeBox = await dialog.evaluate((node) => {
      const button = node.querySelector('button')
      const box = button?.getBoundingClientRect()
      return box ? { width: box.width, height: box.height } : null
    })
    expect(closeBox, 'no close control at all').not.toBeNull()
    expect(closeBox?.width ?? 0).toBeLessThanOrEqual(2)
  })
})
