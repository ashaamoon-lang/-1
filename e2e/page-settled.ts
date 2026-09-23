import type { Page } from '@playwright/test'

/**
 * Waiting for the entrance to be over, instead of guessing how long it takes
 * — Tahap 91.
 *
 * `vault/motion/curtain` covers the whole viewport once per session and lifts
 * on a fixed CSS animation. Gates that photograph a page waited a flat 2800ms
 * for it, which is comfortable on a quiet machine and not on a busy one: under
 * two Playwright workers this laptop produced an accent reading of **238.1
 * with the accent and 238.1 without** — two screenshots of the curtain, not of
 * the page, on a dark page whose band measures around 24.
 *
 * The curtain has an end state worth waiting for: its animation finishes at
 * `visibility: hidden`, and on any later load in the same session the session
 * guard hides it outright. Playwright's `hidden` covers both, and also the
 * case where the element is absent — under `prefers-reduced-motion` the
 * component renders nothing.
 */

/**
 * Longest the entrance is waited for, derived from the entrance — Tahap 93.
 *
 * `vault/motion/curtain` holds for `--duration` + `--duration-fast` and then
 * lifts over `--duration`: 400 + 200 + 400 = **1000ms** after the animation
 * starts. Six times that is generous on a starved runner and still leaves 24
 * of the 30 seconds for what the gate actually measures.
 *
 * The first version of this file wrote `30_000` here, which is the **whole**
 * test budget: `playwright.config.ts` sets no top-level `timeout`, so every
 * test runs on Playwright's 30s default (the 300s at `:137` belongs to
 * `webServer`, and is the limit for starting the server). A single wait the
 * size of the budget cannot fail with a useful message — the test's own
 * timeout fires first, and whatever assertion came next is blamed. CI printed
 * exactly that on `bfc172f`: 40.1s, and `/en/practice/consulting declares no
 * accent region` from a 5s assertion that never got its turn.
 *
 * `e2e/webgl-intent.ts` records this same mistake being caught one stage
 * earlier, and `WEBGL_TEST_BUDGET_MS` is the repair there. This file
 * reproduced it anyway. Measured before the change, with the curtain pinned
 * visible: `waitForEntrance` returned after **30 033ms**.
 */
const ENTRANCE_MS = 6_000

/**
 * Resolves once the entrance curtain is not covering the page.
 *
 * Never throws: a missing curtain is a page with no entrance, which is a
 * legitimate state rather than a failure, and the gates that call this are
 * measuring something else.
 */
export async function waitForEntrance(page: Page): Promise<void> {
  await page
    .locator('[data-curtain]')
    .first()
    .waitFor({ state: 'hidden', timeout: ENTRANCE_MS })
    .catch(() => {
      // A curtain that never lifts is the entrance gate's subject
      // (`e2e/entrance.e2e.ts`), not this one's.
    })
}
