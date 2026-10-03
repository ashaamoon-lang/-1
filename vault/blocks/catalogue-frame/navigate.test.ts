import { describe, expect, it } from 'bun:test'

import { step } from './navigate'

/*
 * Three practices by four years. Row 0 holds two works in its first bay and
 * one in its last; row 1 is empty but for its second bay; row 2 holds one in
 * its first bay.
 */
const COUNTS = [
  [2, 0, 0, 1],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
]

describe('step', () => {
  it('moves along a row to the nearest bay that holds a work', () => {
    expect(step(COUNTS, { row: 0, column: 0, item: 1 }, 'right')).toEqual({
      row: 0,
      column: 3,
      item: 0,
    })
    expect(step(COUNTS, { row: 0, column: 3, item: 0 }, 'left')).toEqual({
      row: 0,
      column: 0,
      item: 0,
    })
  })

  it('moves through the works stacked in a bay before leaving it', () => {
    expect(step(COUNTS, { row: 0, column: 0, item: 0 }, 'down')).toEqual({
      row: 0,
      column: 0,
      item: 1,
    })
    expect(step(COUNTS, { row: 0, column: 0, item: 1 }, 'up')).toEqual({
      row: 0,
      column: 0,
      item: 0,
    })
  })

  it('moves down and up the same year, passing empty bays over', () => {
    expect(step(COUNTS, { row: 0, column: 0, item: 1 }, 'down')).toEqual({
      row: 2,
      column: 0,
      item: 0,
    })
    expect(step(COUNTS, { row: 2, column: 0, item: 0 }, 'up')).toEqual({
      row: 0,
      column: 0,
      item: 1,
    })
  })

  it('does nothing at the edge of the frame', () => {
    expect(step(COUNTS, { row: 0, column: 3, item: 0 }, 'right')).toBeNull()
    expect(step(COUNTS, { row: 1, column: 1, item: 0 }, 'up')).toBeNull()
    expect(step(COUNTS, { row: 1, column: 1, item: 0 }, 'left')).toBeNull()
  })
})
