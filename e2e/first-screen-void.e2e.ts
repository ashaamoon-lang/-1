import { expect, test } from '@playwright/test'

import {
  type Band,
  INTERIOR_MAX_PCT,
  WIDTH_MIN_PCT,
  voidFaults,
  voidProfile,
  widthFaults,
  widthProfile,
} from './first-screen-void'

/**
 * A first screen does not open with a hole through its middle.
 *
 * ## The defect
 *
 * `vault/blocks/hero` pins its practice index to grid row 1 and bottom-anchors
 * everything else in rows 2–4, so the frame's `minmax(0, 1fr)` slack — which
 * `.index`'s own comment records as *"absorbing 304px at 1440×900"* — sits
 * between them. Measured on the production build:
 *
 * ```
 * 1440×900   .index y 100–182, h1 y 465–655   ->  516px empty, 57%
 *  390×844                                    ->  554px empty, 66%
 * ```
 *
 * Every other route on the site runs at 4–16%. The index's own CSS says it
 * belongs *"beside"* the headline; it was shipped into the right columns and
 * the wrong row. `docs/stages/TAHAP-74.md`.
 *
 * ## What the existing gates measure instead
 *
 * `held-screen` measures the **tail** of a box that holds the screen;
 * `first-screen` measures **where** the first item starts (85% ceiling — an
 * index at y=100 passes easily); `visual-substance` measures the left edge.
 * None of them asks how much nothing sits *between* two pieces of content, so
 * the hole was invisible to all of them at once.
 *
 * ## Content, not ground
 *
 * Only boxes that own text or are a picture count. The first version of this
 * measure counted anything that paints and scored a visibly empty `/studio`
 * first screen at 100%, because the grain layer covers the viewport. That
 * number was checked against its own screenshot before it justified anything
 * — the rule Tahap 70 and 71 paid for — and discarded.
 */

const ROUTES = [
  '/en',
  '/id',
  '/en/work',
  '/en/studio',
  '/en/journal',
  '/en/practice/consulting',
  '/en/work/arus-balik',
  '/en/journal/scope-is-the-deliverable',
] as const

/**
 * Collect the content boxes intersecting the first screen.
 *
 * Declared at module scope rather than inline so the same function serialises
 * into every route's evaluate call — one definition to keep honest.
 */
function collectContentBands() {
  const height = window.innerHeight
  const bands: Band[] = []
  const columns: Band[] = []
  for (const element of document.querySelectorAll('main *')) {
    // Decorative layers announce themselves; they are ground, not content.
    if (element.closest('[aria-hidden="true"]')) continue
    const style = getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    // Mid-reveal content is a frame of an animation, not a composition.
    if (Number(style.opacity) < 0.05) continue

    const isPicture =
      element.tagName === 'IMG' ||
      element.tagName === 'CANVAS' ||
      element.tagName === 'VIDEO'
    const ownsText = [...element.childNodes].some(
      (node) => node.nodeType === 3 && (node.textContent ?? '').trim() !== ''
    )
    if (!isPicture && !ownsText) continue

    const rect = element.getBoundingClientRect()
    if (rect.bottom <= 0 || rect.top >= height) continue
    if (rect.width < 8 || rect.height < 6) continue
    bands.push({
      top: Math.max(0, rect.top),
      bottom: Math.min(height, rect.bottom),
    })
    // The same box projected onto the other axis. `Band` is named for spans,
    // not for rows — reusing it keeps one merge implementation instead of two
    // that can drift apart.
    columns.push({
      top: Math.max(0, rect.left),
      bottom: Math.min(window.innerWidth, rect.right),
    })
  }
  return { rows: bands, columns }
}

test.describe('a first screen is a composition, not two corners', () => {
  for (const route of ROUTES) {
    test(`${route} opens without a hole through its middle`, async ({
      page,
    }, testInfo) => {
      await page.goto(route, { waitUntil: 'networkidle' })
      // Reveals are staggered; measuring mid-entrance measures the animation.
      await page.waitForTimeout(2200)

      const viewport = page.viewportSize()
      const height = viewport?.height ?? 900
      const label = `${viewport?.width ?? 0}×${height}`

      const collected = await page.evaluate(collectContentBands)
      const boxes = collected.rows
      const columns = collected.columns
      const width = viewport?.width ?? 1440

      /*
       * Anti-vacuum, and it is the assertion that would have caught this
       * gate's own first draft: a selector matching nothing yields a clean
       * profile for a blank page.
       */
      expect(
        boxes.length,
        `no content boxes found on ${route} at ${label} — the selector is wrong, or the page is empty`
      ).toBeGreaterThan(1)

      const profile = voidProfile(boxes, height)
      const across = widthProfile(columns, width)
      await testInfo.attach('first-screen-void', {
        body: `${route} ${label}: leading ${profile.leading}px, interior ${profile.interior}px (${profile.interiorPct}%), trailing ${profile.trailing}px${profile.at ? ` at ${profile.at}` : ''} | width used ${across.usedPct}%, widest bare ${across.widestGap}px ${across.at}`,
        contentType: 'text/plain',
      })

      const screen = { route, viewport: label, height, boxes, width, columns }

      expect(
        voidFaults([screen]),
        `interior void on ${route} at ${label} (ceiling ${INTERIOR_MAX_PCT}%)`
      ).toEqual([])

      /*
       * The other axis — Tahap 75. `/practice/<v>` gave its subject 600px of a
       * 1440px screen and left 824px bare beside it, while five routes used
       * 95–97%. Nothing measured that, on any route, at either viewport.
       */
      expect(
        widthFaults([screen]),
        `unused width on ${route} at ${label} (floor ${WIDTH_MIN_PCT}%)`
      ).toEqual([])
    })
  }
})
