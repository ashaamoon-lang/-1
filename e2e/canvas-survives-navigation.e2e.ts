import { expect, test } from '@playwright/test'

/**
 * A page must not go grey when you navigate away and come back — Tahap 85.
 *
 * ## The defect this exists for
 *
 * `components/layout/wrapper` renders `<Canvas root>` inside the page tree, so
 * every route mounts its own WebGL root. Next's `cachedNavigations` keeps the
 * previous page's tree alive but hidden, and React runs effect **cleanups**
 * for a hidden tree while keeping its DOM. r3f tears its root down from a
 * `useEffect` with `[]` deps, so that cleanup disposes the renderer — and the
 * `<canvas>` element stays attached. Showing the tree again re-runs effects,
 * but a `[]`-deps setup rebuilds nothing.
 *
 * What is left is a `position: fixed`, viewport-sized canvas whose GL context
 * is dead, and a dead canvas composites as flat grey over the whole page.
 * Measured on `/en`: mean viewport luminance **34.8** on a fresh load against
 * **143.2** after leaving and returning.
 *
 * ## Why this gate reads pixels
 *
 * Because nothing else can see it. A full dump of every element over
 * 200,000px² — `z-index`, `opacity`, both backgrounds, blend mode, visibility
 * — was **byte-identical** fresh versus returned, and the canvas reported
 * itself alive at 1270×720 in both. `pointer-events: none` keeps it out of
 * `elementsFromPoint`, and `getComputedStyle` knows nothing about a lost GL
 * context. The only instrument that registered the defect was the screenshot.
 *
 * So this gate asserts two independent things, and keeps both on purpose:
 * the page is as dark as it was (pixels), and no visible canvas is holding a
 * lost context (cause). Either alone would be a gate that passes for the
 * wrong reason — a page could be dark because the wash never drew at all.
 *
 * ## Red-proof
 *
 * Against the code before the fix, in this file's own terms: `/en` returned
 * at luminance 143.2 against a fresh 34.8 — a 4.1× rise, far outside the 15%
 * band — with `lost=true` on the visible canvas.
 *
 * Desktop only. The mobile project's `testMatch` allowlist is for specs that
 * exist to catch a sub-800px defect; this one is about context lifetime, which
 * is not a width.
 */

/** How far the returned page may drift from the fresh one. */
const TOLERANCE = 0.15

/**
 * Mean sRGB luminance of a viewport screenshot, 0–255.
 *
 * Downsampled before summing: the grain layer and the text would otherwise
 * dominate a per-pixel comparison, and what is being measured here is the
 * brightness of a full-screen wash, not detail.
 */
async function luminance(png: Buffer): Promise<number> {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(png)
    .resize(64, 40, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  let sum = 0
  const pixels = info.width * info.height
  for (let i = 0; i < pixels; i++) {
    const o = i * info.channels
    sum += 0.2126 * data[o]! + 0.7152 * data[o + 1]! + 0.0722 * data[o + 2]!
  }
  return sum / pixels
}

/** Every canvas that is actually on screen, and whether its context is dead. */
const deadVisibleCanvases = () =>
  Array.from(document.querySelectorAll('canvas'))
    .filter((canvas) => {
      const box = canvas.getBoundingClientRect()
      return box.width > 0 && box.height > 0
    })
    .filter((canvas) => {
      // `getContext` returns the existing context when there is one, so this
      // asks about the canvas r3f already built rather than making a new one.
      const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null
      return gl?.isContextLost() === true
    })
    .map((canvas) => {
      const box = canvas.getBoundingClientRect()
      return `${Math.round(box.width)}x${Math.round(box.height)}`
    })

test.describe('the WebGL canvas survives a round trip', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Reads a WebGL2 context directly; the defect is a context-lifetime one and does not vary by engine.'
  )

  test('/en is as dark after leaving and returning as it was fresh', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    // Past the entrance curtain, which is a full-screen panel of its own.
    await page.waitForTimeout(2500)

    const fresh = await luminance(await page.screenshot())
    expect(
      await page.evaluate(deadVisibleCanvases),
      'a fresh load already had a dead canvas, so this run proves nothing'
    ).toEqual([])

    await page.locator('a[href="/en/work"]').first().click({ force: true })
    await page.waitForURL('**/en/work')
    await page.waitForTimeout(2000)

    await page.locator('a[href="/en"]').first().click({ force: true })
    await page.waitForURL(/\/en$/)
    await page.waitForTimeout(2500)
    // The reader's own scroll is restored by the router; measure the same band.
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    const returned = await luminance(await page.screenshot())

    expect(
      await page.evaluate(deadVisibleCanvases),
      'a visible canvas is holding a lost GL context, which composites as flat grey'
    ).toEqual([])

    const drift = Math.abs(returned - fresh) / fresh
    expect(
      drift,
      `fresh ${fresh.toFixed(1)} vs returned ${returned.toFixed(1)}`
    ).toBeLessThan(TOLERANCE)
  })

  test('the wash still draws after returning', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    await page.locator('a[href="/en/work"]').first().click({ force: true })
    await page.waitForURL('**/en/work')
    await page.waitForTimeout(2000)
    await page.locator('a[href="/en"]').first().click({ force: true })
    await page.waitForURL(/\/en$/)
    await page.waitForTimeout(2500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    const lit = await luminance(await page.screenshot())

    // Take the wash away and the hero must get measurably darker. Without
    // this, "dark enough" would also pass for a canvas that drew nothing —
    // which is the failure the first test cannot tell apart on its own.
    await page.evaluate(() => {
      for (const root of Array.from(
        document.querySelectorAll('[class*="webgl-module"]')
      )) {
        ;(root as HTMLElement).style.display = 'none'
      }
    })
    await page.waitForTimeout(400)
    const unlit = await luminance(await page.screenshot())

    expect(
      lit,
      `with the wash ${lit.toFixed(3)}, without it ${unlit.toFixed(3)} — the canvas is adding no light, so it is not drawing`
    ).toBeGreaterThan(unlit)
  })
})
