/**
 * Guards the fallback precedence.
 *
 * The rule is "CMS wins, per field" and it is easy to get backwards in a way
 * nothing catches: an inverted check renders placeholder copy over the
 * studio's real words, on a page that still looks perfectly fine. The failure
 * mode is a live site quietly showing text nobody at the studio wrote.
 *
 * The empty-string cases are the ones worth the most here. Sanity stores `""`
 * for a field an editor opened and cleared, so a plain `??` would treat that
 * as content and render a blank heading.
 */

import { describe, expect, it } from 'bun:test'

import { resolveHomeContent } from './home-fallback'

describe('resolveHomeContent', () => {
  it('uses placeholder copy when there is no settings document', () => {
    const en = resolveHomeContent('en', null)
    const id = resolveHomeContent('id', null)

    expect(en.headline.length).toBeGreaterThan(0)
    expect(id.headline.length).toBeGreaterThan(0)
    expect(en.headline).not.toBe(id.headline)
    expect(en.fallbacks.statement).toBe(true)
    expect(en.fallbacks.headline).toBe(true)
    expect(en.statement).toBeNull()
    expect(en.statementFallback.length).toBeGreaterThan(0)
  })

  it('lets the CMS win field by field', () => {
    const resolved = resolveHomeContent('en', {
      name: 'Arth Studio',
      headline: 'A real headline from the CMS',
    })

    expect(resolved.name).toBe('Arth Studio')
    expect(resolved.headline).toBe('A real headline from the CMS')
    // Untouched fields keep the placeholder rather than blanking out.
    expect(resolved.subline.length).toBeGreaterThan(0)
    expect(resolved.email.length).toBeGreaterThan(0)

    /*
     * The assertion this replaced read `isPlaceholder === false`, and that
     * *was* the defect: this settings document supplies a name and a headline
     * and nothing else, so the subline, the email and the whole statement are
     * still this file's words — and the page reported that none of them were.
     * Origin is per field because resolution is per field.
     */
    expect(resolved.fallbacks.headline).toBe(false)
    expect(resolved.fallbacks.subline).toBe(true)
    expect(resolved.fallbacks.email).toBe(true)
    expect(resolved.fallbacks.statement).toBe(true)
  })

  it('treats an emptied field as absent, not as content', () => {
    const resolved = resolveHomeContent('en', {
      headline: '',
      subline: '   ',
      email: '',
    })

    const placeholder = resolveHomeContent('en', null)
    expect(resolved.headline).toBe(placeholder.headline)
    expect(resolved.subline).toBe(placeholder.subline)
    expect(resolved.email).toBe(placeholder.email)
  })

  it('prefers a CMS statement over the placeholder paragraphs', () => {
    const blocks = [{ _type: 'block', children: [] }]
    const resolved = resolveHomeContent('en', { statement: blocks })

    expect(resolved.statement).toBe(blocks)
  })

  it('falls back when the statement exists but is empty', () => {
    expect(resolveHomeContent('en', { statement: [] }).statement).toBeNull()
  })

  it('drops half-filled social rows rather than rendering a dead link', () => {
    const resolved = resolveHomeContent('en', {
      socials: [
        { label: 'Instagram', url: 'https://instagram.com/arth' },
        { label: 'No URL yet' },
        { url: 'https://example.test' },
      ],
    })

    expect(resolved.socials).toEqual([
      { label: 'Instagram', url: 'https://instagram.com/arth' },
    ])
  })

  it('falls back when every social row is unusable', () => {
    const resolved = resolveHomeContent('en', { socials: [{ label: 'x' }] })
    expect(resolved.socials).toEqual(resolveHomeContent('en', null).socials)
  })
})
