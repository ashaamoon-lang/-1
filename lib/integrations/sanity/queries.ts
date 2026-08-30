import { defineQuery } from 'next-sanity'

// Helper for rich text content with link projections
const richTextWithLinks = `
  content[]{
    ...,
    markDefs[]{
      ...,
      _type == "link" => {
        ...,
        internalLink->{_type, slug, title}
      }
    }
  }
`

const linkWithLabel = `
  link {
    ...,
    internalLink->{_type, slug, title}
  }
`

// Page queries
export const pageQuery = defineQuery(`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    ${richTextWithLinks},
    ${linkWithLabel},
    metadata,
    publishedAt,
    _updatedAt
  }
`)

// Article queries
export const articleQuery = defineQuery(`
  *[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    featuredImage,
    ${richTextWithLinks},
    categories,
    tags,
    author,
    publishedAt,
    metadata,
    _updatedAt
  }
`)

export const allArticlesQuery = defineQuery(`
  *[_type == "article"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    featuredImage,
    categories,
    publishedAt
  }
`)

// ---------------------------------------------------------------------------
// Localized content
// ---------------------------------------------------------------------------

/**
 * Locale selection for `internationalizedArray*` fields.
 *
 * The plugin stores each localized field as `[{ _key: 'en', value: … }]`, so
 * a value is picked by filtering on `_key` and taking the first match. The
 * `coalesce` falls back to English when a translation has not been written
 * yet — without it the field resolves to null and the page renders a blank
 * heading rather than an untranslated one, which is the worse failure.
 *
 * ## Why these are constants, not a helper function
 *
 * `sanity typegen` extracts queries by static analysis. It follows const
 * string bindings — which is why `richTextWithLinks` above works — but cannot
 * evaluate a function call. An earlier `localized(field)` helper failed with
 * "Could not find binding for node" and silently generated NO types for any
 * localized query. Verbose constants are the price of that check working.
 *
 * ## Why `[_key == $locale]` is safe here, unlike `field[$locale]`
 *
 * This is an array FILTER, which is what GROQ brackets are actually for.
 * The previous localized-object model used `field[$locale]` as dynamic
 * property access: correct at runtime, but typegen cannot know a parameter's
 * value and typed it as `Array<LocaleString>` where a string comes back.
 * Filtering an array types correctly — verified: every localized field below
 * generates `string | null`.
 *
 * The fallback locale is a literal because typegen needs one, duplicating
 * `lib/i18n/routing.ts`. `queries.test.ts` asserts the two stay in step.
 */
const localizedTitle = `"title": coalesce(title[_key == $locale][0].value, title[_key == "en"][0].value)`
const localizedMedium = `"medium": coalesce(medium[_key == $locale][0].value, medium[_key == "en"][0].value)`
const localizedCoverAlt = `"coverAlt": coalesce(cover.alt[_key == $locale][0].value, cover.alt[_key == "en"][0].value)`
const localizedHeadline = `"headline": coalesce(headline[_key == $locale][0].value, headline[_key == "en"][0].value)`
const localizedSubline = `"subline": coalesce(subline[_key == $locale][0].value, subline[_key == "en"][0].value)`
const localizedStatement = `"statement": coalesce(statement[_key == $locale][0].value, statement[_key == "en"][0].value)`

/** Fields shared by the work grid and the project detail page. */
const projectCardFields = `
  _id,
  slug,
  year,
  client,
  span,
  featured,
  cover,
  ${localizedTitle},
  ${localizedMedium},
  ${localizedCoverAlt}
`

/** Every project, in curated order. */
export const projectsQuery = defineQuery(`
  *[_type == "project"] | order(order asc, publishedAt desc) {
    ${projectCardFields}
  }
`)

/** Home-page selection only. */
export const featuredProjectsQuery = defineQuery(`
  *[_type == "project" && featured == true] | order(order asc, publishedAt desc) {
    ${projectCardFields}
  }
`)

/** One project, with everything the detail page renders. */
export const projectQuery = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    ${projectCardFields},
    dimensions,
    publishedAt,
    metadata,
    _updatedAt,
    "body": coalesce(body[_key == $locale][0].value, body[_key == "en"][0].value)[]{
      ...,
      markDefs[]{
        ...,
        _type == "link" => {
          ...,
          internalLink->{_type, slug, title}
        }
      }
    },
    gallery[]{
      ...,
      "alt": coalesce(alt[_key == $locale][0].value, alt[_key == "en"][0].value)
    }
  }
`)

/**
 * Slugs only, for `generateStaticParams`.
 *
 * Deliberately not locale-parameterised: the slug is shared across languages,
 * so one list drives both locales' routes.
 */
export const projectSlugsQuery = defineQuery(`
  *[_type == "project" && defined(slug.current)].slug.current
`)

/** The studio singleton — hero copy, statement, contact. */
export const studioSettingsQuery = defineQuery(`
  *[_type == "studioSettings"][0] {
    _id,
    name,
    email,
    socials,
    portrait,
    metadata,
    ${localizedHeadline},
    ${localizedSubline},
    "portraitAlt": coalesce(portrait.alt[_key == $locale][0].value, portrait.alt[_key == "en"][0].value),
    ${localizedStatement}
  }
`)
