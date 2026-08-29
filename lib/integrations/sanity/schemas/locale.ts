import { defineField, defineType } from 'sanity'

import { routing } from '@/lib/i18n/routing'

/**
 * Field-level localization.
 *
 * One document holds every language; only the text fields are per-locale.
 * Images, ordering, dates, and slugs are shared.
 *
 * The alternative — one document per language, as
 * `@sanity/document-internationalization` does — was rejected for this
 * project. In a portfolio the only thing that differs between languages is
 * prose: the artwork is identical. Splitting by document would duplicate every
 * image asset and let two versions of the same work drift apart, so a reader
 * in one language could see a gallery the other never gets. Field-level
 * localization makes that impossible by construction.
 *
 * The cost is honest and worth stating: consumers must read `value[locale]`
 * rather than `value`, and GROQ projections have to select the active locale.
 * `lib/integrations/sanity/queries.ts` does that in one place so pages never
 * hand-roll it.
 *
 * Locales come from `lib/i18n/routing.ts`, so adding one is a single-line
 * change there — and the CMS can never offer a language the site does not
 * route.
 *
 * ## Why three near-identical definitions instead of one factory
 *
 * A single `localeFields(type)` helper reads better but does not typecheck:
 * Sanity's field definitions are a discriminated union keyed on `type`, so a
 * parameter typed `'string' | 'text' | 'richText'` satisfies none of the
 * branches. The only way to collapse them is a cast, which would trade a real
 * compile-time guarantee for three saved lines. Explicit wins.
 */

/**
 * Only the default locale is required.
 *
 * Requiring every language would block publishing until a translation exists,
 * which in practice means editors ship placeholder text — worse than a missing
 * translation the query layer can fall back from.
 */
const isRequired = (locale: string) => locale === routing.defaultLocale

/** Short single-line text: titles, labels, alt text. */
export const localeString = defineType({
  name: 'localeString',
  title: 'Localized text',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: routing.locales.map((locale) =>
    defineField({
      name: locale,
      title: locale.toUpperCase(),
      type: 'string',
      validation: (Rule) => (isRequired(locale) ? Rule.required() : Rule),
    })
  ),
})

/** Multi-line plain text: captions, short descriptions. */
export const localeText = defineType({
  name: 'localeText',
  title: 'Localized text (multi-line)',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: routing.locales.map((locale) =>
    defineField({
      name: locale,
      title: locale.toUpperCase(),
      type: 'text',
      validation: (Rule) => (isRequired(locale) ? Rule.required() : Rule),
    })
  ),
})

/** Portable Text, for body copy that needs formatting or links. */
export const localeRichText = defineType({
  name: 'localeRichText',
  title: 'Localized rich text',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: routing.locales.map((locale) =>
    defineField({
      name: locale,
      title: locale.toUpperCase(),
      type: 'richText',
    })
  ),
})
