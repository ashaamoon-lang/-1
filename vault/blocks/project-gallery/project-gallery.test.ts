/**
 * Guards the gallery's width rule.
 *
 * ## What replaced what
 *
 * This used to assert a *positional* rule — every third image full width,
 * with a clause to stop a trailing half-width image being orphaned beside six
 * empty columns, which a reader sees as a picture that did not load.
 *
 * That rule chose a grid track the picture then ignored. The container capped
 * height at 78svh and let width follow the ratio, so what actually rendered
 * was the asset's proportions: measured on `/en/work/panas-sore` at 1440×900,
 * three images at 562px, 936px and 1123px inside tracks of 1398px and 691px.
 * Guarding the track was guarding the wrong number.
 *
 * The box fills its track now, so the track is what a reader sees — and the
 * span is derived from the shape of the picture rather than from where it
 * happens to sit. The orphan case is no longer a failure to guard against but
 * a composition: a lone portrait at half width is the same arrangement the
 * catalogue grid makes with an odd number of works, and it reads as one.
 */

import { describe, expect, it } from 'bun:test'

import { isFullWidth } from './index'

describe('gallery widths', () => {
  it('gives landscape and square the full track', () => {
    for (const ratio of [1, 1.333, 1.6, 3]) {
      expect(isFullWidth(ratio), `ratio ${ratio}`).toBe(true)
    }
  })

  it('gives portrait the half track it fits', () => {
    for (const ratio of [0.999, 0.8, 0.7]) {
      expect(isFullWidth(ratio), `ratio ${ratio}`).toBe(false)
    }
  })

  it('takes the full track when the asset has no dimensions', () => {
    // A malformed reference yields `null` from `aspectRatioFor`. With nothing
    // to reason about, full width is the safe default for artwork — half
    // would commit to a portrait layout for a picture that may be a landscape.
    expect(isFullWidth(null)).toBe(true)
  })

  it('depends on nothing but the ratio', () => {
    // The property the old positional rule did not have: the same picture
    // gets the same track wherever the studio moves it in the sequence, so
    // reordering the gallery reflows it and can never re-crop it.
    const ratios = [1.6, 0.8, 1.333]
    const forward = ratios.map(isFullWidth)
    const reversed = [...ratios].reverse().map(isFullWidth)
    expect(reversed).toEqual([...forward].reverse())
  })
})
