import { describe, expect, it } from 'bun:test'

import { bearingTo, centre, nearestTurn } from './bearing'

describe('bearingTo', () => {
  const origin = { x: 0, y: 0 }

  it('reads 0 straight up and a quarter turn to the right', () => {
    expect(bearingTo(origin, { x: 0, y: -10 })).toBeCloseTo(0)
    expect(bearingTo(origin, { x: 10, y: 0 })).toBeCloseTo(Math.PI / 2)
    expect(bearingTo(origin, { x: 0, y: 10 })).toBeCloseTo(Math.PI)
    expect(bearingTo(origin, { x: -10, y: 0 })).toBeCloseTo(-Math.PI / 2)
  })
})

describe('centre', () => {
  it('finds the middle of a box', () => {
    expect(centre({ left: 10, top: 20, width: 40, height: 10 })).toEqual({
      x: 30,
      y: 25,
    })
  })
})

describe('nearestTurn', () => {
  it('keeps a direction close to the last one instead of spinning round', () => {
    // From just short of a half turn to just past it: a small step, not a lap.
    const previous = Math.PI - 0.1
    const next = -Math.PI + 0.1
    expect(nearestTurn(previous, next)).toBeCloseTo(Math.PI + 0.1)
  })

  it('leaves a nearby direction alone', () => {
    expect(nearestTurn(0.2, 0.5)).toBeCloseTo(0.5)
  })
})
