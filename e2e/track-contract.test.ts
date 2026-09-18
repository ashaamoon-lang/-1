import { describe, expect, it } from 'bun:test'

import { type Plate, trackFaults } from './track-contract'

/**
 * The run cases here describe a page **no route renders yet**, and that is the
 * point.
 *
 * Every seeded project carries two gallery images against a `RUN_MINIMUM` of
 * four, so the horizontal run's branch cannot be reached from the site. Left
 * inside `media-edge.e2e.ts` the new logic would therefore never execute — and
 * this project has now paid three times for a gate whose case never runs
 * (Tahap 68, 69, 70).
 *
 * Synthetic plates cost nothing and exercise both layouts today.
 */

const plate = (ratio: number, width: number, inRun = false): Plate => ({
  ratio,
  width,
  inRun,
})

/** Sub-pixel slack, the same value `media-edge.e2e.ts` uses. */
const TOLERANCE = 1.5

describe('the grid contract', () => {
  it('accepts one full track and one half', () => {
    expect(
      trackFaults(
        [plate(1.33, 1161), plate(1, 1161), plate(0.8, 572)],
        TOLERANCE
      )
    ).toEqual([])
  })

  it('catches a portrait as wide as a landscape — the Tahap 11b defect', () => {
    const faults = trackFaults([plate(1.33, 1161), plate(0.8, 1161)], TOLERANCE)
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('not narrower')
  })

  it('catches two landscapes on different tracks', () => {
    const faults = trackFaults([plate(1.33, 1161), plate(1, 936)], TOLERANCE)
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('landscape and square')
  })

  it('forgives sub-pixel difference, which is all the tolerance is for', () => {
    expect(
      trackFaults([plate(1.33, 1161), plate(1, 1161.9)], TOLERANCE)
    ).toEqual([])
  })

  it('says nothing about a page with one image', () => {
    expect(trackFaults([plate(0.8, 572)], TOLERANCE)).toEqual([])
  })
})

describe('the run contract', () => {
  it('accepts plates of every shape on one shared track', () => {
    /*
     * The case that breaks the grid rule and is correct here: a portrait and a
     * landscape at the *same* width. Under the old, single-contract gate this
     * page was red.
     */
    expect(
      trackFaults(
        [
          plate(1.78, 490, true),
          plate(0.75, 490, true),
          plate(1, 490, true),
          plate(1.33, 490, true),
        ],
        TOLERANCE
      )
    ).toEqual([])
  })

  it('catches a run whose plates are not one width', () => {
    const faults = trackFaults(
      [plate(1.78, 490, true), plate(0.75, 380, true)],
      TOLERANCE
    )
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('one track')
  })

  it('does not let a run plate answer for the grid, or the reverse', () => {
    /*
     * A project page with a run still has its hero cover, which is **not** in
     * the run and keeps its own ratio-derived width. Judged together, the two
     * portraits look like a grid that lost its edge; judged apart, both are
     * correct. This is exactly the false red Tahap 70 measured.
     */
    expect(
      trackFaults(
        [
          plate(0.8, 572), // hero cover, grid rule
          plate(0.75, 490, true), // run plates, run rule
          plate(1.78, 490, true),
          plate(1, 490, true),
          plate(1.33, 490, true),
        ],
        TOLERANCE
      )
    ).toEqual([])
  })

  it('still catches a broken grid on a page that also has a run', () => {
    // Anti-vacuum: adding a run must not switch the grid's rule off.
    const faults = trackFaults(
      [
        plate(1.33, 1161),
        plate(0.8, 1161), // portrait as wide as the landscape
        plate(0.75, 490, true),
        plate(1.78, 490, true),
      ],
      TOLERANCE
    )
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('not narrower')
  })

  it('reports both layouts when both are broken', () => {
    const faults = trackFaults(
      [
        plate(1.33, 1161),
        plate(1, 900), // grid: two landscape widths
        plate(0.75, 490, true),
        plate(1.78, 380, true), // run: two widths
      ],
      TOLERANCE
    )
    expect(faults.length).toBe(2)
  })
})
