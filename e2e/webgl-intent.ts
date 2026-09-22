import type { Locator, Page } from '@playwright/test'

/**
 * Whether a WebGL canvas is supposed to be here, decided the way the site
 * decides it — Tahap 90.
 *
 * ## The defect this exists to close
 *
 * Five canvas gates decided "this route has a canvas" by waiting for one and
 * skipping themselves when the wait ran out. A route with no canvas by design
 * and a route whose canvas was merely late gave the same answer. Measured on
 * this project's own laptop: the canvas arrives in 0.95–4.8s on desktop and
 * 1.4–12.3s on a phone profile forced to 1280px, and a material plate in
 * 2.2–14.6s — while the gates waited 6s. With three.js blocked outright, so
 * the canvas never came at all, `visual-substance`'s footer and material
 * gates **skipped and reported success**. `docs/HANDOFF.md` §5.1 carried this
 * as open debt from Tahap 79 to Tahap 90.
 *
 * ## Three states, not two
 *
 * - **Not intended** — the route declares no WebGL root, or the device fails
 *   the site's own test. Skip, and say which condition.
 * - **Intended, but the picture failed** — a plate only draws once its
 *   texture loads, and a texture from `cdn.sanity.io` can time out (the
 *   Tahap 86 server log recorded exactly that). Without it the `<img>` stays,
 *   which is correct. Skip that plate, and say so.
 * - **Intended, and it did not arrive** — fail. This is the case the old
 *   gates reported as a skip.
 *
 * The device test mirrors `lib/hooks/use-device-detection.ts`
 * (`supportsWebGL && width >= 800`) and the `!prefersReducedMotion` both the
 * canvas and `vault/webgl/material-image` add. If the site's rule changes,
 * this must change with it — which is why it is written out here once rather
 * than inlined into five specs.
 */

/**
 * Longest the canvas or a plate is waited for once it is intended.
 *
 * Measured worst cases on this laptop: canvas 12.3s, plate 14.6s — the phone
 * profile at 1280, with a software GPU at DPR 2.6. Thirty seconds is about
 * twice that, and a CI runner is faster than this machine.
 */
export const WEBGL_ARRIVAL_MS = 30_000

/** The breakpoint `use-device-detection` calls desktop. */
const DESKTOP_MIN_WIDTH = 800

export interface WebglIntent {
  intended: boolean
  /** Why not, when it is not — written for a skip message. */
  reason: string
}

/**
 * Asks the page whether this route, on this device, means to mount a canvas.
 *
 * Reads the visible `<main>` only: with `cachedNavigations` a hidden page
 * tree can still be in the document (`TAHAP-85.md`), and its marker says
 * nothing about the page on screen.
 */
export async function webglIntent(page: Page): Promise<WebglIntent> {
  return page.evaluate((minWidth) => {
    const declared = [
      ...document.querySelectorAll('main[data-webgl-root]'),
    ].some((main) => main.checkVisibility())
    if (!declared) {
      return {
        intended: false,
        reason: 'this route mounts no WebGL root (no data-webgl-root)',
      }
    }
    if (innerWidth < minWidth) {
      return {
        intended: false,
        reason: `WebGL is gated to desktop width (${innerWidth}px < ${minWidth}px)`,
      }
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return { intended: false, reason: 'reduced motion mounts no canvas' }
    }
    const probe = document.createElement('canvas')
    if (!probe.getContext('webgl2')) {
      return { intended: false, reason: 'this browser offers no WebGL2' }
    }
    return { intended: true, reason: '' }
  }, DESKTOP_MIN_WIDTH)
}

/**
 * Waits for the canvas an intended route must mount, and fails if it never
 * comes. Never skips: by the time this is called the canvas is owed.
 */
export async function waitForCanvas(page: Page): Promise<void> {
  const arrived = await page
    .locator('canvas')
    .first()
    .waitFor({ state: 'attached', timeout: WEBGL_ARRIVAL_MS })
    .then(() => true)
    .catch(() => false)
  if (!arrived) {
    throw new Error(
      `WebGL was intended here — the route declares a root, the width is desktop, motion is allowed and WebGL2 exists — but no canvas arrived in ${WEBGL_ARRIVAL_MS / 1000}s`
    )
  }
}

/**
 * `drawn`, or the reason a plate is correctly not asked.
 *
 * A plate draws only from a decoded texture, so a picture that failed — or
 * is still arriving when the budget runs out — is the network's state, not
 * the material's. The first local run of this helper treated a picture still
 * loading at 30s as a plate that would not draw, and failed a gate on a slow
 * `cdn.sanity.io` response.
 */
export type PlateState = 'drawn' | 'no-image' | 'image-pending'

/** The skip message for a plate that is correctly not asked. */
export function plateSkipReason(state: PlateState): string {
  return state === 'no-image'
    ? "the plate's picture failed to load, so it correctly keeps its <img>"
    : `the plate's picture was still loading after ${WEBGL_ARRIVAL_MS / 1000}s — a network state, not the material's`
}

/**
 * Waits for a material plate to hand over to the canvas.
 *
 * Throws only when the picture has loaded and the plate still never draws:
 * the one state that is the material's fault.
 *
 * Callers must give their test a budget longer than this wait. The first
 * version ran inside a 30s default, the test's own timeout fired first, and
 * this function's message — the useful one — never printed.
 */
export async function waitForPlate(shell: Locator): Promise<PlateState> {
  const state = await shell.evaluate(
    (node, timeout) =>
      new Promise<PlateState | 'late'>((resolve) => {
        const started = performance.now()
        const tick = () => {
          if (node.hasAttribute('data-material')) return resolve('drawn')
          const img = node.querySelector('img')
          if (img?.complete && img.naturalWidth === 0) {
            return resolve('no-image')
          }
          if (performance.now() - started > timeout) {
            return resolve(img && !img.complete ? 'image-pending' : 'late')
          }
          setTimeout(tick, 100)
        }
        tick()
      }),
    WEBGL_ARRIVAL_MS
  )
  if (state === 'late') {
    throw new Error(
      `a material plate with a loaded picture did not hand over to the canvas in ${WEBGL_ARRIVAL_MS / 1000}s`
    )
  }
  return state
}

/**
 * A test budget that outlasts both waits above, with room for the test's own
 * work. Measured against the slowest profile this suite runs.
 */
export const WEBGL_TEST_BUDGET_MS = 120_000
