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

import { isFullWidth, loneHalves } from './index'

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

/**
 * The row, which the track rule left alone.
 *
 * `isFullWidth` made the box agree with its track. It did not make the *row*
 * agree with itself: on the shipped fixture the spans run `half, full, half`,
 * so neither half ever meets another and each opens a row it cannot fill.
 * Measured at 1440×900, that is 572px of empty ground beside two separate
 * pictures.
 *
 * Every case below is a sequence the six seeded projects or a real gallery can
 * actually produce, and the three-halves case is the one a neighbour test
 * would get wrong.
 */
describe('a half alone in its row', () => {
  const F = true
  const H = false

  it('finds nothing to fix when every plate is full width', () => {
    expect(loneHalves([F, F, F])).toEqual([false, false, false])
  })

  it('leaves a pair alone, because a pair already fills its row', () => {
    expect(loneHalves([H, H])).toEqual([false, false])
  })

  it('catches the shipped fixture, where the full keeps the halves apart', () => {
    // `half, full, half` — the sequence measured on /en/work/arus-balik.
    expect(loneHalves([H, F, H])).toEqual([true, false, true])
  })

  it('catches the third of three halves, which a neighbour rule would miss', () => {
    // The first two fill a row; the third opens its own and stands alone.
    // "the next item is also a half" would call index 1 paired and index 2
    // paired-with-1, and ship the hole.
    expect(loneHalves([H, H, H])).toEqual([false, false, true])
  })

  it('reads four halves as two full rows', () => {
    expect(loneHalves([H, H, H, H])).toEqual([false, false, false, false])
  })

  it('catches a single half, whichever end of the gallery it sits at', () => {
    expect(loneHalves([H])).toEqual([true])
    expect(loneHalves([F, H])).toEqual([false, true])
    expect(loneHalves([H, F])).toEqual([true, false])
  })

  it('has an answer for an empty gallery', () => {
    expect(loneHalves([])).toEqual([])
  })
})
