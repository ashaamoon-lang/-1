import { describe, expect, it } from 'bun:test'

import {
  INTERIOR_MAX_PCT,
  type Screen,
  VOID_EXEMPT,
  mergeBands,
  voidFaults,
  voidProfile,
} from './first-screen-void'

/**
 * The numbers here are the ones measured on the production build before any
 * of this existed, so the unit tests exercise the real geometry rather than
 * shapes invented to suit the code.
 */

const band = (top: number, bottom: number) => ({ top, bottom })

const screen = (over: Partial<Screen> = {}): Screen => ({
  route: '/en',
  viewport: '1440×900',
  height: 900,
  boxes: [band(100, 182), band(698, 836)],
  ...over,
})

describe('merging content spans', () => {
  it('joins overlapping boxes', () => {
    expect(mergeBands([band(0, 100), band(50, 160)])).toEqual([band(0, 160)])
  })

  it('joins boxes that merely touch', () => {
    expect(mergeBands([band(0, 100), band(100, 160)])).toEqual([band(0, 160)])
  })

  it('keeps a real gap apart', () => {
    expect(mergeBands([band(0, 100), band(140, 160)])).toEqual([
      band(0, 100),
      band(140, 160),
    ])
  })

  it('does not care what order they arrive in', () => {
    expect(mergeBands([band(140, 160), band(0, 100)])).toEqual(
      mergeBands([band(0, 100), band(140, 160)])
    )
  })

  it('drops a zero-height box rather than counting it as an edge', () => {
    expect(mergeBands([band(50, 50), band(0, 100)])).toEqual([band(0, 100)])
  })
})

describe('the profile', () => {
  it('separates leading air from an interior hole', () => {
    /*
     * The measured home hero: index at 100–182, content from 698. Judged by
     * total emptiness this is 680px; judged correctly it is 96 leading, 516
     * interior, 64 trailing — and only the middle number is a defect.
     */
    const profile = voidProfile([band(100, 182), band(698, 836)], 900)
    expect(profile.leading).toBe(100)
    expect(profile.interior).toBe(516)
    expect(profile.trailing).toBe(64)
    expect(profile.interiorPct).toBe(57)
    expect(profile.at).toBe('y 182–698')
  })

  it('reports a bottom-anchored nameplate as leading air, not a hole', () => {
    // `/practice/<v>` with its breadcrumb removed: one mass, air above it.
    const profile = voidProfile([band(512, 740)], 900)
    expect(profile.leading).toBe(512)
    expect(profile.interior).toBe(0)
  })

  it('takes the largest gap when there are several', () => {
    const profile = voidProfile(
      [band(0, 50), band(100, 120), band(400, 420)],
      900
    )
    expect(profile.interior).toBe(280)
    expect(profile.at).toBe('y 120–400')
  })

  it('calls an empty screen entirely leading rather than clean', () => {
    /*
     * Anti-vacuum. A selector that matched nothing would otherwise report a
     * perfect profile for a blank page — the failure mode this project has
     * now recorded four times.
     */
    const profile = voidProfile([], 900)
    expect(profile.leading).toBe(900)
    expect(profile.interior).toBe(0)
  })
})

describe('the verdict', () => {
  it('catches the home hero at the measured number', () => {
    const faults = voidFaults([screen()])
    expect(faults.length).toBe(1)
    expect(faults[0]).toContain('516px of nothing between content')
    expect(faults[0]).toContain('57%')
    expect(faults[0]).toContain('y 182–698')
  })

  it('catches it at 390 too, where it is worse', () => {
    const faults = voidFaults([
      screen({
        viewport: '390×844',
        height: 844,
        boxes: [band(75, 111), band(665, 794)],
      }),
    ])
    expect(faults[0]).toContain('66%')
  })

  it('is quiet at the ratios the rest of the site actually runs at', () => {
    // /en/journal 142px of 900 = 16%, the worst passing route measured.
    expect(
      voidFaults([
        screen({
          route: '/en/journal',
          boxes: [band(298, 312), band(454, 800)],
        }),
      ])
    ).toEqual([])
  })

  it('is quiet for a page that is all leading air', () => {
    expect(
      voidFaults([screen({ route: '/en/work', boxes: [band(240, 880)] })])
    ).toEqual([])
  })

  it('honours the exemption list, and only for the routes on it', () => {
    const boxes = [band(48, 62), band(512, 740)]
    expect(
      voidFaults([screen({ route: '/en/practice/consulting', boxes })])
    ).toEqual([])
    // The same geometry anywhere else is still a fault.
    expect(voidFaults([screen({ route: '/en', boxes })]).length).toBe(1)
  })

  it('reports every failing screen, not just the first', () => {
    const faults = voidFaults([
      screen({ route: '/en' }),
      screen({ route: '/en/work', boxes: [band(240, 880)] }),
      screen({
        route: '/id',
        viewport: '390×844',
        height: 844,
        boxes: [band(75, 111), band(665, 794)],
      }),
    ])
    expect(faults.length).toBe(2)
  })

  it('says nothing about an empty list', () => {
    expect(voidFaults([])).toEqual([])
  })
})

describe('the exemption list', () => {
  it('names a reason for every entry', () => {
    expect(
      VOID_EXEMPT.filter((entry) => entry.because.trim().length < 40).map(
        (entry) => entry.route
      )
    ).toEqual([])
  })

  it('keeps the threshold above everything this site measures', () => {
    // 16% is the worst passing route. A ceiling at or below it would fail
    // correct pages; this records the margin as a test rather than a comment.
    expect(INTERIOR_MAX_PCT).toBeGreaterThan(16 * 2)
  })
})

describe('a viewport-scoped exemption', () => {
  const hole = [band(150, 440), band(804, 894)]

  it('excuses only the viewport it names', () => {
    expect(
      voidFaults([
        { route: '/en/studio', viewport: '1440×900', height: 900, boxes: hole },
      ])
    ).toEqual([])
    // The same route on a phone is still measured — which matters, because
    // this gate's own defect was worse at 390 than at 1440.
    expect(
      voidFaults([
        { route: '/en/studio', viewport: '390×844', height: 844, boxes: hole },
      ]).length
    ).toBe(1)
  })

  it('still excuses every viewport when none is named', () => {
    const boxes = [band(48, 62), band(512, 740)]
    for (const viewport of ['1440×900', '390×844']) {
      expect(
        voidFaults([
          { route: '/en/practice/consulting', viewport, height: 900, boxes },
        ])
      ).toEqual([])
    }
  })
})
