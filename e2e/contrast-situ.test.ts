import { describe, expect, it } from 'bun:test'

import {
  type TextRun,
  compositeOver,
  contrastFaults,
  contrastRatio,
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
