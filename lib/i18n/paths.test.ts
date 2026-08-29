/**
 * Locale path invariants.
 *
 * Two vocabularies coexist here — locale-free *templates* and *localized
 * paths* — and conflating them is the failure this file guards against. It is
 * not hypothetical: dedup against CMS slugs compares templates, while the
 * sitemap and canonical URLs must emit localized paths. Getting it backwards
 * makes the guard silently stop matching, with no error anywhere.
 */

import { describe, expect, it } from 'bun:test'

import {
  localeFromPath,
  localizedPath,
  templateFromLocalizedPath,
} from './paths'
import { routing } from './routing'

describe('localizedPath', () => {
  it('maps the root template to a bare locale prefix', () => {
    // '/en/', with a trailing slash, would be a second URL for the same page —
    // and `lib/seo/alternates.ts` requires exactly one canonical form.
    expect(localizedPath('en', '/')).toBe('/en')
    expect(localizedPath('id', '/')).toBe('/id')
  })

  it('prefixes a nested template', () => {
    expect(localizedPath('en', '/ai')).toBe('/en/ai')
    expect(localizedPath('id', '/work/mural')).toBe('/id/work/mural')
  })
})

describe('templateFromLocalizedPath', () => {
  it('round-trips every locale against localizedPath', () => {
    const templates = ['/', '/ai', '/work/mural']

    for (const locale of routing.locales) {
      for (const template of templates) {
        expect(templateFromLocalizedPath(localizedPath(locale, template))).toBe(
          template
        )
      }
    }
  })

  it('returns null for a path carrying no locale prefix', () => {
    // This is how callers tell a localized page from an unlocalized one
    // (/studio, /llms.txt) instead of guessing from its shape. Returning a
    // template here would make `routeAlternates` advertise hreflang for pages
    // that have no translation.
    expect(templateFromLocalizedPath('/studio')).toBeNull()
    expect(templateFromLocalizedPath('/llms.txt')).toBeNull()
    expect(templateFromLocalizedPath('/')).toBeNull()
  })

  it('does not treat a lookalike first segment as a locale', () => {
    expect(templateFromLocalizedPath('/english')).toBeNull()
    expect(templateFromLocalizedPath('/index')).toBeNull()
  })
})

describe('localeFromPath', () => {
  it('reads the active locale from the prefix', () => {
    expect(localeFromPath('/en/ai')).toBe('en')
    expect(localeFromPath('/id')).toBe('id')
  })

  it('returns null when there is no prefix', () => {
    expect(localeFromPath('/studio')).toBeNull()
    expect(localeFromPath('/')).toBeNull()
  })
})
