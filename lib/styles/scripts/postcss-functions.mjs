// THIS FILE HAS TO STAY .mjs AS ITS CONSUMED BY POSTCSS
import { screens } from '../layout.mjs'

function validatePixels(pixels, device) {
  const numPixels = Number.parseFloat(pixels)

  if (Number.isNaN(numPixels)) {
    throw new Error(`Invalid pixel value: ${pixels}`)
  }
  if (screens[device].width === 0 || screens[device].height === 0) {
    throw new Error(`Screen ${device} dimensions cannot be zero`)
  }
  return numPixels
}

/*
 * How far a component value may drift from the number its author wrote.
 *
 * Both bounds are derived, not chosen:
 *
 *   FLOOR   0.853 = 320 / 375   — never smaller than the value at the
 *                                 narrowest width this site supports.
 *   CEILING 1.333 = 1920 / 1440 — stop growing at the same width the token
 *                                 curve stops at (`./utils.ts`).
 *
 * ## Why a band and not one continuous curve
 *
 * The token and type scales get a single clamped line through both design
 * anchors, because the generator knows both numbers for each value. These two
 * functions do not: they are called in separate media blocks with numbers the
 * author picked independently — `mobile-vw(20px)` in one, `desktop-vw(12px)`
 * in the other — 377 times. Merging them into one curve means rewriting 377
 * call sites, and guessing which pairs were meant to be the same value.
 *
 * Bounding them needs no call site touched and removes the extreme class.
 * Measured worst case before: a value near the breakpoint fell about 3x.
 * After: about 1.2x for a pair with similar design numbers.
 *
 * **What it does not fix, said plainly:** when an author deliberately picks a
 * much smaller desktop number than mobile one, the step at 800px is their
 * intent, only abrupt. A band can bound the ends; it cannot infer intent.
 */
const BAND_FLOOR = 320 / 375
const BAND_CEILING = 1920 / 1440

/*
 * Five decimals on the slope, three on the bounds.
 *
 * Three everywhere put `desktop-vw(32)` at 31.9968px at its own 1440 anchor:
 * 32 * 100 / 1440 is 2.2222…, and 2.222vw is not the same number. The whole
 * claim of this change is that the design anchors do not move, so the slope
 * keeps the precision that claim needs.
 */
function round(value, places = 3) {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/** `clamp(floor, N-at-this-design-width, ceiling)`, exact at the anchor. */
function banded(numPixels, designWidth) {
  const vw = (numPixels * 100) / designWidth
  const floor = round(numPixels * BAND_FLOOR)
  const ceiling = round(numPixels * BAND_CEILING)
  if (numPixels === 0) return '0px'
  const lower = Math.min(floor, ceiling)
  const upper = Math.max(floor, ceiling)
  return `clamp(${lower}px, ${round(vw, 5)}vw, ${upper}px)`
}

export const functions = {
  'mobile-vw': (pixels) => {
    const numPixels = validatePixels(pixels, 'mobile')
    return banded(numPixels, screens.mobile.width)
  },
  // `clamp(MIN, VAL, MAX)` is `max(MIN, min(VAL, MAX))`. On modern mobile
  // browsers `vh >= dvh >= svh`, so `clamp(Nvh, Nsvh, Ndvh)` always collapsed
  // to `min(vh, dvh)` then `max(that, svh)` — i.e. plain `vh`, the
  // address-bar-hidden value `h-dvh` exists to avoid. Emitting `dvh` directly
  // is that same collapse (clamp(svh, vh, dvh) also always resolves to dvh
  // under that invariant), just without the misleading clamp().
  'mobile-vh': (pixels) => {
    const numPixels = validatePixels(pixels, 'mobile')
    return `${(numPixels * 100) / screens.mobile.height}dvh`
  },
  'desktop-vw': (pixels) => {
    const numPixels = validatePixels(pixels, 'desktop')
    return banded(numPixels, screens.desktop.width)
  },
  'desktop-vh': (pixels) => {
    const numPixels = validatePixels(pixels, 'desktop')
    return `${(numPixels * 100) / screens.desktop.height}svh`
  },
  columns: (columns) => {
    const numColumns = Number.parseFloat(columns)
    if (Number.isNaN(numColumns)) {
      throw new Error(`Invalid column value: ${columns}`)
    }
    return `calc((${numColumns} * var(--column-width)) + ((${numColumns} - 1) * var(--gap)))`
  },
}
