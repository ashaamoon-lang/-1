import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'

/**
 * Layout that fits its column, at every width and in every language.
 *
 * ## Why `scrollWidth > clientWidth` is not the test
 *
 * That is the obvious check, and it does not work here. `overflow: clip` on
 * the hero hides the overflow from document metrics: `docs/AUDIT-2026-08.md`
 * §1.1 measured `scrollWidth === clientWidth` **while the headline was
 * visibly cut off**. A document-level assertion would have stayed green
 * through the entire defect.
 *
 * So the assertion is per element: does this box extend past the box that is
 * supposed to contain it. That is the question a reader answers by looking,
 * expressed in a way a machine can fail on.
 *
 * ## Why both locales, at several widths
 *
 * The defect was Indonesian-only. "Commissioned" fits the narrowest supported
 * line; "memperhatikan" does not. English passed at every width the whole
 * time, so any sweep that tested one language would have reported the site
 * healthy. Copy is written by people, not by the type scale — the widths
 * below are the ones real phones use, not round numbers.
 */

const WIDTHS = [320, 360, 375, 390, 414, 430, 768]

/** Elements that must never exceed their own containing block. */
const CONTAINED = 'h1, h2, h3, p, figcaption, [data-reveal-item]'

test.describe('no element overflows its container', () => {
  for (const locale of routing.locales) {
    test(`/${locale} fits every phone width`, async ({ page }) => {
      // Seven full navigations of the site's longest page. The default 30s is
      // not enough on a cold CI runner, and it was not enough the first time
      // the runner had real CMS content to load: `page.goto` timed out
      // waiting for `networkidle` on both locales, desktop and mobile, in the
      // first run where `/en` had images to fetch at all.
      test.slow()

      const failures: string[] = []

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 844 })
        /*
         * `load`, not `networkidle`, and the change is a correction rather
         * than a loosening.
         *
         * This test measures whether a line of text is wider than the box
         * around it. That depends on layout and on the real typeface, and on
         * nothing else — not on the last CMS image finishing, which is what
         * `networkidle` waits for and what made this the slowest file in the
         * suite. Playwright's own documentation discourages `networkidle`
         * for exactly this reason.
         *
         * `document.fonts.ready` replaces what was actually needed from it:
         * measuring against a fallback face would report spill that the
         * shipped page does not have, or miss spill that it does.
         */
        await page.goto(`/${locale}`, { waitUntil: 'load' })
        await page.evaluate(() => document.fonts.ready)

        const overflowing = await page.evaluate(
          ({ selector, vw }) => {
            const bad: string[] = []

            for (const el of document.querySelectorAll(selector)) {
              const parent = el.parentElement
              if (!parent) continue

              const box = el.getBoundingClientRect()
              const bounds = parent.getBoundingClientRect()
              if (box.width === 0) continue

              // One physical pixel of slack: sub-pixel layout rounding is not
              // a defect, and asserting exact equality makes this flaky.
              const spill = Math.max(
                box.right - bounds.right,
                bounds.left - box.left,
                box.right - vw
              )
              if (spill > 1) {
                bad.push(
                  `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 32)}" spills ${spill.toFixed(1)}px`
                )
              }
            }

            return bad
          },
          { selector: CONTAINED, vw: width }
        )

        for (const item of overflowing) failures.push(`${width}px: ${item}`)
      }

      expect(failures, failures.join('\n')).toEqual([])
    })
  }
})
