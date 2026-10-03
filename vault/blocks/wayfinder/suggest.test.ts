import { describe, expect, it } from 'bun:test'

import type { SearchEntry } from '@/lib/content/search-index'

import { deadSlug, editDistance, likeness, MOST, suggest } from './suggest'

const LOCALES = ['en', 'id'] as const

function entry(
  kind: SearchEntry['kind'],
  href: string,
  label: string
): SearchEntry {
  return { id: href, kind, label, description: '', href, meta: null }
}

const INDEX: SearchEntry[] = [
  entry('page', '/en/work', 'Work'),
  entry('practice', '/en/practice/consulting', 'Consulting'),
  entry('project', '/en/work/arus-balik', 'Arus Balik'),
  entry('project', '/en/work/pusat-beban', 'Pusat Beban'),
  entry(
    'journal',
    '/en/journal/scope-is-the-deliverable',
    'Scope is the deliverable'
  ),
]

describe('editDistance and likeness', () => {
  it('counts single-character edits', () => {
    expect(editDistance('arus-balk', 'arus-balik')).toBe(1)
    expect(editDistance('', 'abc')).toBe(3)
    expect(likeness('same', 'same')).toBe(1)
    expect(likeness('arus-balk', 'arus-balik')).toBeCloseTo(0.9)
  })
})

describe('deadSlug', () => {
  it('takes the last segment, decoded and lowercased, without the locale', () => {
    expect(deadSlug('/en/work/Arus-Balk', LOCALES)).toBe('arus-balk')
    expect(deadSlug('/id/', LOCALES)).toBe('')
    expect(deadSlug('/en/journal/scope%20is', LOCALES)).toBe('scope is')
  })
})

describe('suggest', () => {
  it('offers the work a mistyped address was close to', () => {
    expect(suggest('/en/work/arus-balk', INDEX, LOCALES)[0]?.href).toBe(
      '/en/work/arus-balik'
    )
  })

  it('finds the right slug under the wrong section', () => {
    expect(suggest('/en/works/pusat-beban', INDEX, LOCALES)[0]?.href).toBe(
      '/en/work/pusat-beban'
    )
  })

  it("finds an entry by its title's words", () => {
    expect(suggest('/en/work/scope-deliverable', INDEX, LOCALES)[0]?.href).toBe(
      '/en/journal/scope-is-the-deliverable'
    )
  })

  it('never offers a page the 404 already names', () => {
    expect(
      suggest('/en/wrk', INDEX, LOCALES).some((found) => found.kind === 'page')
    ).toBe(false)
  })

  it('offers nothing for an address close to nothing', () => {
    expect(suggest('/this-route-does-not-exist-e2e', INDEX, LOCALES)).toEqual(
      []
    )
    expect(suggest('/en/x', INDEX, LOCALES)).toEqual([])
  })

  it(`offers at most ${MOST}`, () => {
    const many = Array.from({ length: 6 }, (_, index) =>
      entry('project', `/en/work/arus-balik-${index}`, `Arus Balik ${index}`)
    )
    expect(suggest('/en/work/arus-balik', many, LOCALES)).toHaveLength(MOST)
  })
})
