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
  discipline,
  cover{ ..., "lqip": asset->metadata.lqip },
  ${localizedTitle},
  ${localizedMedium},
  ${localizedCoverAlt}
`

/**
 * The public catalogue, in one place.
 *
 * `listed` is absent on every document written before the field existed, and
 * `listed != false` is deliberately not `listed == true`: the former treats a
 * missing value as listed, which is the safe default and means no migration is
 * needed. A work is hidden only when the editor explicitly turns it off.
 *
 * Every surface that *advertises* a work reuses this, so "hidden" cannot mean
 * one thing on the home page and another in the sitemap — which is exactly
 * what it did (`docs/AUDIT-2026-08.md` §2.2).
 */
const isListed = `_type == "project" && listed != false`

/** Every listed project, in curated order. */
export const projectsQuery = defineQuery(`
  *[${isListed}] | order(order asc, publishedAt desc) {
    ${projectCardFields}
  }
`)

/** Home-page selection only. */
export const featuredProjectsQuery = defineQuery(`
  *[${isListed} && featured == true] | order(order asc, publishedAt desc) {
    ${projectCardFields}
  }
`)

/**
 * The work index, optionally narrowed to one discipline.
 *
 * `$discipline` is null for the unfiltered view, and GROQ's `||` short-circuits
 * so the comparison is skipped entirely rather than matching nothing.
 */
export const workIndexQuery = defineQuery(`
  *[${isListed} && ($discipline == null || discipline == $discipline)]
    | order(order asc, publishedAt desc) {
    ${projectCardFields}
  }
`)

/** Which disciplines actually have listed work, for the filter chips. */
export const disciplinesQuery = defineQuery(`
  array::unique(*[${isListed} && defined(discipline)].discipline)
`)

/**
 * One project, with everything the detail page renders — plus two projections
 * that exist only for metadata, and that were both missing.
 *
 * `excerpt`: `generateSanityMetadata` derives a description from a field of
 * that name, and only `article` had one. So every project page shipped with
 * no `<meta name="description">` and no `og:description`, and a search engine
 * invented a snippet for the whole portfolio. `pt::text` flattens the Portable
 * Text body to a plain string, which is what `truncateDescription` wants.
 *
 * `ogImage`: `schemas/project.ts` tells the editor the cover is "used in the
 * work grid **and as the OpenGraph image**". It was not — the queries never
 * dereferenced the asset, so every shared artwork link rendered the same
 * generic wordmark card. On a site made of paintings that is the most direct
 * loss there is. See `docs/AUDIT-2026-08.md` §1.3.
 *
 * Note for anyone extending this: GROQ has `//` line comments and **no** block
 * comments. A `/* *\/` inside the template literal is a syntax error that
 * typegen reports as "Unexpected end of query" at an unrelated position, and
 * the query then silently vanishes from `sanity.types.ts`.
 */
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
      "lqip": asset->metadata.lqip,
      "alt": coalesce(alt[_key == $locale][0].value, alt[_key == "en"][0].value)
    },
    // Metadata-only projections. See the note above this query.
    "excerpt": pt::text(
      coalesce(body[_key == $locale][0].value, body[_key == "en"][0].value)
    ),
    "ogImage": cover.asset->{
      url,
      "width": metadata.dimensions.width,
      "height": metadata.dimensions.height
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
