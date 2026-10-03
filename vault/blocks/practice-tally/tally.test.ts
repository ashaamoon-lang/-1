import { describe, expect, it } from 'bun:test'

import { countByPractice } from './tally'

describe('countByPractice', () => {
  it('counts every named practice in order, including one that has carried nothing', () => {
    const entries = [
      { practice: 'consulting' },
      { practice: 'consulting' },
      { practice: 'ai-data' },
      { practice: null },
    ]
    const works = new Map<string, readonly unknown[]>([
      ['consulting', [{}, {}]],
      ['ai-data', [{}]],
    ])

    expect(
      countByPractice(['consulting', 'ai-data', 'commission'], entries, works)
    ).toEqual([
      { practice: 'consulting', entries: 2, works: 2 },
      { practice: 'ai-data', entries: 1, works: 1 },
      { practice: 'commission', entries: 0, works: 0 },
    ])
  })
})
