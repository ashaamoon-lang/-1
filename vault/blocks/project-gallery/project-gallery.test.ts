/**
 * Guards the gallery's width rhythm.
 *
 * The failure it exists for is not a crash: a trailing half-width image with
 * nothing beside it renders as six empty columns, which a reader sees as a
 * picture that did not load. It is a layout bug that only appears at certain
 * image counts, which is exactly the kind that ships.
 */

import { describe, expect, it } from 'bun:test'

import { isFullWidth } from './index'

const layout = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    isFullWidth(index, count) ? 'full' : 'half'
  )

describe('gallery widths', () => {
  it('makes every third image full width', () => {
    expect(layout(6)).toEqual(['full', 'half', 'half', 'full', 'half', 'half'])
  })

  it('never leaves a lone half-width image at the end', () => {
    // The counts where a naive `index % 3 === 0` orphans the last image.
    for (const count of [2, 5, 8, 11]) {
      expect(layout(count).at(-1), `${count} images orphans the last`).toBe(
        'full'
      )
    }
  })

  it('leaves properly paired halves alone', () => {
    for (const count of [3, 6, 9]) {
      expect(layout(count).at(-1), `${count} images should end paired`).toBe(
        'half'
      )
    }
  })

  it('renders a single image full width', () => {
    expect(layout(1)).toEqual(['full'])
  })
})
