import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { RUN_WORK } from './fixtures'

/**
 * The gallery run on its own route: a strip, and reachable without a script.
 *
 * `gallery-run.e2e.ts` proves the run *travels*, against a Storybook story,
 * because when it was written no route could reach the branch. Tahap 82 gave
 * the dataset `RUN_WORK` for exactly that, and until this file no gate
 * visited it — so what the run looked like where a reader meets it, and
 * whether a reader without JavaScript could meet it at all, were not checked
 * anywhere.
 *
 * ## What was measured before the fork, on `/en/work/pusat-beban`
 *
 * At 1440×900, pinned: four plates at one width (490px) and four heights —
 * 653, 500, 275, 392 — so the bottoms ended at 765, 612, 388 and 504 and the
 * lower third of the screen held nothing. At 390×844 each plate hung from the
 * tallest one's top, so a 16:9 plate sat in the upper third over an empty
 * screen.
 *
 * With JavaScript off, the box stayed one screen tall and `overflow: clip`
 * around a track wider than it: plates 3 and 4 at desktop, 2 to 4 on a phone,
 * sat outside the box where nothing would ever bring them in. Reduced motion
 * already unwrapped the track; no script did not.
 *
 * ## Layout geometry, not painted geometry
 *
 * Every plate carries `[data-reveal-item]`, and one the track has not reached
 * yet is still held at its entrance lift — `translateY(16px)`, measured. A
 * painted rect would read that as a plate 16px lower than its neighbours. The
 * claims here are about the layout, so heights and lines are read from the
 * box model (`offsetTop`, `offsetHeight`), which a transform does not move.
 */

/** Sub-pixel rounding between plates whose widths follow different ratios. */
const LINE_TOLERANCE = 1

/**
 * How much of the screen may sit empty under the strip while it is pinned.
 * Measured before the fork at 1440×900: the shortest plate on screen left
 * 58% under it.
 */
const MAX_EMPTY_BELOW = 0.15

const ROUTE = `/en/work/${RUN_WORK}`

/** Scrolls to where the run is pinned and lets the scrub settle. */
async function pinRun(page: Page) {
  await page.goto(ROUTE, { waitUntil: 'networkidle' })
  const top = await page.evaluate(() => {
    const run = document.querySelector('[data-epic="project-run"]')
    return run ? run.getBoundingClientRect().top + window.scrollY : null
  })
  expect(
    top,
    `${ROUTE} rendered no run — RUN_WORK must take the track`
  ).not.toBeNull()
  await page.evaluate((y) => window.scrollTo(0, y), (top ?? 0) + 40)
  await page.waitForTimeout(1500)
}

/**
 * Every run plate, and the four ways it can be in the page without being
 * seen: not laid out at all, cut off by an ancestor that clips its overflow,
 * not painted, or painted over.
 *
 * "Not laid out" came from review: inside a `display: none` subtree — a
 * Suspense boundary streamed into `<div hidden>`, the regression
 * `no-javascript.e2e.ts` was written for — a plate has a 0×0 box, nothing
 * clips it, its own opacity is still 1 and its tiles have no boxes, so the
 * other three checks all passed it. For the same reason opacity is read
 * through every ancestor, not from the plate alone.
 *
 * The frame is found, not named: the check is that nothing between the plate
 * and the document hides part of it.
 *
 * "Painted over" is the one a visibility check cannot see. The mosaic veil
 * (`vault/magic/pixel-image`) is a grid of ground-coloured tiles over the
 * picture, dissolved when `useReveal` marks the plate `visible` — and with
 * scripting off nothing ever does. Measured on this route before the fork:
 * every plate at opacity 1, every picture under 24 opaque tiles. So anything
 * inside the plate's box, other than the picture, that renders with an opaque
 * background at a visible opacity is counted as covering it. The box itself
 * is excluded — it is the ground *behind* the picture.
 */
