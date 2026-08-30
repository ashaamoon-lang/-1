/**
 * Guards the one duplication the query layer cannot avoid.
 *
 * `sanity typegen` only follows static literals, so the locale names in
 * `queries.ts` are written out (`select($locale == "id" => f.id, f.en)`)
 * rather than generated from `lib/i18n/routing.ts`. That duplication is
 * deliberate — it is what makes typegen infer `string` instead of a wrong
 * `Array<LocaleString>` — but duplication drifts, and the failure mode is
 * silent: add a third locale, forget these, and that language quietly serves
 * English forever with no error anywhere.
 *
 * These tests fail instead.
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

/** Non-default locales each need their own `select()` branch. */
const nonDefaultLocales = routing.locales.filter(
  (locale) => locale !== routing.defaultLocale
)

describe('localized queries', () => {
  it('branches on every non-default locale', () => {
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      for (const locale of nonDefaultLocales) {
        expect(
          query.includes(`$locale == "${locale}"`),
          `${name} has no branch for locale "${locale}" — that language would silently fall back to ${routing.defaultLocale}`
        ).toBe(true)
      }
    }
  })

  it('falls back to the default locale, which the schema guarantees exists', () => {
    // schemas/locale.ts requires only the default locale, so it is the only
    // value a document is certain to have. Any other fallback could be empty.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(
        query.includes(`.${routing.defaultLocale}`),
        `${name} never falls back to .${routing.defaultLocale}`
      ).toBe(true)
    }
  })

  it('uses select(), not dynamic bracket access', () => {
    // `field[$locale]` is correct at runtime but types as Array<LocaleString>,
    // because typegen cannot know a parameter's value. Consumers would be
    // written against a shape that never occurs.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(query, `${name} still uses dynamic bracket access`).not.toMatch(
        /\[\$locale\]/
      )
      expect(query).toContain('select($locale ==')
    }
  })

  it('takes $locale as its only locale parameter', () => {
    // $defaultLocale was dropped when the fallback moved into select()'s
    // default branch. A query still referencing it would throw at runtime,
    // since no caller passes it any more.
    for (const [name, query] of Object.entries(LOCALIZED_QUERIES)) {
      expect(
        query,
        `${name} references a parameter no caller passes`
      ).not.toContain('$defaultLocale')
    }
  })
})
