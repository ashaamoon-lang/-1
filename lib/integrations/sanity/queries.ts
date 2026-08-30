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
 * Locale selection.
 *
 * Every localized field is projected with `select($locale == "id" => f.id,
 * f.en)` — pick the Indonesian value when that locale is active, otherwise
 * fall back to English. The fallback mirrors the schema, which requires only
 * the default locale (`schemas/locale.ts`), so a missing translation renders
 * the English text rather than an empty string.
 *
 * ## Why `select()` and not `field[$locale]`
 *
 * Both work at runtime — verified against the live API: `{"en":"a","id":"b"}[$loc]`
 * with `$loc="id"` correctly returns "b". But `sanity typegen` cannot know a
 * parameter's value statically, so it types the dynamic bracket as a filter and
 * produced `Array<LocaleString>` where the query actually returns a string. A
 * confidently wrong type is worse than none: every consumer would have been
 * written against a shape that never occurs at runtime.
 *
 * `select()` branches on static property accesses, so typegen infers
 * `string | null` correctly. That is the whole reason for the more verbose form.
 *
 * ## Why constants and not a helper function
 *
 * Typegen extracts queries by static analysis. It follows const string bindings
 * — which is why `richTextWithLinks` above works — but cannot evaluate a
 * function call. An earlier `localized(field)` helper failed with
 * "Could not find binding for node" and silently generated NO types for any
 * localized query.
 *
 * ## Locale names are literal here
 *
 * `"id"` and `"en"` are written out because typegen needs literals. That
 * duplicates `lib/i18n/routing.ts`, so `queries.test.ts` asserts the two stay
 * in step — adding a locale without updating these fails that test rather than
 * silently serving English.
 */
const localizedTitle = `"title": select($locale == "id" => title.id, title.en)`
const localizedMedium = `"medium": select($locale == "id" => medium.id, medium.en)`
const localizedCoverAlt = `"coverAlt": select($locale == "id" => cover.alt.id, cover.alt.en)`
const localizedHeadline = `"headline": select($locale == "id" => headline.id, headline.en)`
const localizedSubline = `"subline": select($locale == "id" => subline.id, subline.en)`
const localizedStatement = `"statement": select($locale == "id" => statement.id, statement.en)`

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
    "body": select($locale == "id" => body.id, body.en)[]{
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
      "alt": select($locale == "id" => alt.id, alt.en)
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
    "portraitAlt": select($locale == "id" => portrait.alt.id, portrait.alt.en),
    ${localizedStatement}
  }
`)
