import type { MetadataRoute } from 'next'

import {
  getCmsRoutes,
  localizedContentRoutes,
  STATIC_ROUTES,
} from '@/lib/seo/routes'
import { BASE_URL } from '@/lib/seo/site'

/**
 * Static routes are listed in `lib/seo/routes.ts` (`STATIC_ROUTES`) —
 * shared with `/llms.txt` so the two surfaces can't drift. New static
 * routes must be added there and to `PAGES` in `app/[locale]/ai/page.tsx`;
 * the machine view (`/ai`) has no link from the design, so crawlers only
 * discover it here.
 *
 * CMS-driven routes (`getCmsRoutes`) are appended when the Sanity
 * integration is configured; a fresh clone with no CMS env set gets the
 * static routes only.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cmsRoutes = await getCmsRoutes()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  // CMS routes arrive as locale-free templates (`/about`) because a slug is
  // shared across languages. Each one is emitted once per locale so the
  // sitemap advertises exactly the URLs that exist — and exactly the URLs
  // those pages canonicalize to, which is the invariant lib/seo/alternates.ts
  // depends on. Emitting the bare template instead would submit a URL that
  // only ever redirects. `/llms.txt` and `/ai` now share this expansion via
  // `localizedContentRoutes`, because for a while they did not.
  const cmsEntries: MetadataRoute.Sitemap = localizedContentRoutes(
    cmsRoutes
  ).map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticEntries, ...cmsEntries]
}
