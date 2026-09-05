import { type Locale, isLocale } from './routing'

/**
 * Path helpers shared by routing and SEO.
 *
 * Two vocabularies exist in this codebase and conflating them is the easy
 * mistake:
 *
 * - a **template** is locale-free (`/`, `/ai`, `/work/mural`). It is what the
 *   route catalogue and CMS slugs deal in, and what deduplication compares.
 * - a **localized path** is what a browser actually requests (`/en`,
 *   `/id/ai`). It is what the sitemap emits and what a canonical URL must be.
 *
 * `localePrefix` is 'always', so every localized path carries a prefix and
 * there is exactly one canonical form per page — the property
 * `lib/seo/alternates.ts` depends on.
 */

/** `('en', '/ai')` -> `/en/ai`; `('en', '/')` -> `/en`. */
export function localizedPath(locale: Locale, template: string): string {
  if (template === '/') return `/${locale}`
  return `/${locale}${template}`
}

/**
 * Inverse of {@link localizedPath}: `/en/ai` -> `/ai`, `/en` -> `/`.
 *
 * Returns `null` when the path carries no known locale prefix, which is how
 * callers tell a localized page apart from an unlocalized one (`/cms`,
 * `/llms.txt`) rather than guessing from its shape.
 */
export function templateFromLocalizedPath(path: string): string | null {
  const [, maybeLocale, ...rest] = path.split('/')
  if (!isLocale(maybeLocale)) return null
  const template = `/${rest.join('/')}`
  return template === '/' ? '/' : template.replace(/\/$/, '')
}

/** The locale a path is served under, or `null` if it carries no prefix. */
export function localeFromPath(path: string): Locale | null {
  const [, maybeLocale] = path.split('/')
  return isLocale(maybeLocale) ? maybeLocale : null
}

/**
 * Route prefixes that are never served under a locale.
 *
 * This is the list a *link* needs, and it is deliberately wider than
 * `proxy.ts`'s `NON_LOCALIZED_PREFIXES`. Those two are not duplicates:
 *
 *  - `proxy.ts` runs after several upstream guards have already excluded
 *    `/api/*`, `/agent-content` and dotted paths, so its own list only has to
 *    name what nothing else catches — `/cms`. Its doc comment says so.
 *  - a link has no upstream guard. `<Link href="/api/draft-mode/enable">`
 *    renders in one pass, and if it comes out as `/en/api/...` the request
 *    404s.
 *
 * `proxy.test.ts` asserts the proxy's list stays a subset of this one, so the
 * two can never contradict each other even though they differ in width.
 */
export const UNLOCALIZED_ROUTE_PREFIXES = [
  /*
   * Sanity Studio. `/cms` since Tahap 38, and the rename is the whole point:
   * while this list said `/studio`, `components/ui/link` correctly refused to
   * localize `/studio` — and `/[locale]/studio` is a real public page, so
   * every link to it rendered unprefixed and landed on the CMS.
   */
  '/cms',
  '/api',
  '/agent-content',
] as const

/**
 * A dotted last segment — `/llms.txt`, `/sitemap.xml`, `/icon.png`.
 *
 * The same heuristic `proxy.ts` applies: anything with a file extension is a
 * static endpoint, not a page, and prefixing it produces a 404. The Sanity
 * schema forbids dots in slugs (see `schemas/page.ts`) precisely so a real
 * page can never look like one of these.
 */
const FILE_EXTENSION = /\/[^/]+\.[^/]+$/

/** Whether a path is a page this app serves under a locale prefix. */
export function isLocalizableRoute(pathname: string): boolean {
  if (!pathname.startsWith('/')) return false
  if (FILE_EXTENSION.test(pathname)) return false
  return !UNLOCALIZED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
