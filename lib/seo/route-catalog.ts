import type { MetadataRoute } from 'next'

import { localizedPath } from '@/lib/i18n/paths'
import { type Locale, routing } from '@/lib/i18n/routing'
import { SITE } from '@/lib/seo/site'

export interface StaticRoute {
  path: string
  label: string
  description: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

/** A {@link StaticRoute} that has been expanded to one concrete locale. */
export interface LocalizedStaticRoute extends StaticRoute {
  /** The locale-free path this entry was expanded from (`/`, `/ai`). */
  template: string
  locale: Locale
}

/**
 * Starter-owned pages that always exist, independent of an optional CMS.
 *
 * These are **templates**: locale-free paths. They are what deduplication
 * against CMS slugs compares, since a CMS slug is locale-free too. The
 * emitted, per-locale form is {@link STATIC_ROUTES} below — see
 * `lib/i18n/paths.ts` for why the two are deliberately kept distinct.
 */
export const STATIC_ROUTE_TEMPLATES: readonly StaticRoute[] = [
  {
    path: '/',
    label: 'Home',
    description: SITE.description,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    path: '/ai',
    label: 'Agent index',
    description:
      'Server-rendered studio facts, every page link, and guidance for agents handling a commission enquiry.',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
]

/**
 * Every static route, expanded across every locale — `/en`, `/id`, `/en/ai`,
 * `/id/ai`.
 *
 * This is what gets *advertised*: the sitemap, `/llms.txt`, the machine view,
 * and the Markdown-representation lookup in `lib/seo/alternates.ts` all read
 * it. Because `localePrefix` is 'always', each entry is also the page's one
 * canonical URL, which is the invariant `alternates.ts` requires — a canonical
 * that disagrees with the sitemap asks a search engine to crawl one URL and
 * index another.
 */
export const STATIC_ROUTES: readonly LocalizedStaticRoute[] =
  routing.locales.flatMap((locale) =>
    STATIC_ROUTE_TEMPLATES.map((route) => ({
      ...route,
      template: route.path,
      locale,
      path: localizedPath(locale, route.path),
    }))
  )
