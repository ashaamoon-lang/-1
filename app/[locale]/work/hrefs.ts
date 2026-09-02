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
