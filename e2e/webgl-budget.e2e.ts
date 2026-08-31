import type { Browser } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Nobody downloads the 3D engine unless they are shown 3D.
 *
 * `CLAUDE.md` #13 says 3D is an accent and no page may depend on it. That was
 * true of the *rendering* and false of the *bytes*: `/en` emitted three.js and
 * react-three-fiber as a parser-initiated `<script async>` — 245.6 KB gzip,
 * 931 KB raw, 47% of the page's script weight — to every visitor, including
 * phones and anyone with `prefers-reduced-motion`, both of whom render the CSS
 * gradient fallback and never see a canvas.
 *
 * Two separate static imports caused it (`<Canvas>` and `SceneShell`), and
 * fixing either alone changed nothing, which is why this asserts the observable
 * outcome — bytes on the wire — rather than any particular import style.
 *
 * Tahap 5 measured `/en/ai` dropping 47%, concluded the WebGL opt-in worked,
 * and never re-measured `/en`. See `docs/AUDIT-2026-08.md` §1.4.
 */

/*
 * Identify the engine by what is inside it, not by how big it is.
 *
 * A plain size budget was the first shape of this test and it was wrong: it
 * flagged the React and Next runtime chunks (153 KB and 220 KB), which every
 * page legitimately loads. Size is a proxy; the actual claim is "three.js was
 * not shipped", so match three.js.
 */
const ENGINE_MARKERS = /THREE\.|WebGLRenderer|react-three-fiber/

/** Below this, a chunk is too small to be an engine and scanning it is waste. */
const SCAN_FLOOR_BYTES = 50_000

async function loadHomeWithoutMotion(browser: Browser) {
  /*
   * An explicit context, not `test.use({ reducedMotion })`.
   *
   * The fixture form silently did not take here — the page rendered a canvas
   * under what should have been reduced motion — while
   * `browser.newContext({ reducedMotion: 'reduce' })` behaves as documented.
   * Since the whole assertion below rests on the premise that no canvas
   * renders, the form that demonstrably applies the preference is the one to
   * use, and the premise is asserted rather than assumed.
   */
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const engineChunks: { name: string; kb: number }[] = []

  page.on('response', async (response) => {
    if (!response.url().includes('/_next/static/chunks')) return
    try {
      const body = await response.body()
      if (body.length < SCAN_FLOOR_BYTES) return
      if (!ENGINE_MARKERS.test(body.toString('latin1'))) return

      engineChunks.push({
        name: response.url().split('/').pop() ?? '?',
        kb: Math.round(body.length / 1024),
      })
    } catch {
      // A chunk served from cache has no retrievable body; nothing to weigh.
    }
  })

  await page.goto('/en', { waitUntil: 'networkidle' })
  // Give any post-hydration import() time to fire, so a lazy load that should
  // not have happened still shows up here.
  await page.waitForTimeout(1500)

  const canvases = await page.evaluate(
    () => document.querySelectorAll('canvas').length
  )

  await context.close()
  return { engineChunks, canvases }
}

test('reduced motion downloads no 3D engine, and renders no canvas', async ({
  browser,
}) => {
  const { engineChunks, canvases } = await loadHomeWithoutMotion(browser)

  // If a canvas did render the premise is wrong and the byte assertion below
  // would be testing the wrong thing.
  expect(canvases, 'reduced motion must render the CSS fallback').toBe(0)

  const report = engineChunks
    .map((chunk) => `${chunk.name} ${chunk.kb}KB`)
    .join(', ')
  expect(
    engineChunks,
    `3D engine shipped to a page with no canvas: ${report}`
  ).toEqual([])
})
