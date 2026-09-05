import { type Practice, practiceTemplate } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/routing'

/**
 * The localized URL for one practice view.
 *
 * Its own module so `catalogue.tsx` and `lib/seo/route-catalog.ts` cannot
 * drift: a link that disagrees with the sitemap asks a crawler to index a URL
 * nothing points at. `lib/i18n/paths.ts` explains the template-versus-
 * localized-path distinction this composes.
 */
export function practiceHref(locale: Locale, value: Practice): string {
  return localizedPath(locale, practiceTemplate(value))
}

/**
 * The catalogue narrowed to one practice — Tahap 39.
 *
 * Deliberately a **different** address from `practiceHref` above, because the
 * two are different things and the site now says so: `/practice/consulting`
 * is a page *about* consulting, with a statement and its own circuit;
 * `/work?practice=consulting` is the catalogue with everything else hidden.
 * `docs/stages/TAHAP-15.md` §5.1 drew that line and this keeps it — one
 * subject still has one topic page, and the filter is not a second one.
 */
export function filteredWorkHref(locale: Locale, value: Practice): string {
  return `${localizedPath(locale, '/work')}?practice=${value}`
}
