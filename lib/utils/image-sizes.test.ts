import { describe, expect, it } from 'bun:test'

import { cappedImageSizes } from './image-sizes'

describe('cappedImageSizes', () => {
  it('states the smaller of the track and the height cap', () => {
    // A portrait (0.8) capped at 78vh renders 62.4vh wide — far narrower than
    // its 92vw track, and the whole reason this function exists.
    expect(cappedImageSizes({ ratio: 0.8, trackVw: 92 })).toBe(
      '(max-width: 800px) 100vw, min(92vw, 62.4vh)'
    )
  })

  it('still emits both terms for a landscape, and lets the browser pick', () => {
    expect(cappedImageSizes({ ratio: 1.6, trackVw: 92 })).toBe(
      '(max-width: 800px) 100vw, min(92vw, 124.8vh)'
    )
  })

  it('falls back to the track width when the ratio is unknown', () => {
    // Slightly wide is a few wasted bytes; too narrow is a blurry image.
    expect(cappedImageSizes({ ratio: null, trackVw: 48 })).toBe(
      '(max-width: 800px) 100vw, 48vw'
    )
  })

  it('is single-column below the desktop breakpoint', () => {
    for (const ratio of [0.5, 1, 2, null]) {
      expect(cappedImageSizes({ ratio, trackVw: 48 })).toContain(
        '(max-width: 800px) 100vw'
      )
    }
  })
})