async function unseenPlates(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-run-item]')].map((item, index) => {
      const rect = item.getBoundingClientRect()
      let clipped = false
      for (
        let node = item.parentElement;
        node && node !== document.body;
        node = node.parentElement
      ) {
        const style = getComputedStyle(node)
        if (style.overflowX === 'visible' && style.overflowY === 'visible')
          continue
        const box = node.getBoundingClientRect()
        if (
          rect.left < box.left - 1 ||
          rect.right > box.right + 1 ||
          rect.top < box.top - 1 ||
          rect.bottom > box.bottom + 1
        )
          clipped = true
      }
      const unrendered = rect.width < 1 || rect.height < 1
      let opacity = 1
      for (let at: Element | null = item; at; at = at.parentElement)
        opacity *= Number(getComputedStyle(at).opacity)
      const hidden =
        opacity < 0.01 || getComputedStyle(item).visibility === 'hidden'

      const box = item.querySelector('button > div')
      const opacityWithin = (node: Element) => {
        let value = 1
        for (
          let at: Element | null = node;
          at && at !== box;
          at = at.parentElement
        )
          value *= Number(getComputedStyle(at).opacity)
        return value
      }
      const covering = [...(box?.querySelectorAll('*') ?? [])].filter(
        (node) => {
          if (node.tagName === 'IMG' || node.querySelector('img')) return false
          if (node.getClientRects().length === 0) return false
          const paint = getComputedStyle(node).backgroundColor
          let alpha = 1
          if (paint === 'transparent') alpha = 0
          else if (paint.startsWith('rgba'))
            alpha = Number(paint.slice(paint.lastIndexOf(',') + 1, -1))
          return alpha > 0.01 && opacityWithin(node) > 0.01
        }
      ).length

      return { plate: index + 1, unrendered, clipped, hidden, covering }
    })
  )
}

/**
 * The unwrapped run's rows: how wide the track is against its frame, and each
 * row's plate heights and filled width.
 *
 * Review found the reduced-motion case green against the layout this fork
 * replaced — a 208px column in a 1430px box has no plate clipped, hidden or
 * covered. What was wrong with it was its geometry, so the geometry is what
 * is asserted. Rows are grouped by `offsetTop`; `align-items: start` puts a
 * row's items on one.
 */
async function unwrappedRows(page: Page) {
  return page.evaluate(() => {
    const track = document.querySelector<HTMLElement>('[data-run-track]')
    const frame = track?.parentElement
    if (!track || !frame) return null
    const style = getComputedStyle(track)
    const gap = Number.parseFloat(style.columnGap) || 0
    const line =
      track.clientWidth -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight)
    const rows = new Map<number, { width: number; height: number }[]>()
    for (const element of track.querySelectorAll('[data-run-item]')) {
      const item = element as HTMLElement
      const media = item.querySelector('button > div') as HTMLElement
      const row = rows.get(item.offsetTop) ?? []
      row.push({
        width: media.getBoundingClientRect().width,
        height: media.offsetHeight,
      })
      rows.set(item.offsetTop, row)
    }
    return {
      frame: frame.clientWidth,
      track: track.getBoundingClientRect().width,
      line,
      rows: [...rows.values()].map((row) => ({
        heights: row.map((plate) => plate.height),
        filled:
          row.reduce((sum, plate) => sum + plate.width, 0) +
          gap * (row.length - 1),
      })),
    }
  })
}

