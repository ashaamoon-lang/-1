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
 * Selects one locale out of a `localeString`/`localeText`/`localeRichText`
 * object, falling back to the default locale.
 *
 * The fallback mirrors the schema exactly: `lib/integrations/sanity/schemas/
 * locale.ts` requires only the default locale, so a translation can be
 * legitimately absent. Without `coalesce` those fields would render as empty
 * strings — a blank heading rather than an untranslated one, which is the
 * worse of the two failures.
 *
 * Written once here so no page hand-rolls the projection and drifts from it.
 * Callers pass `$locale` and `$defaultLocale` as query params.
 */
const localized = (field: string, alias = field) =>
  `"${alias}": coalesce(${field}[$locale], ${field}[$defaultLocale])`

/** Fields shared by the work grid and the project detail page. */
const projectCardFields = `
  _id,
  slug,
  year,
  client,
  span,
  featured,
  cover,
  ${localized('title')},
  ${localized('medium')},
  "coverAlt": coalesce(cover.alt[$locale], cover.alt[$defaultLocale])
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
    "body": coalesce(body[$locale], body[$defaultLocale])[]{
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
      "alt": coalesce(alt[$locale], alt[$defaultLocale])
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
    ${localized('headline')},
    ${localized('subline')},
    "portraitAlt": coalesce(portrait.alt[$locale], portrait.alt[$defaultLocale]),
    "statement": coalesce(statement[$locale], statement[$defaultLocale])
  }
`)
