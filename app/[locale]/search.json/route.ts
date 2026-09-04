import { resolveJournalEntries } from '@/lib/content/journal-fallback'
import { buildSearchIndex, type SearchEntry } from '@/lib/content/search-index'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  journalEntriesQuery,
  projectsQuery,
} from '@/lib/integrations/sanity/queries'

/**
 * `/[locale]/search.json` — what the command palette searches.
 *
 * ## Why an endpoint rather than props
 *
 * The palette is loaded on first open and not before (see
 * `components/ui/command`), so the index must not travel with every page.
 * Passing it through the layout would put ~18 entries of prose into the
 * payload of every route on the site for a control most visits never open.
 * One fetch, on demand, cached.
 *
 * ## Why the proxy leaves it alone
 *
 * `proxy.ts` skips content negotiation for any path whose last segment
 * contains a dot (`FILE_EXTENSION`) — the same rule that already lets
 * `/llms.txt` and `/manifest.webmanifest` through untouched. So this route is
 * never treated as a page document and never negotiated into Markdown, and it
 * carries its locale in the path rather than in a header.
 *
 * ## `'use cache'` wraps the builder, not the handler
 *
 * The reason `app/llms.txt/route.ts` records, unchanged: a `'use cache'`
 * boundary serializes its return value, and a `Response` is not a plain
 * object. So the cached function returns the array and the handler wraps it.
 */

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

async function buildIndex(locale: Locale): Promise<SearchEntry[]> {
  'use cache'

  if (!isConfigured('sanity')) {
    return buildSearchIndex(locale, {
      projects: null,
      journal: resolveJournalEntries(locale, null),
    })
  }

  const [projects, journal] = await Promise.all([
    sanityFetch({
      query: projectsQuery,
      params: { locale },
      perspective: 'published',
      stega: false,
    }),
    sanityFetch({
      query: journalEntriesQuery,
      params: { locale },
      perspective: 'published',
      stega: false,
    }),
  ])

  /*
   * The published perspective only, and never draft mode.
   *
   * A palette is a navigation surface: every result must be a page a reader
   * can actually open. Draft documents have no published route, so offering
   * one would be offering a 404 with a title.
   *
   * No assertion is needed to hand the query result over: `SearchProject`
   * declares the fields it reads and nothing more, so TypeGen's richer type
   * satisfies it structurally. Tahap 26's lesson, applied on the way in
   * rather than after a lint rejection — a cast here would be claiming a
   * shape instead of naming the one this module actually needs.
   */
  return buildSearchIndex(locale, {
    projects: projects.data,
    journal: resolveJournalEntries(locale, journal.data),
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: requested } = await params
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return Response.json(await buildIndex(locale), {
    headers: {
      /*
       * Cached at the edge, revalidated in the background. The index changes
       * when the studio publishes, which is the same cadence the sitemap and
       * `/llms.txt` are cached at — and a palette one hour behind a new entry
       * is not a defect, it is the same staleness every other surface has.
       */
      'cache-control':
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
