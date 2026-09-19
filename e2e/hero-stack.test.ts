import { describe, expect, test } from 'bun:test'

import {
  type HeroReading,
  STACK_EXEMPT,
  STACK_MAX,
  heroStack,
  isStackExempt,
  stackFaults,
  staleExemptions,
  unclassifiedHeroes,
} from './hero-stack'

const reading = (over: Partial<HeroReading> = {}): HeroReading => ({
  route: '/en',
  beats: 3,
  headlineIsBeat: false,
  hasHeadline: true,
  ...over,
})

describe('heroStack counts the headline once', () => {
  test('adds the headline when it reveals outside the beats', () => {
    // The home hero: SplitText opens the `h1`, so it carries no beat marker.
    expect(heroStack(reading({ beats: 3, headlineIsBeat: false }))).toBe(4)
  })

  test('does not add it again when the headline is itself a beat', () => {
    // `PracticeHero` marks its own `h1`. The old formula returned 6 here.
    expect(heroStack(reading({ beats: 5, headlineIsBeat: true }))).toBe(5)
  })

  test('the two forms of the same stack agree', () => {
    const split = heroStack(reading({ beats: 4, headlineIsBeat: false }))
    const marked = heroStack(reading({ beats: 5, headlineIsBeat: true }))
    expect(split).toBe(marked)
  })

  test('a hero with no headline is just its beats', () => {
    expect(
      heroStack(
        reading({ beats: 2, hasHeadline: false, headlineIsBeat: false })
      )
    ).toBe(2)
  })

  test('a hero with nothing in it reads 0, not 1', () => {
    expect(
      heroStack(
        reading({ beats: 0, hasHeadline: false, headlineIsBeat: false })
      )
    ).toBe(0)
  })
})

describe('stackFaults', () => {
  test('is silent at the ceiling', () => {
    expect(stackFaults([reading({ beats: 3 })])).toEqual([])
  })

  test('reports one past it, and names both numbers', () => {
    const faults = stackFaults([reading({ beats: 4 })])
    expect(faults).toHaveLength(1)
    expect(faults[0]).toContain('/en')
    expect(faults[0]).toContain('5')
    expect(faults[0]).toContain(String(STACK_MAX))
  })

  test('the ceiling is four', () => {
    expect(STACK_MAX).toBe(4)
  })

  test('skips exempt routes however tall their stack', () => {
    expect(stackFaults([reading({ route: '/en/studio', beats: 20 })])).toEqual(
      []
    )
  })

  test('an empty sweep reports nothing rather than throwing', () => {
    expect(stackFaults([])).toEqual([])
  })

  test('honours a caller-supplied ceiling', () => {
    expect(stackFaults([reading({ beats: 5 })], 6)).toEqual([])
  })
})

describe('STACK_EXEMPT is data, and every entry carries its reason', () => {
  test('every entry gives a because', () => {
    for (const entry of STACK_EXEMPT) {
      expect(entry.because.trim().length).toBeGreaterThan(40)
    }
  })

  test('every entry names the stack it was measured at', () => {
    // A reason without its measurement is the prose this file replaced.
    for (const entry of STACK_EXEMPT) {
      expect(entry.because).toContain('measured')
    }
  })

  test('no route is listed twice', () => {
    const routes = STACK_EXEMPT.map((entry) => entry.route)
    expect(new Set(routes).size).toBe(routes.length)
  })

  test('the governed arrival routes are not exempt', () => {
    expect(isStackExempt('/en')).toBe(false)
    expect(isStackExempt('/id')).toBe(false)
  })
})

describe('unclassifiedHeroes closes the hole', () => {
  test('a new hero nobody classified is reported', () => {
    const faults = unclassifiedHeroes([reading({ route: '/en/lab' })], ['/en'])
    expect(faults).toHaveLength(1)
    expect(faults[0]).toContain('/en/lab')
    expect(faults[0]).toContain('STACK_EXEMPT')
  })

  test('governed heroes are classified', () => {
    expect(unclassifiedHeroes([reading({ route: '/en' })], ['/en'])).toEqual([])
  })

  test('exempt heroes are classified', () => {
    expect(
      unclassifiedHeroes([reading({ route: '/en/studio' })], ['/en'])
    ).toEqual([])
  })

  test('every hero this site ships today is classified', () => {
    const routes = [
      '/en',
      '/id',
      '/en/work',
      '/en/work/arus-balik',
      '/en/practice/consulting',
      '/en/studio',
      '/en/journal',
      '/en/journal/scope-is-the-deliverable',
    ]
    const readings = routes.map((route) => reading({ route }))
    expect(unclassifiedHeroes(readings, ['/en', '/id'])).toEqual([])
  })
})

describe('staleExemptions', () => {
  test('reports an exemption for a route the sweep never saw', () => {
    const faults = staleExemptions([reading({ route: '/en' })])
    expect(faults.length).toBe(STACK_EXEMPT.length)
  })

  test('is silent when every exemption was visited', () => {
    const readings = STACK_EXEMPT.map((entry) =>
      reading({ route: entry.route })
    )
    expect(staleExemptions(readings)).toEqual([])
  })
})
