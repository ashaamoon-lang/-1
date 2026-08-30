import type { Metadata } from 'next'

import { env } from '@/lib/env'
import { localeFromPath } from '@/lib/i18n/paths'
import { ogLocale, routing } from '@/lib/i18n/routing'
import { routeAlternates } from '@/lib/seo/alternates'
import { BASE_URL, SITE } from '@/lib/seo/site'

/** Roughly where Google truncates a description in a result snippet. */
const DESCRIPTION_MAX_LENGTH = 155

/**
 * Trims prose to snippet length on a word boundary.
 *
 * For deriving a description from body copy when a page has no hand-written
 * one. A page that inherits the site-wide description is, to an answer
 * engine, indistinguishable from every other page — a real sentence from the
 * page's own content is worth more than a polished generic one.
 *
 * Returns `''` for empty input so callers can use `||` to fall through to
 * their own fallback rather than emitting an empty `description` tag.
 */
export function truncateDescription(
  text: string | null | undefined,
  maxLength: number = DESCRIPTION_MAX_LENGTH
): string {
  const collapsed = text?.replace(/\s+/g, ' ').trim()
  if (!collapsed) return ''
  if (collapsed.length <= maxLength) return collapsed

  const clipped = collapsed.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(' ')

  // A single word longer than the limit has no space to cut at; hard-clip it
  // rather than returning the whole untruncated string.
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

/**
 * Metadata Generation Utilities
 *
 * Helpers to generate consistent metadata across pages,
 * reducing duplication and ensuring SEO best practices.
 */

interface GenerateMetadataOptions {
  title?: string
  description?: string
  keywords?: string[]
  image?: {
    url?: string
    width?: number
    height?: number
    alt?: string
  }
  /**
   * The page's **localized** root-relative path — `/en/work/mural`, not
   * `/work/mural`.
   *
   * Required, and required in that exact form, because three separate tags
   * are derived from it: the canonical, `og:url`, and `og:locale`. When a
   * caller passed a locale-free template instead, all three went wrong at
   * once and only one of them was visible: `og:url` disagreed with the
   * canonical, and `og:locale` reported `en_US` on every Indonesian page
   * because `localeFromPath` found no prefix to read.
   *
   * `lib/i18n/paths.ts` names the distinction — a *template* is locale-free,
   * a *localized path* is what a browser requests. Build one with
   * `localizedPath(locale, template)`. It must be the same URL
   * `app/sitemap.ts` submits for the route; see `lib/seo/alternates.ts` for
   * why a canonical that disagrees with the sitemap is worse than none.
   */
  url: string
  siteName?: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

/**
 * Generate complete metadata object for pages
 *
 * @example
 * ```ts
 * export async function generateMetadata({ params }) {
 *   const page = await fetchPage(params.slug)
 *
 *   return generatePageMetadata({
 *     title: page.metadata?.title || page.title,
 *     description: page.metadata?.description,
 *     image: { url: page.metadata?.image?.asset?.url },
 *     url: localizedPath(locale, `/page/${params.slug}`),
 *     noIndex: page.metadata?.noIndex,
 *   })
 * }
 * ```
 */
export function generatePageMetadata(
  options: GenerateMetadataOptions
): Metadata {
  const {
    title,
    description,
    keywords,
    image,
    url,
    siteName = SITE.name,
    noIndex = false,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
  } = options

  // og:url and the canonical are the same URL by construction, derived from
  // one value. They were previously two expressions reading `url` differently,
  // and they drifted apart the moment locale prefixes existed.
  const fullUrl = `${BASE_URL}${url}`
  const pageLocale = localeFromPath(url)
  const imageUrl = image?.url ?? '/opengraph-image.png'
  const imageWidth = image?.width ?? 1200
  const imageHeight = image?.height ?? 630
  const imageAlt = image?.alt ?? title ?? siteName

  const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    keywords,
    alternates: routeAlternates(url),
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName,
      // Derived from the URL's own locale prefix rather than hardcoded.
      // `localeFromPath` returns null for unlocalized routes (/studio,
      // /llms.txt), which fall back to the default — those pages have no
      // language alternative to declare, which is also why `alternateLocale`
      // below is empty for them.
      locale: ogLocale(pageLocale ?? routing.defaultLocale),
      alternateLocale: pageLocale
        ? routing.locales.filter((l) => l !== pageLocale).map(ogLocale)
        : [],
      type,
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: imageWidth,
          height: imageHeight,
          alt: imageAlt,
        },
      ],
    },
  }

  if (env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
    metadata.other = { 'fb:app_id': env.NEXT_PUBLIC_FACEBOOK_APP_ID }
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    }
  }

  return metadata
}

