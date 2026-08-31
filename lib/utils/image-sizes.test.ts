import { describe, expect, it } from 'bun:test'

import { boundedRatio, trackImageSizes } from './image-sizes'

describe('trackImageSizes', () => {
  it('states the grid track, because that is what the box now fills', () => {
    expect(trackImageSizes(92)).toBe('(max-width: 800px) 100vw, 92vw')
    expect(trackImageSizes(48)).toBe('(max-width: 800px) 100vw, 48vw')
  })

  it('always claims the full viewport below the desktop breakpoint', () => {
    // Every artwork block is single-column on mobile, so a narrower claim
    // would fetch an asset too small for the box it lands in.
    for (const track of [92, 48]) {
      expect(trackImageSizes(track)).toContain('(max-width: 800px) 100vw')
    }
  })
})

describe('boundedRatio', () => {
  it('leaves ordinary artwork exactly as the asset describes it', () => {
    // The three shapes in the seeded catalogue. None is near the bound, which
    // is the point: this is a guard against a future upload, not a crop
    // applied to the studio's current work.
    for (const ratio of [0.8, 1.333, 1.6]) {
      expect(boundedRatio(ratio)).toBe(ratio)
    }
  })

  it('stops one very tall upload turning the page into a tunnel', () => {
    // A 1:3 portrait at the half track (691px at 1440) would otherwise stand
    // 2073px tall — more than two screens for one picture.
    expect(boundedRatio(0.333)).toBe(0.7)
  })

  it('passes a missing ratio through rather than inventing one', () => {
    // No dimensions means the box cannot be reserved from a ratio at all;
    // the CSS falls back to `aspect-ratio: auto` and the component must be
    // able to tell that case apart from a real number.
    expect(boundedRatio(null)).toBeNull()
  })
})
