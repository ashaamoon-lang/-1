import { describe, expect, it } from 'bun:test'

import { loneHalves, settledSpans } from './grid-flow'

/**
 * `settledSpans` — the editorial grid never strands a half. Tahap 86.
 *
 * The browser half of this is `e2e/grid-rows.e2e.ts`, which measures the
 * rendered page. These pin the rule itself, including the property the
 * component's note relies on: one pass is enough.
 */
describe('settledSpans', () => {
  it('closes the hole the home page shipped with', () => {
    // arus-balik 6 · pusat-beban 12 · bacaan-mesin 6 · takar 6 — the featured
    // works in `order`, which left 787px beside the first card at 1600×900.
    expect(settledSpans([6, 12, 6, 6])).toEqual([12, 12, 6, 6])
  })

  it('leaves a grid that already pairs its halves exactly as authored', () => {
    expect(settledSpans([12, 6, 6])).toEqual([12, 6, 6])
    expect(settledSpans([6, 6, 12, 6, 6])).toEqual([6, 6, 12, 6, 6])
  })

  it('promotes a trailing half and an odd third half, never the paired ones', () => {
    expect(settledSpans([6, 6, 6])).toEqual([6, 6, 12])
    expect(settledSpans([12, 6])).toEqual([12, 12])
  })

  it('reads a missing span as a half, as the schema does', () => {
    expect(settledSpans([null, null])).toEqual([6, 6])
    expect(settledSpans([null])).toEqual([12])
  })

  it('returns nothing for nothing', () => {
    expect(settledSpans([])).toEqual([])
  })

  /*
   * Every sequence up to six cards, not a handful of chosen ones: 126 of
   * them, plus the empty one. Six is the size of the catalogue the dataset carries, and the
   * property is about sequences an editor could produce, not the ones a test
   * author thought of.
   */
  it('leaves no half alone, and is a fixed point, for every sequence up to six', () => {
    const sequences: (6 | 12)[][] = [[]]
    for (let length = 1; length <= 6; length++) {
      for (let bits = 0; bits < 2 ** length; bits++) {
        sequences.push(
          Array.from({ length }, (_, i) => ((bits >> i) & 1 ? 12 : 6))
        )
      }
    }
    expect(sequences.length).toBe(127)

    for (const sequence of sequences) {
      const settled = settledSpans(sequence)
      expect(
        loneHalves(settled.map((span) => span === 12)).some(Boolean),
        `${sequence.join(',')} -> ${settled.join(',')} still strands a half`
      ).toBe(false)
      expect(
        settledSpans(settled),
        `${sequence.join(',')} is not a fixed point`
      ).toEqual(settled)
      // Only halves are ever changed, and only into fulls.
      for (const [index, span] of sequence.entries()) {
        if (span === 12) expect(settled[index]).toBe(12)
      }
    }
  })
})
