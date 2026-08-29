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
 * callers tell a localized page apart from an unlocalized one (`/studio`,
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
