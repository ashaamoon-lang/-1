import type { MetadataRoute } from 'next'

import { getAdvertisedRoutes, STATIC_ROUTES } from '@/lib/seo/routes'
import { BASE_URL } from '@/lib/seo/site'

/**
 * Static routes are listed in `lib/seo/routes.ts` (`STATIC_ROUTES`) —
 * shared with `/llms.txt` so the two surfaces can't drift. A new static
 * route is added there and nowhere else — the catalog is the single source.
 * (Until Tahap 84 it also had to be added to `PAGES` in the `/ai` machine
 * view, a second list that could drift; that route was removed.)
 *
 * Everything past the static catalogue — the journal's entries, and the CMS's
 * pages and projects when Sanity is configured — arrives already expanded
 * from `getAdvertisedRoutes()`. A fresh clone with no CMS env set still gets
 * the journal, because those pages exist without one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // Already one entry per locale. A CMS slug is locale-free (`/work/rimbun`),
  // and the bare template is not a page — it 307s to whichever locale the
  // fetcher's `Accept-Language` implies — so a sitemap that emitted it would
  // submit a URL that only ever redirects, and one that disagrees with the
  // page's own canonical. `/llms.txt` and `/ai` do the expansion through the
  // same accessor, because for a while they each did their own and drifted.
  const cmsEntries: MetadataRoute.Sitemap = (await getAdvertisedRoutes()).map(
    (route) => ({
      url: `${BASE_URL}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })
  )

  return [...staticEntries, ...cmsEntries]
}
