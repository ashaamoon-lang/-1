import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { grain, tone } from '../lib/styles/scripts/luminance'
import { FEATURED_WORK } from './fixtures'

/**
 * What a reader actually sees, measured rather than inferred.
 *
 * ## The class of defect this exists for
 *
 * Every other gate here reads the DOM, the network, or the source. None had
 * ever looked at where content sits or what a surface renders as, and two
 * defects shipped through that gap:
 *
 *   - **Tahap 17.** The hero's WebGL wash rendered *darker* than the page
 *     behind it — mean luminance 4.0/255 against the ground's 15.5. Every
 *     gate was green. "Is there a canvas" and "does the canvas draw something
 *     worth drawing" are different questions, and only the second one matters
 *     to a reader.
 *   - **Tahap 18.** Every practice page rendered its content flush against
 *     the viewport edge — `h1` at x=0 while the header's wordmark sat at 14 —
 *     on three routes, both viewports, both languages. Nothing asked where
 *     content starts.
 *
 * ## What this cannot catch
 *
 * Composition. A page can have a correct gutter, a correct tonal range, and
 * still be badly arranged; that judgement needs eyes, and
 * `docs/stages/TAHAP-18.md` records the pass that used them. This gate holds
 * the two properties that turned out to be mechanically checkable.
 */

const GUTTER_ROUTES = [
  '/en',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  ...PRACTICES.map((value) => `/en/practice/${value}`),
  '/id',
]

/*
 * `/ai` is deliberately excluded, and the exemption is the point rather than
 * an oversight: `app/[locale]/ai/layout.tsx` bypasses the app's normal layout
 * on purpose — it is a plain-HTML index for crawlers and agents, and its own
 * stylesheet says so. A rule about the site's chrome should not be applied to
 * the one page that deliberately has none.
 */

/**
 * How far a measured gutter may drift from the header's own.
 *
 * Not zero: the wordmark is a link with its own box, and sub-pixel layout at
 * fractional viewport widths moves things by a hair. Measured across the six
 * routes above, every correct page matched exactly; 2px leaves room for the
 * rounding without admitting a page that forgot its padding entirely.
 */
const GUTTER_TOLERANCE = 2

/*
 * The `h1` alone, and that is the instrument being corrected rather than the
 * page.
 *
 * The first version also measured the first `<p>` in document order as "body
 * copy". On the home page that is the hero's practice index, which is
 * deliberately right-aligned — 851px against the header's 14 — so the gate
 * went red against a correct design while it was going red against three
 * genuinely broken pages. A heading is unambiguous: every page has exactly
 * one, and it always sits in that page's main column.
 */
async function gutters(page: Page) {
  return page.evaluate(() => {
    const leftOf = (element: Element | null) =>
      element ? Math.round(element.getBoundingClientRect().left) : null

    return {
      chrome: leftOf(document.querySelector('header a')),
      heading: leftOf(document.querySelector('h1')),
    }
  })
}

test.describe('the page starts where its own chrome starts', () => {
  for (const route of GUTTER_ROUTES) {
    test(`${route} keeps its gutter`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(1800)

      const measured = await gutters(page)

      expect(measured.chrome, `${route} rendered no header link`).not.toBeNull()
      expect(measured.heading, `${route} rendered no h1`).not.toBeNull()

      const chrome = measured.chrome ?? 0
      expect(
        Math.abs((measured.heading ?? 0) - chrome),
        `${route}: the heading starts at ${measured.heading}px while the header starts at ${chrome}px — the page is missing its horizontal padding`
      ).toBeLessThanOrEqual(GUTTER_TOLERANCE)
    })
  }
})

