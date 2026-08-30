/**
 * Guards the locale handling in `queries.ts`.
 *
 * Localized fields are stored by sanity-plugin-internationalized-array as
 * `[{ _key: 'en', value: … }]`, and read back by filtering on `_key`. Two
 * things about that are easy to get wrong, and both fail silently:
 *
 *  - the fallback locale is written as a literal (typegen cannot follow a
 *    variable), duplicating `lib/i18n/routing.ts`. Add a locale, forget these,
 *    and that language serves English forever with no error anywhere.
 *  - reverting to dynamic property access (`field[$locale]`) still works at
 *    runtime but makes typegen infer an array where a string comes back, so
 *    every consumer is written against a shape that never occurs.
 */

import { describe, expect, it } from 'bun:test'

import { routing } from '@/lib/i18n/routing'

import {
  featuredProjectsQuery,
  projectQuery,
  projectsQuery,
  studioSettingsQuery,
} from './queries'

/** Every query that projects a localized field. */
const LOCALIZED_QUERIES = {
  projectsQuery,
  featuredProjectsQuery,
  projectQuery,
  studioSettingsQuery,
} as const

describe('localized queries', () => {
  it('selects the active locale by filtering on _key', () => {
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(query, `${name} does not read $locale`).toContain(
        '[_key == $locale][0].value'
      )
    }
  })

  it('falls back to the default locale, which the schema guarantees exists', () => {
    // A translation may legitimately be missing. Without the fallback the
    // field resolves to null and renders blank rather than untranslated.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(query, `${name} has no fallback`).toContain(
        `[_key == "${routing.defaultLocale}"][0].value`
      )
    }
  })

  it('never uses dynamic property access on a localized field', () => {
    // `field[$locale]` is correct at runtime but types as an array, because
    // typegen cannot know a parameter's value. Filtering an array types
    // correctly; indexing an object by a param does not.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(query, `${name} indexes an object by parameter`).not.toMatch(
        /\w+\[\$locale\]/
      )
    }
  })

  it('takes $locale as its only locale parameter', () => {
    // $defaultLocale was dropped when the fallback became a literal. A query
    // still referencing it would throw, since no caller passes it.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(
        query,
        `${name} references a parameter no caller passes`
      ).not.toContain('$defaultLocale')
    }
  })
})
