import { expect, test } from '@playwright/test'

/**
 * A depth plane never shows the edge of the frame that clips it — Tahap 81.
 *
 * ## Why this file exists, and why it is late
 *
 * `vault/motion/parallax` has moved media inside clipped frames since Tahap 33,
 * and nothing has ever measured whether the moving layer stays larger than the
 * hole it moves in. The failure is quiet: a sliver of the page background
 * appears at the top or bottom of a plate for part of its pass, which reads as
 * a rendering glitch rather than as a motion bug, and only at some scroll
 * positions.
 *
 * It has already happened once. `project-card.module.css` records Tahap 43 —
 * a layer sized against the hook's default distance while `work-constellation`
 * moved it further, reported by `e2e/continuous-motion.e2e.ts` as **two exposed
 * plates at three of four scroll positions**. That was found by a gate looking
 * for something else.
 *
 * ## And it very nearly happened again, which is the argument for a gate
 *
 * Tahap 81 gave the planes an overshoot formula carried over from that fix:
 * `100% + (travel + 2)%`, pulled up by half. Worked by hand against the plane
 * ladder, it fails at the top rung — `yPercent` is a share of the layer's
 * **own** height, so enlarging the layer also lengthens the travel it has to
 * absorb, and the two meet at travel 13.2 while `foreground` is 14.
 *
 * Nothing would have caught that. `continuous-motion` counts transforms, not
 * coverage; `first-screen` looks at the first screen only. The constant was
 * corrected to `+ 4` on arithmetic alone — and arithmetic nobody re-runs is a
 * claim, which is what this file converts into a measurement.
 *
 * ## What it measures
 *
 * For each clipping frame: the layer's top must sit at or above the frame's
 * top, and its bottom at or below the frame's bottom, at every sampled scroll
 * position. A positive gap is the page showing through.
 *
 * `EPSILON` is half a CSS pixel. Sub-pixel rounding puts the layer edge a
 * fraction inside the frame on fractional device pixel ratios without anything
 * being visible, and `project-card` documents that same rounding as the reason
 * its own overshoot carries headroom rather than matching the travel exactly.
 *
 * ## Desktop only, and that is a decision rather than an omission
 *
 * `playwright.config.ts` gives the mobile project an explicit allowlist where
 * every entry states the defect that only appears below 800px. This gate has
 * no such reason: the overshoot is expressed entirely in percentages, so the
 * ratio of travel to frame height is identical at every width. A phone makes
 * the margin smaller in absolute terms — roughly 3.3px against 5.4px on the
 * journal cover — but both sit far above `EPSILON`, and a proportional failure
 * would show at both widths or neither.
 *
 * Adding it to the mobile list anyway would buy a second run of the same
 * arithmetic, which is the kind of number that looks like coverage and is not.
 */

const SAMPLES = 12

/** Half a CSS pixel — rounding, not exposure. */
const EPSILON = 0.5

/**
 * Routes rendering a plane inside a clipped frame.
 *
 * `/en/journal` is the one Tahap 81 shipped. The catalogue's plates use the
 * same shape through `--card-drift` rather than `--plane-travel`, so they are
 * covered here too: the invariant is about the geometry, not which custom
 * property produced it.
 */
const ROUTES = ['/en/journal', '/en/work'] as const

test.describe('a depth plane covers the frame that clips it', () => {
  for (const path of ROUTES) {
    test(`${path} never shows a frame edge`, async ({ page }) => {
      await page.goto(path)
      await page.waitForTimeout(1200)

      const height = await page.evaluate(
        () => document.documentElement.scrollHeight
      )
      const viewport = page.viewportSize()?.height ?? 900
      const exposures: string[] = []
      let measured = 0

      for (let i = 0; i <= SAMPLES; i += 1) {
        const y = ((height - viewport) * i) / SAMPLES
        await page.evaluate((to) => window.scrollTo(0, to), y)
        await page.waitForTimeout(350)

        const gaps = await page.evaluate(() => {
          /*
           * A clipping frame is found by the property that makes it one, not
           * by class name: `overflow: clip|hidden` with exactly one element
           * child that is absolutely positioned. That is the shape both
           * `.coverPlane` and `.parallax` produce, and it cannot go stale when
           * a module hash changes.
           */
          const frames = [...document.querySelectorAll('div')].filter((el) => {
            const style = getComputedStyle(el)
            if (style.overflow !== 'clip' && style.overflow !== 'hidden') {
              return false
            }
            const child = el.firstElementChild
            if (!child || el.childElementCount !== 1) return false
            return getComputedStyle(child).position === 'absolute'
          })

          return frames.map((frame) => {
            const outer = frame.getBoundingClientRect()
            // Non-null: the filter above rejected frames without one.
            const inner = (
              frame.firstElementChild as HTMLElement
            ).getBoundingClientRect()
            return {
              label: frame.className.slice(0, 48),
              top: inner.top - outer.top,
              bottom: outer.bottom - inner.bottom,
            }
          })
        })

        measured += gaps.length
        for (const gap of gaps) {
          if (gap.top > EPSILON) {
            exposures.push(
              `y=${Math.round(y)} ${gap.label} top +${gap.top.toFixed(2)}px`
            )
          }
          if (gap.bottom > EPSILON) {
            exposures.push(
              `y=${Math.round(y)} ${gap.label} bottom +${gap.bottom.toFixed(2)}px`
            )
          }
        }
      }

      /*
       * Anti-vacuum. A selector that stopped matching would report perfect
       * coverage of nothing at all — the failure shape `design-scoreboard` and
       * `stage-position` both carry their own guard against.
       */
      expect(
        measured,
        `${path} exposed no clipped parallax frame to measure`
      ).toBeGreaterThan(0)

      expect(exposures, `${path} showed frame edges`).toEqual([])
    })
  }
})
