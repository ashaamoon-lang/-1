import { describe, expect, it } from 'bun:test'

import {
  type TextRun,
  compositeOver,
  contrastFaults,
  contrastRatio,
  inkAlpha,
  MID_REVEAL_OPACITY,
  paintedBoxes,
  relativeLuminance,
  wcagFloor,
  worstContrast,
} from './contrast-situ'

/**
 * The reference values here are **not** produced by the code under test.
 *
 * 21:1 for black on white, 4.54:1 for `#767676` on white and 3.03:1 for
 * `#949494` on white are the canonical WCAG worked examples — the greys every
 * contrast tool is calibrated against. Asserting against numbers this module
 * generated would only prove it is self-consistent, which is exactly how the
 * first version of the probe behind this gate reported `Infinity:1` on seven
 * routes and looked like it had run.
 */

const rgb = (r: number, g: number, b: number) => ({ r, g, b })
const WHITE = rgb(255, 255, 255)
const BLACK = rgb(0, 0, 0)

const run = (over: Partial<TextRun> = {}): TextRun => ({
  label: 'Images',
  where: '/en/work/arus-balik 390px @1224',
  tag: 'A',
  sizePx: 11.01,
  weight: 400,
  ratio: 9,
  ...over,
})

describe('the WCAG maths', () => {
  it('puts white at luminance 1 and black at 0', () => {
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10)
    expect(relativeLuminance(BLACK)).toBeCloseTo(0, 10)
  })

  it('gives black on white the canonical 21:1', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 6)
  })

  it('is symmetric — the caller need not know which one is text', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(
      contrastRatio(BLACK, WHITE),
      10
    )
  })

  it('matches the reference greys, including the one just under AA', () => {
    // #767676 is the darkest grey that still clears 4.5 on white; #777777 is
    // one step lighter and does not. A formula with the sRGB knee wrong lands
    // both on the same side.
    expect(contrastRatio(rgb(118, 118, 118), WHITE)).toBeCloseTo(4.54, 2)
    expect(contrastRatio(rgb(119, 119, 119), WHITE)).toBeCloseTo(4.48, 2)
    expect(contrastRatio(rgb(148, 148, 148), WHITE)).toBeCloseTo(3.03, 2)
  })

  it('gives identical colours exactly 1:1', () => {
    expect(contrastRatio(rgb(21, 19, 17), rgb(21, 19, 17))).toBeCloseTo(1, 10)
  })
})

describe('compositing semi-transparent text', () => {
  it('returns the ink unchanged at alpha 1', () => {
    expect(compositeOver(WHITE, BLACK, 1)).toEqual(WHITE)
  })

  it('returns the ground at alpha 0', () => {
    expect(compositeOver(WHITE, BLACK, 0)).toEqual(BLACK)
  })

  it('meets in the middle at alpha 0.5', () => {
    expect(compositeOver(WHITE, BLACK, 0.5)).toEqual(rgb(127.5, 127.5, 127.5))
  })

  it('is why the defect measures what it measures', () => {
    /*
     * The page index is `oklab(0.964 … / 0.75)` — white at 75%. Over a pale
     * region of a photograph the ink composites *towards* the photo, and the
     * contrast collapses far below what the same colour reaches at full
     * opacity. Judging it opaque would report a number no reader ever gets.
     */
    const pale = rgb(226, 226, 220)
    const opaque = contrastRatio(WHITE, pale)
    const real = contrastRatio(compositeOver(WHITE, pale, 0.75), pale)
    expect(opaque).toBeGreaterThan(real)
    expect(real).toBeLessThan(1.5)
  })
})

describe('the AA floor', () => {
  it('takes 24px as large at any weight', () => {
    expect(wcagFloor(24, 400)).toBe(3)
    expect(wcagFloor(23.99, 400)).toBe(4.5)
  })

  it('takes 18.66px as large only when bold', () => {
    // The line most often mis-transcribed in the whole standard: 14pt *bold*.
    expect(wcagFloor(18.66, 700)).toBe(3)
    expect(wcagFloor(18.66, 400)).toBe(4.5)
    expect(wcagFloor(18.66, 699)).toBe(4.5)
    expect(wcagFloor(18.65, 700)).toBe(4.5)
  })

  it('treats the site’s caption size as small text', () => {
    expect(wcagFloor(11.8512, 400)).toBe(4.5)
  })
})

describe('finding the worst pixel', () => {
  it('says nothing measured rather than nothing wrong', () => {
    // The `Infinity:1` failure, as a test: an empty candidate list must be
    // distinguishable from a clean one.
    expect(worstContrast(WHITE, 1, [])).toBeUndefined()
  })

  it('picks the background nearest the ink, not the darkest or lightest', () => {
    const worst = worstContrast(WHITE, 1, [
      BLACK,
      rgb(200, 200, 200),
      rgb(30, 30, 30),
    ])
    expect(worst?.bg).toEqual(rgb(200, 200, 200))
  })

  it('accounts for alpha when choosing', () => {
    const worst = worstContrast(WHITE, 0.75, [
      rgb(21, 19, 17),
      rgb(244, 243, 239),
    ])
    expect(worst?.bg).toEqual(rgb(244, 243, 239))
    expect(worst?.ratio).toBeLessThan(1.2)
  })
})

