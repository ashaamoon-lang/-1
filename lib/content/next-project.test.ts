import { describe, expect, it } from 'bun:test'

import { nextProject } from './next-project'

const make = (...slugs: string[]) =>
  slugs.map((slug) => ({ slug: { current: slug } }))

describe('nextProject', () => {
  it('follows the curated order, not the alphabet', () => {
    // Deliberately not alphabetical: this is the order the studio chose.
    const projects = make('zebra', 'apple', 'mango')

    expect(nextProject(projects, 'zebra')?.slug.current).toBe('apple')
    expect(nextProject(projects, 'apple')?.slug.current).toBe('mango')
  })

  it('wraps, so the last project is not a dead end', () => {
    const projects = make('one', 'two', 'three')
    expect(nextProject(projects, 'three')?.slug.current).toBe('one')
  })

  it('returns nothing when there is only one project', () => {
    // Otherwise "next project" links to the page being read.
    expect(nextProject(make('only'), 'only')).toBeNull()
  })

  it('returns nothing for an empty list', () => {
    expect(nextProject([], 'anything')).toBeNull()
  })

  it('returns nothing for a slug not in the list', () => {
    // Happens when previewing a draft that has not been published yet.
    expect(nextProject(make('a', 'b'), 'draft-only')).toBeNull()
  })

  it('tolerates a project with no slug rather than throwing', () => {
    const projects = [{ slug: null }, { slug: { current: 'b' } }]
    expect(nextProject(projects, 'b')?.slug).toBeNull()
  })
})