/**
 * How much more modulation a live accent must add over the same page with the
 * canvas hidden.
 *
 * Both assertions below are **differences between two shots of the same
 * page**, which is what makes them robust: the text, the layout and the
 * screenshot pipeline are identical in each arm, so they cancel, and what is
 * left is the accent's own contribution. An absolute floor would have to be
 * retuned for every viewport and would drift between machines.
 *
 * Measured on `/en` at 1280x800 with the pipeline correct: mean 30.2 against
 * 15.5 with the canvas hidden, tonal range 13.9 against 0.0. Before the Tahap
 * 17 fix the same shot gave mean **4.0** — below the hidden arm, which is the
 * defect stated as a number. The margin is set well under the measured
 * headroom so a legitimate retune of the wash does not trip it.
 */
const ACCENT_RANGE_MARGIN = 3

/*
 * Every route that declares an accent, not just the one that found the bug.
 *
 * `/en` carries the WebGL wash; a practice page carries the same gradient in
 * CSS, because `e2e/route-budget.e2e.ts` allows three.js on exactly one route
 * and this is deliberately not it. Both are "a region the design says should
 * carry tone", so both answer to the same two questions.
 */
const ACCENT_ROUTES = ['/en', `/en/practice/${PRACTICES[0]}`]

test.describe('a declared accent carries tone, and never subtracts it', () => {
  for (const [width, height, label] of [
    [1280, 800, 'desktop'],
    [390, 844, 'mobile'],
  ] as const) {
    for (const route of ACCENT_ROUTES) {
      test(`${route} at ${label}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await page.goto(route)
        await page.waitForTimeout(2800)

        const region = page.locator('[data-accent-region]').first()
        await expect(
          region,
          `${route} declares no accent region`
        ).toBeAttached()

        /*
         * Which control to remove depends on which accent is showing, and both
         * are real: `lib/hooks/use-device-detection` gates WebGL on
         * `supportsWebGL && isDesktop`, so a phone gets the CSS fallback
         * gradient by design, not by failure.
         *
         * A live mesh draws into the shared root canvas, not into the region's
         * own box, so hiding the region would leave it painting. The fallback is
         * the opposite: it *is* the region's background. Removing the wrong one
         * would compare a page with itself and pass no matter what — a gate that
         * cannot fail.
         */
        const live = (await page.locator('[data-accent-live]').count()) > 0

        /*
         * A band of the region, not the whole of it. The clip has to sit inside
         * the viewport for both arms to be comparable, and the region is a
         * fixed, full-screen layer.
         */
        const clip = {
          x: 0,
          y: Math.round(height * 0.15),
          width,
          height: Math.round(height * 0.35),
        }

        const withAccent = await page.screenshot({ clip })
        await page.evaluate((hasMesh: boolean) => {
          const target = hasMesh
            ? document.querySelector('canvas')
            : document.querySelector('[data-accent-region]')
          if (target instanceof HTMLElement) target.style.visibility = 'hidden'
        }, live)
        await page.waitForTimeout(600)
        const withoutAccent = await page.screenshot({ clip })

        const lit = await tone(withAccent)
        const bare = await tone(withoutAccent)

        // The defect that shipped, written as an invariant. The hero's wash
        // rendered at 4.0 against a ground of 15.5 — the page was better off
        // with its own decoration switched off.
        expect(
          lit.mean,
          `the accent made the page darker: ${lit.mean.toFixed(1)} with it, ${bare.mean.toFixed(1)} without`
        ).toBeGreaterThan(bare.mean)

        // And it has to do something, not merely lift the whole band evenly.
        expect(
          lit.range,
          `the accent added no modulation: range ${lit.range.toFixed(1)} with it, ${bare.range.toFixed(1)} without`
        ).toBeGreaterThan(bare.range + ACCENT_RANGE_MARGIN)

        // Grain is texture, not noise. Tahap 17 measured 21.0/255 — 77% of the
        // band's own mean — after the colour pipeline was corrected, because the
        // value had been tuned against the broken one.
        const texture = await grain(withAccent, {
          left: 40,
          top: 20,
          width: 96,
          height: 96,
        })
        expect(
          texture,
          `grain reads as static rather than texture: sd ${texture.toFixed(1)}/255`
        ).toBeLessThan(12)
      })
    }
  }
})