test.describe('the gallery run on its route', () => {
  test('pinned on desktop, the plates are one strip: one height, one bottom, one caption line', async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'a phone keeps one width per plate; its line is the next test'
    )
    await pinRun(page)

    const strip = await page.evaluate(() => {
      const run = document.querySelector('[data-epic="project-run"]')
      const frame = run?.querySelector('[data-run-item]')?.parentElement
        ?.parentElement as HTMLElement | null | undefined
      const plates = [...(run?.querySelectorAll('[data-run-item]') ?? [])].map(
        (element) => {
          const item = element as HTMLElement
          const media = item.querySelector('button > div') as HTMLElement
          const caption = item.querySelector('figcaption') as HTMLElement
          // Offsets within the item, then the item's own layout position:
          // none of it moved by the reveal lift or the track's travel.
          const itemRect = item.getBoundingClientRect()
          const mediaRect = media.getBoundingClientRect()
          const captionRect = caption.getBoundingClientRect()
          return {
            width: mediaRect.width,
            height: media.offsetHeight,
            bottom: item.offsetTop + (mediaRect.bottom - itemRect.top),
            captionTop: item.offsetTop + (captionRect.top - itemRect.top),
            revealed: item.getAttribute('data-reveal-item') === 'visible',
            onScreen: itemRect.right > 0 && itemRect.left < window.innerWidth,
            paintedCaptionBottom: captionRect.bottom,
          }
        }
      )
      return { frame: frame?.clientWidth ?? 0, plates }
    })

    // Anti-vacuum: the fixture owes this route four plates.
    expect(strip.plates.length).toBeGreaterThanOrEqual(4)

    const spread = (values: number[]) =>
      Math.max(...values) - Math.min(...values)
    const heights = strip.plates.map((plate) => plate.height)

    expect(
      spread(heights),
      `plate heights ${heights.join(', ')} — a strip holds one`
    ).toBeLessThanOrEqual(LINE_TOLERANCE)
    expect(
      spread(strip.plates.map((plate) => plate.bottom)),
      `plate bottoms ${strip.plates.map((plate) => Math.round(plate.bottom)).join(', ')}`
    ).toBeLessThanOrEqual(LINE_TOLERANCE)
    expect(
      spread(strip.plates.map((plate) => plate.captionTop)),
      'the `01 / 04` captions do not share a line'
    ).toBeLessThanOrEqual(LINE_TOLERANCE)

    // Each plate can be seen whole at some point in the pass.
    const widest = Math.max(...strip.plates.map((plate) => plate.width))
    expect(
      widest,
      `the widest plate is ${Math.round(widest)}px in a ${strip.frame}px frame — never seen whole`
    ).toBeLessThanOrEqual(strip.frame)

    // And the strip uses the screen it holds. Read from plates that have
    // arrived, whose painted position is their resting one.
    const settled = strip.plates.filter(
      (plate) => plate.revealed && plate.onScreen
    )
    expect(settled.length, 'no plate has arrived on screen').toBeGreaterThan(0)
    const lowest = Math.max(
      ...settled.map((plate) => plate.paintedCaptionBottom)
    )
    const viewport = page.viewportSize()?.height ?? 0
    const empty = (viewport - lowest) / viewport
    expect(
      empty,
      `${Math.round(empty * 100)}% of the screen is empty under the strip`
    ).toBeLessThan(MAX_EMPTY_BELOW)
  })

  test('pinned on a phone, the plates share one centre line', async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== 'mobile',
      'on desktop the plates share a height, so every line is shared'
    )
    await pinRun(page)

    /*
     * The figure's centre, not the item's. Under `align-items: stretch` every
     * item is as tall as the tallest, so item centres always agree — this
     * test passed against the layout it was written to reject until it read
     * the plate inside the item.
     */
    const centres = await page.evaluate(() =>
      [...document.querySelectorAll('[data-run-item]')].map((element) => {
        const item = element as HTMLElement
        const figure = item.querySelector('figure') as HTMLElement
        const itemRect = item.getBoundingClientRect()
        const figureRect = figure.getBoundingClientRect()
        return (
          item.offsetTop +
          (figureRect.top - itemRect.top) +
          figure.offsetHeight / 2
        )
      })
    )

    expect(centres.length).toBeGreaterThanOrEqual(4)
    expect(
      Math.max(...centres) - Math.min(...centres),
      `plate centres ${centres.map(Math.round).join(', ')} — a plate hangs from the tallest one's top`
    ).toBeLessThanOrEqual(LINE_TOLERANCE)
  })

  for (const [name, options] of [
    ['with scripting off', { javaScriptEnabled: false }],
    ['under reduced motion', { reducedMotion: 'reduce' as const }],
  ] as const) {
    test(`${name}, every plate is in the page, none is cut off, and the rows fill the width`, async ({
      browser,
    }) => {
      // Inherits the project's device, so both viewports are checked.
      const context = await browser.newContext(options)
      const page = await context.newPage()
      try {
        await page.goto(ROUTE, { waitUntil: 'load' })
        const plates = await unseenPlates(page)

        expect(plates.length, 'the run lost its plates').toBeGreaterThanOrEqual(
          4
        )
        expect(
          plates
            .filter((plate) => plate.unrendered)
            .map((plate) => plate.plate),
          'plate(s) in the document with no box at all'
        ).toEqual([])
        expect(
          plates.filter((plate) => plate.clipped).map((plate) => plate.plate),
          'plate(s) outside a clipping box, where no scroll can reach them'
        ).toEqual([])
        expect(
          plates.filter((plate) => plate.hidden).map((plate) => plate.plate),
          'plate(s) in the page but invisible'
        ).toEqual([])
        expect(
          plates
            .filter((plate) => plate.covering > 0)
            .map((plate) => `${plate.plate}: ${plate.covering} layer(s)`),
          'plate(s) whose picture is painted over'
        ).toEqual([])

        const geometry = await unwrappedRows(page)
        expect(geometry, 'the run has no track').not.toBeNull()
        if (!geometry) return
        expect(
          geometry.track,
          `the unwrapped run is ${Math.round(geometry.track)}px inside a ${geometry.frame}px frame — a column, not rows`
        ).toBeGreaterThanOrEqual(geometry.frame - 1)
        for (const row of geometry.rows) {
          expect(
            Math.max(...row.heights) - Math.min(...row.heights),
            `a row's plates are ${row.heights.join(', ')}px tall — a row holds one height`
          ).toBeLessThanOrEqual(LINE_TOLERANCE)
        }
        // At least one row fills its line. A plate left alone on the last line
        // may stop short of it — `--row-cap` holds it under a screen's height.
        expect(
          Math.max(...geometry.rows.map((row) => row.filled)),
          `no row fills its ${Math.round(geometry.line)}px line`
        ).toBeGreaterThanOrEqual(geometry.line - 2)
      } finally {
        await context.close()
      }
    })
  }
})
