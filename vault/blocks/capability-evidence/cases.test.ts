import { describe, expect, it } from 'bun:test'

import { casesByPractice } from './cases'

describe('casesByPractice', () => {
  it('keeps every work of a practice, in the catalogue order', () => {
    const works = [
      {
        _id: 'a',
        slug: { current: 'arus' },
        title: 'Arus',
        year: 2024,
        practice: 'consulting',
      },
      {
        _id: 'b',
        slug: { current: 'bacaan' },
        title: 'Bacaan',
        year: 2023,
        practice: 'ai-data',
      },
      {
        _id: 'c',
        slug: { current: 'pusat' },
        title: 'Pusat',
        year: null,
        practice: 'consulting',
      },
    ]

    const cases = casesByPractice(works)

    expect(cases.get('consulting')).toEqual([
      { id: 'a', title: 'Arus', href: '/work/arus', year: 2024 },
      { id: 'c', title: 'Pusat', href: '/work/pusat', year: null },
    ])
    expect(cases.get('ai-data')).toEqual([
      { id: 'b', title: 'Bacaan', href: '/work/bacaan', year: 2023 },
    ])
    expect(cases.has('commission')).toBe(false)
  })

  it('lists no work that backs no practice, or that cannot be shown or reached', () => {
    const works = [
      {
        _id: 'a',
        slug: { current: 'arus' },
        title: 'Arus',
        year: 2024,
        practice: null,
      },
      {
        _id: 'b',
        slug: null,
        title: 'Bacaan',
        year: 2023,
        practice: 'ai-data',
      },
      {
        _id: 'c',
        slug: { current: 'pusat' },
        title: null,
        year: 2022,
        practice: 'consulting',
      },
    ]

    expect(casesByPractice(works).size).toBe(0)
  })
})
