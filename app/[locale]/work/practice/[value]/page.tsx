import { permanentRedirect } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import {
  PRACTICES,
  isPractice,
  practiceTemplate,
} from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'

/**
 * `/[locale]/work/practice/[value]` — kept only to redirect.
 *
 * ## Why this file still exists
 *
 * Until Tahap 15 this was the catalogue narrowed to one practice. A practice
 * now has a page of its own at `/practice/<value>` that carries the same work
 * plus what the filtered listing could never say — what the practice *is*.
 *
 * Leaving both would give one subject two URLs: an answer engine would have
 * to pick, a reader would find two doors to the same room, and the sitemap
 * would advertise a listing that duplicates a page. So this one redirects,
 * permanently, and `lib/content/practices.ts` is the single place that
 * decides where to.
 *
 * ## Why a route file rather than a `redirects()` entry
 *
 * `next.config.ts` redirects run in middleware, before the locale segment has
 * been resolved, so the rule would have to re-implement the locale prefixing
 * that `lib/i18n/paths.ts` already owns. Here the locale is a root param and
 * the destination composes the same helper every link on the site uses.
 *
 * ## Why 308 and not 307
 *
 * The move is permanent and the method must not change: a crawler that has
 * indexed the old URL should transfer its signals to the new one rather than
 * keep both. `permanentRedirect` is the App Router's 308.
 */

interface RedirectProps {
  params: Promise<{ value: string }>
}

/**
 * The same three values the old route prerendered. Keeping them means the
 * redirect is static rather than a dynamic miss on every crawl of a URL that
 * is still linked from elsewhere on the internet.
 */
export function generateStaticParams() {
  return PRACTICES.map((value) => ({ value }))
}

/**
 * `permanentRedirect` under `typedRoutes: true`.
 *
 * The destination is composed at runtime by `localizedPath`, so its type is
 * `string` while the parameter wants the generated `Route` union. Every path
 * this function is given is one the app prerenders — `/en/practice/consulting`
 * and its five siblings, from `generateStaticParams` above — but a composed
 * string is exactly what `typedRoutes` cannot follow.
 *
 * `components/ui/link` resolves the same tension the same way
 * (`href as ComponentProps<typeof NextLink>['href']`), which is why this is
 * an idiom here rather than a one-off.
 */
function redirectTo(path: string): never {
  // SAFETY: `path` always comes from `localizedPath` composed with either
  // `/work` or `practiceTemplate(...)`. Both are routes this file's own
  // `generateStaticParams` prerenders, so the string is a real route; only
  // the composition hides that from the type.
  permanentRedirect(path as Parameters<typeof permanentRedirect>[0])
}

export default async function PracticeCatalogueRedirect({
  params,
}: RedirectProps) {
  const { value } = await params
  const requested = await localeRootParam()
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale

  // A hand-typed practice the agency does not have goes to the catalogue
  // rather than to a 404 the reader cannot act on: they asked for work, and
  // `/work` is where all of it is.
  if (!isPractice(value)) redirectTo(localizedPath(locale, '/work'))

  redirectTo(localizedPath(locale, practiceTemplate(value)))
}
