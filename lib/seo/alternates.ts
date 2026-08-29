import type { Metadata } from 'next'

import { localizedPath, templateFromLocalizedPath } from '@/lib/i18n/paths'
import { LOCALE_TAGS, routing } from '@/lib/i18n/routing'
import { markdownPathForRoute } from '@/lib/seo/markdown-path'
import { STATIC_ROUTES } from '@/lib/seo/route-catalog'

/**
 * Builds the `alternates` block for one route.
 *
 * Next.js merges metadata shallowly: a child segment that declares its own
 * `alternates` replaces the parent's entire object instead of merging into
 * it. So a page that set `alternates: { canonical: '/ai' }` also dropped the
 * `text/plain` link advertising `/llms.txt` — and `/ai` is the machine view,
 * the one route that most needs to point crawlers at the plain-text mirror.
 * Routing every page through this helper keeps the shared entries attached.
 *
 * `path` must be the same URL `app/sitemap.ts` submits for the route. A
 * canonical that disagrees with the sitemap asks a search engine to crawl
 * one URL and index another, and the engine picks — usually not the one you
 * wanted. Pass a root-relative path (`/articles/foo`); Next resolves it
 * against `metadataBase`.
 */
export function routeAlternates(path: string): Metadata['alternates'] {
  const hasMarkdownRepresentation = STATIC_ROUTES.some(
    (route) => route.path === path
  )

  // hreflang. Derived from the path's own locale prefix rather than passed in,
  // so every caller gets it for free and none can forget — the same reason
  // canonical lives here. Unlocalized routes (`/studio`, `/llms.txt`) have no
  // prefix, `templateFromLocalizedPath` returns null, and they correctly
  // advertise no alternates.
  //
  // Keys are BCP 47 tags, not the internal segment: `en-US`, not `en`. The
  // segment is a URL detail; hreflang is a language declaration, and search
  // engines read it as one.
  const template = templateFromLocalizedPath(path)
  const languages = template
    ? {
        ...Object.fromEntries(
          routing.locales.map((locale) => [
            LOCALE_TAGS[locale],
            localizedPath(locale, template),
          ])
        ),
        // x-default names the version served to a visitor whose language
        // matches none of ours. Omitting it makes engines guess.
        'x-default': localizedPath(routing.defaultLocale, template),
      }
    : undefined

  return {
    // Self-referential on every route. A single hardcoded canonical in a
    // layout is inherited by every child that doesn't override it, which
    // tells search engines the whole site is one duplicated page.
    canonical: path,
    ...(languages && { languages }),
    // Advertises the plain-text mirror via <link rel="alternate" type="text/plain">.
    types: {
      'text/plain': [{ url: '/llms.txt', title: 'llms.txt' }],
      ...(hasMarkdownRepresentation && {
        'text/markdown': [
          {
            url: markdownPathForRoute(path),
            title: `${path === '/' ? 'Home' : path} as Markdown`,
          },
        ],
      }),
    },
  }
}
