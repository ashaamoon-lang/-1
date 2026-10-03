import { describe, expect, it } from 'bun:test'

import { splitAtDatum } from './split'

describe('splitAtDatum', () => {
  it('puts later years above, the same year and earlier below, and undated last', () => {
    const entries = [
      { slug: 'later', date: '2026-02-11' },
      { slug: 'undated', date: '' },
      { slug: 'same-year', date: '2025-12-04' },
      { slug: 'earlier', date: '2024-01-15' },
    ]

    const { above, below } = splitAtDatum(entries, 2025)

    expect(above.map((entry) => entry.slug)).toEqual(['later'])
    expect(below.map((entry) => entry.slug)).toEqual([
      'same-year',
      'earlier',
      'undated',
    ])
  })
})