describe('the verdict', () => {
  it('is quiet when every run clears its floor', () => {
    expect(contrastFaults([run({ ratio: 4.5 }), run({ ratio: 21 })])).toEqual(
      []
    )
  })

  it('catches the Tahap 72 defect, at the measured number', () => {
    const faults = contrastFaults([run({ ratio: 1.48 })])
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('1.48:1 needs 4.5:1')
    expect(faults[0]).toContain('Images')
    expect(faults[0]).toContain('/en/work/arus-balik')
  })

  it('holds large text to 3 and the same ratio of small text to 4.5', () => {
    expect(
      contrastFaults([run({ ratio: 3.2, sizePx: 45.6, weight: 600 })])
    ).toEqual([])
    expect(contrastFaults([run({ ratio: 3.2 })]).length).toBe(1)
  })

  it('reports every failing run, not just the first', () => {
    const faults = contrastFaults([
      run({ ratio: 1.48, label: 'Images' }),
      run({ ratio: 9, label: 'Work' }),
      run({ ratio: 2.68, label: 'Next' }),
    ])
    expect(faults.length).toBe(2)
    expect(faults.join(' ')).toContain('Next')
    expect(faults.join(' ')).not.toContain('Work')
  })

  it('says nothing about an empty page', () => {
    expect(contrastFaults([])).toEqual([])
  })
})

/*
 * What part of a line box a reader can see — the fork's clip.
 *
 * Every expected box below is worked by hand from the rule stated on
 * `paintedBoxes`: intersect with the clip and the viewport, inset 1px
 * horizontally and min(2, height / 4) vertically, drop slivers.
 */
describe('the part of a line a reader can see', () => {
  const PHONE = { width: 390, height: 844 }
  const OPEN = { left: 0, top: 0, right: 390, bottom: 844 }
  const LINE = { left: 10, top: 100, right: 200, bottom: 120 }

  it('keeps an unclipped line, inset from its edges', () => {
    // x = ceil(10 + 1) = 11, w = floor(200 - 1) - 11 = 188
    // pad = min(2, 20 / 4) = 2: y = 102, h = floor(118) - 102 = 16
    expect(paintedBoxes([LINE], OPEN, PHONE)).toEqual([
      { x: 11, y: 102, w: 188, h: 16 },
    ])
  })

  it('drops a line clipped entirely out of sight — the rolled-away caption', () => {
    const mask = { left: 0, top: 0, right: 390, bottom: 90 }
    expect(paintedBoxes([LINE], mask, PHONE)).toEqual([])
  })

  it('measures the visible half of a half-clipped line', () => {
    const tall = { left: 10, top: 100, right: 200, bottom: 140 }
    const mask = { left: 0, top: 0, right: 390, bottom: 120 }
    // Visible 100..120, which is the same box as the unclipped 20px line.
    expect(paintedBoxes([tall], mask, PHONE)).toEqual([
      { x: 11, y: 102, w: 188, h: 16 },
    ])
  })

  it('clips on one axis without touching the other', () => {
    const column = { left: 50, top: 0, right: 100, bottom: 844 }
    // x = 51, w = floor(99) - 51 = 48; vertical as before.
    expect(paintedBoxes([LINE], column, PHONE)).toEqual([
      { x: 51, y: 102, w: 48, h: 16 },
    ])
  })

  it('treats an inverted clip as nothing visible', () => {
    const inverted = { left: 300, top: 0, right: 100, bottom: 844 }
    expect(paintedBoxes([LINE], inverted, PHONE)).toEqual([])
  })

  it('stops at the viewport edge even when the clip does not', () => {
    const overhang = { left: 300, top: 100, right: 500, bottom: 120 }
    // right clamps to 390: x = 301, w = floor(389) - 301 = 88
    expect(paintedBoxes([overhang], OPEN, PHONE)).toEqual([
      { x: 301, y: 102, w: 88, h: 16 },
    ])
  })

  it('drops a sliver too thin to sample', () => {
    const sliver = { left: 10, top: 100, right: 200, bottom: 103 }
    expect(paintedBoxes([sliver], OPEN, PHONE)).toEqual([])
  })
})

/*
 * How much ink reaches the screen — the fork's effective opacity.
 */
describe('ink that reaches the screen', () => {
  it('leaves opaque ink under an opaque tree unchanged', () => {
    expect(inkAlpha(1, 1)).toBe(1)
  })

  it('keeps a colour’s own alpha — the page index at 0.75', () => {
    expect(inkAlpha(0.75, 1)).toBe(0.75)
  })

  it('dims a scrubbed word by its opacity rather than measuring full ink', () => {
    expect(inkAlpha(1, 0.55)).toBe(0.55)
  })

  it('multiplies an ancestor’s recede into the colour’s alpha', () => {
    // A receding step (0.7) holding --text-muted (alpha 0.75).
    expect(inkAlpha(0.75, 0.7)).toBeCloseTo(0.525, 10)
  })

  it('judges text at the mid-reveal threshold, and skips it just below', () => {
    expect(MID_REVEAL_OPACITY).toBe(0.5)
    expect(inkAlpha(1, 0.5)).toBe(0.5)
    expect(inkAlpha(1, 0.49)).toBeUndefined()
  })
})
