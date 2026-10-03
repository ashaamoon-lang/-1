import { describe, expect, it } from 'bun:test'

import { measureWorks } from './measure'

describe('measureWorks', () => {
  it('counts every engagement, each named client once, and marks only the years between the ends', () => {
    expect(
      measureWorks([
        { year: 2023, client: 'Rumah' },
        { year: 2025, client: 'Kedai' },
        { year: 2024, client: 'Rumah ' },
        { year: 2024, client: null },
        { year: null, client: 'Tirta' },
      ])
    ).toEqual({
      engagements: 5,
      clients: 3,
      from: 2023,
      to: 2025,
      marks: [0.5],
    })
  })
})
