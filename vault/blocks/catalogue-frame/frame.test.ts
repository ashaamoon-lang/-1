import { describe, expect, it } from 'bun:test'

import { buildFrame, type FrameWork } from './frame'

const ORDER = ['consulting', 'ai-data', 'commission'] as const

const work = (
  id: string,
  practice: string | null,
  year: number | null
): FrameWork => ({
  id,
  title: id,
  href: `/work/${id}`,
  client: null,
  practice,
  year,
})

const ids = (bay: readonly FrameWork[]) => bay.map((entry) => entry.id)

describe('the catalogue frame', () => {
  it('places each work in its practice row and year column, time running left to right', () => {
    const frame = buildFrame(
      [work('a', 'commission', 2023), work('b', 'consulting', 2025)],
      ORDER
    )

    expect(frame.years).toEqual([2023, 2025])
    expect(frame.rows.map((row) => row.practice)).toEqual([
      'consulting',
      'commission',
    ])
    expect(frame.rows[0]?.bays.map(ids)).toEqual([[], ['b']])
    expect(frame.rows[1]?.bays.map(ids)).toEqual([['a'], []])
  })

  it("keeps the catalogue's own order inside a bay", () => {
    const frame = buildFrame(
      [work('first', 'consulting', 2025), work('second', 'consulting', 2025)],
      ORDER
    )

    expect(frame.rows[0]?.bays.map(ids)).toEqual([['first', 'second']])
  })

  it('gives unnamed practices and undated work a place, and invents no rows', () => {
    const frame = buildFrame(
      [
        work('dated', 'ai-data', 2024),
        work('undated', 'ai-data', null),
        work('stray', 'sculpture', 2024),
        work('none', null, 2024),
      ],
      ORDER
    )

    expect(frame.years).toEqual([2024, null])
    expect(frame.rows.map((row) => row.practice)).toEqual(['ai-data', null])
    expect(frame.rows[0]?.bays.map(ids)).toEqual([['dated'], ['undated']])
    expect(frame.rows[1]?.bays.map(ids)).toEqual([['stray', 'none'], []])
  })

  it('is empty for an empty catalogue', () => {
    expect(buildFrame([], ORDER)).toEqual({ years: [], rows: [] })
  })
})
