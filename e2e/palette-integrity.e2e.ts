import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { contribution, grain } from '../lib/styles/scripts/luminance'
import { FEATURED_WORK } from './fixtures'

/**
 * The palette a page declares is the palette a page paints.
 *
 * ## The defect this was written for
 *
 * The repo owner ran the site, looked at it, and said: _"Kamu punya 2 mode
 * warna, dan salah satu mode warna malah menyatu dengan latar belakang."_
 * Two colour modes, and one of them merges into its background.
 *
 * It was true, it was site-wide, and no gate could see it. `contrast.test.ts`
 * reads the tokens out of the stylesheet; `visual-substance.e2e.ts` compares
 * an accent region against a bare one. Neither ever asked the simplest
 * question there is — **does the ground render as the colour the palette
 * says it is?** It did not:
 *
 *   light  /en/journal   paper #f4f3ef (244) painted as 232.7   -11.1
 *   dark   /en/studio    ink   #110f0d  (17) painted as  21.6    +4.5
 *
 * The cause was `vault/magic/noise-texture`, whose filter chain produced a
 * mid-grey #4d4d4d veil rather than zero-mean grain, so every ground on the
 * site slid toward one colour — which is exactly what "the two modes merge"
 * looks like from the outside. `docs/stages/TAHAP-55.md` has the derivation
 * and the fix.
 *
 * ## How it measures
 *
 * By photographing the same region twice: once as it ships, once with the
 * grain layer switched off. Subtracting the two removes the page and leaves
 * the layer, which is the only way to attribute a shift to it rather than to
 * whatever text or image happens to be in frame.
 *
 * Two assertions, and both are needed. The first alone would pass if the
 * grain were simply deleted; the second alone would pass on the veil that
 * caused the defect.
 */

/**
 * The sampled region: the right-hand side at mid-viewport, on the desktop
 * project's 1280x720.
 *
 * Deliberately not "an empty patch". Which pixels are empty differs per route
 * and per stage, and a gate that depends on that goes quietly blind the first
 * time a section grows. The subtraction below makes emptiness unnecessary:
 * anything identical in both frames cancels, so content in the frame costs
 * sensitivity and never correctness.
 */
const CLIP = { x: 820, y: 260, width: 420, height: 340 }

/**
 * Scrolled clear of the hero on every route, and short enough that no page in
 * the suite runs out of document before reaching it.
 */
const SCROLL = 1600

/**
 * Five routes, and the two that are missing were measured and excluded for
 * reasons that are properties of those pages rather than of this gate.
 *
 * `/en` — at `SCROLL` the passage is pinned and scrubbing, so the two frames
 * are of a moving scene. Measured: `coverage` 0.62 with an added grain of
 * **0.000**, which is what "these two photographs differ because the page
 * moved" looks like. Subtraction can only isolate a layer between two frames
 * that are otherwise identical.
 *
 * `/en/work` — the catalogue's covers fill the sampled band, so the grain is
 * behind opaque images. Measured: `coverage` 0.10, added grain 0.533. Nothing
 * wrong with the page; the band simply is not ground there.
 *
 * Both are covered anyway. The grain layer is one fixed element rendered once
 * by `components/layout/theme` for every route on the site, so a defect in it
 * cannot be present on `/en` and absent from the five below.
 */
const ROUTES = [
  { path: '/en/journal', theme: 'light' },
  { path: '/id/journal', theme: 'light' },
  { path: '/en/studio', theme: 'dark' },
  { path: '/en/practice/consulting', theme: 'dark' },
  { path: `/en/work/${FEATURED_WORK}`, theme: 'dark' },
] as const

async function settle(page: Page, path: string) {
  /*
   * `networkidle` is kept here, against the grain of the rest of the suite,
   * and the reason is specific to this measurement rather than a preference.
   *
   * Everything this file asserts comes from subtracting two photographs of
   * the same page. An image that finishes decoding *between* the two shots
   * appears in one and not the other, and the subtraction then reports that
   * image as the grain layer's contribution. Waiting for the network to go
   * quiet is the only cheap way to know nothing else is still arriving.
   *
   * The cost is time, so the budget is raised rather than the wait weakened:
   * five routes, each a full navigation plus two settles.
   */
  test.slow()

  await page.goto(path)
  await page.waitForLoadState('networkidle')
  await page.evaluate((y) => window.scrollTo(0, y), SCROLL)
  // Long enough for Lenis to finish carrying the page there and for any
  // reveal on the way to have run: a frame captured mid-transition would
  // differ between the two shots for reasons that are not the grain.
  await page.waitForTimeout(1500)
}

async function setGrain(page: Page, visible: boolean) {
  await page.evaluate((show) => {
    for (const node of Array.from(
      document.querySelectorAll<SVGElement>('[data-noise-texture]')
    )) {
      node.style.display = show ? '' : 'none'
    }
  }, visible)
  await page.waitForTimeout(300)
}

test.describe('the ground renders as the colour the palette declares', () => {
  for (const { path, theme } of ROUTES) {
    test(`${path} (${theme}) paints its declared ground`, async ({ page }) => {
      await settle(page, path)

      await setGrain(page, true)
      const shipped = await page.screenshot({ clip: CLIP })
      await setGrain(page, false)
      const bare = await page.screenshot({ clip: CLIP })

      // `contribution` downscales before subtracting, which averages the
      // grain away and leaves precisely the part that must not exist: the
      // layer's net shift of the ground.
      const shift = await contribution(shipped, bare)

      /*
       * 2.0 of 255, against a measured worst case of 1.06.
       *
       * The defect this replaces measured 11.1 on the light theme and 4.5 on
       * the dark one, so the bar separates the two states by a factor of five
       * at its narrowest. It is not tighter than that because the residual
       * below zero is real and understood: the grain's excursions clip at 0
       * where the ground is already near-black, and 8-bit compositing rounds.
       * Both are bounded and neither scales with the layer's opacity.
       *
       * A band this tight is affordable at all only because this is a
       * subtraction. There is no page in the number, only the layer.
       */
      expect(Math.abs(shift.mean)).toBeLessThan(2)
    })

    test(`${path} (${theme}) still has grain on it`, async ({ page }) => {
      await settle(page, path)

      await setGrain(page, true)
      const shipped = await page.screenshot({ clip: CLIP })
      await setGrain(page, false)
      const bare = await page.screenshot({ clip: CLIP })

      const patch = { left: 40, top: 40, width: 200, height: 200 }
      const [withGrain, without] = await Promise.all([
        grain(shipped, patch),
        grain(bare, patch),
      ])

      // Variances add, so the grain's own contribution is the difference of
      // squares rather than of the deviations. Whatever text or image sits in
      // the patch appears in both terms and drops out.
      const added = Math.sqrt(Math.max(0, withGrain ** 2 - without ** 2))

      /*
       * The floor exists so that "make the shift zero" cannot be satisfied by
       * deleting the layer — the failure mode of every gate that measures one
       * property of a thing that is allowed not to exist.
       *
       * 1.0 against a measured 1.61 (dark) and 2.39 (light). Those two are
       * the textures the site shipped before the repair — 1.58 and 2.44 by
       * the same instrument — so this floor also holds the surface where it
       * was, not merely above zero.
       */
      expect(added).toBeGreaterThan(1)
    })
  }
})