/**
 * Generate metadata specifically for Sanity CMS pages
 *
 * @example
 * ```ts
 * import { draftMode } from 'next/headers'
 * import { sanityFetch } from '@/integrations/sanity/live'
 *
 * // 'use cache' is required: sanityFetch calls cacheTag() internally, which
 * // Cache Components only allow inside a 'use cache' boundary — see
 * // app/[locale]/articles/[slug]/page.tsx for the same pattern applied to a page.
 * async function fetchPage(
 *   slug: string,
 *   perspective: 'published' | 'drafts',
 *   stega: boolean
 * ) {
 *   'use cache'
 *   return sanityFetch({ query: pageQuery, params: { slug }, perspective, stega })
 * }
 *
 * async function fetchPageForRequest(slug: string) {
 *   const { isEnabled: isDraftMode } = await draftMode()
 *   return isDraftMode
 *     ? fetchPage(slug, 'drafts', true)
 *     : fetchPage(slug, 'published', false)
 * }
 *
 * export async function generateMetadata({ params }) {
 *   const { slug } = await params
 *   const { data } = await fetchPageForRequest(slug)
 *
 *   return generateSanityMetadata({
 *     document: data,
 *     // Localized, not `/sanity/${slug}` — see the `url` field's own note.
 *     url: localizedPath(locale, `/sanity/${slug}`),
 *   })
 * }
 * ```
 */
export function generateSanityMetadata(options: {
  // Fields are nullable to accept TypeGen query-result types directly
  // (projections type optional fields as `T | null`).
  document: {
    title?: string | null
    metadata?: {
      title?: string | null
      description?: string | null
      keywords?: string[] | null
      noIndex?: boolean | null
    } | null
    _updatedAt?: string | null
    publishedAt?: string | null
    /** Body prose used to derive a description when the editor left one blank. */
    excerpt?: string | null
  }
  /** Localized root-relative path — see {@link GenerateMetadataOptions.url}. */
  url: string
  type?: 'website' | 'article'
}): Metadata {
  const { document, url, type = 'website' } = options
  const metadata = document.metadata

  // Editors leave the SEO description empty far more often than they leave the
  // body empty, and a page with no description of its own inherits the
  // site-wide one — which makes every such page look identical to a crawler.
  const derivedDescription = truncateDescription(document.excerpt)

  if (!metadata) {
    // Fallback to basic metadata if none provided
    const fallbackOptions: GenerateMetadataOptions = { type, url }
    if (document.title) fallbackOptions.title = document.title
    if (derivedDescription) fallbackOptions.description = derivedDescription
    return generatePageMetadata(fallbackOptions)
  }

  // Bind to locals so control-flow narrowing strips the `null` before the
  // values reach generatePageMetadata (which expects `string`, not `string | null`).
  // Note: OG image is not derived from `metadata.image` — the queries don't
  // dereference the asset (`asset->{url}`), so generatePageMetadata's default
  // image is used. Add a resolved url to the query to wire a per-page OG image.
  const title = metadata.title ?? document.title
  const { description, keywords, noIndex } = metadata
  const { publishedAt, _updatedAt } = document

  const resolvedDescription = description || derivedDescription

  const pageOptions: GenerateMetadataOptions = { type, url }
  if (title) pageOptions.title = title
  if (resolvedDescription) pageOptions.description = resolvedDescription
  if (keywords) pageOptions.keywords = keywords
  if (noIndex != null) pageOptions.noIndex = noIndex
  if (publishedAt) pageOptions.publishedTime = publishedAt
  if (_updatedAt) pageOptions.modifiedTime = _updatedAt

  return generatePageMetadata(pageOptions)
}
