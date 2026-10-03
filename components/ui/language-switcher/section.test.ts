import { describe, expect, it } from 'bun:test'

import { READING_LINE, sectionInView } from './section'

const VIEWPORT = 800

describe('sectionInView', () => {
  it('names the last section whose top has risen above the reading line', () => {
    const sections = [
      { id: 'overview', top: -900 },
      { id: 'arc', top: -100 },
      { id: 'outcome', top: VIEWPORT * READING_LINE - 1 },
      { id: 'onward', top: VIEWPORT - 50 },
    ]
    expect(sectionInView(sections, VIEWPORT)).toBe('outcome')
  })

  it('names nothing when every section is still below the line', () => {
    expect(
      sectionInView([{ id: 'overview', top: VIEWPORT * 0.9 }], VIEWPORT)
    ).toBeNull()
    expect(sectionInView([], VIEWPORT)).toBeNull()
  })
})
