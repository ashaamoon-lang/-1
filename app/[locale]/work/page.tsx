import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { isPractice } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { generatePageMetadata } from '@/lib/utils/metadata'

import { Catalogue } from './catalogue'

/**
 * `/[locale]/work` — the full catalogue.
 *
 * ## Why this route had to exist
 *
 * `lib/seo/site.ts` told every agent and answer engine to "browse the work at
 * /en/work", `/llms.txt` and `/ai` repeated it, and the route was a soft-404
 * — a 200 response rendering a not-found page, so even a status check passed.
 * Meanwhile a work that was not `featured` had no entry point for a human at
 * all: the home page showed a selection, and nothing showed the rest
 * (`docs/AUDIT-2026-08.md` §2.1 and §2.2).
 *
 * ## It reads `?practice=` again, and the measurement that allows it
 *
 * Tahap 10 removed the query string, and `catalogue.tsx` records why: under
 * `cacheComponents`, `searchParams` outside a `<Suspense>` failed the build,
 * `dynamic = 'force-dynamic'` was rejected, and content behind a Suspense
 * boundary is swapped in by an inline script — so `/en/work` with JavaScript
 * disabled rendered its heading, the word *Loading*, and **zero projects**.
 *
 * `export const instant = false` did not exist then. It is a different
 * mechanism from `force-dynamic`, and Tahap 39 measured what it changes.
 * Production build, JavaScript **off**:
 *
 * | URL | characters | `<h1>` | project links |
 * | --- | ---------: | ------ | ------------: |
 * | `/en/work` | 813 | `Work` | 6 |
 * | `/en/work?practice=consulting` | **612** | **`Consulting`** | **2** |
 * | `/en/work?practice=nonsense` | 813 | `Work` | 6 |
 *
 * Build green, no Suspense, no *Loading*. Tahap 10's failure does not
 * reproduce, so the filter can be a filter again — and the chips can finally
 * show which one is selected, which they never could while this file
 * hardcoded `practice={null}`.
 *
 * ## What it costs, said plainly
 *
 * The route moves from `○` to `ƒ`, and its `Cache-Control` becomes
 * `private, no-store`. Two URLs — `/en/work` and `/id/work` — stop being
 * CDN-cacheable. The Sanity read stays inside `'use cache'`, so what repeats
 * per request is the React render, not the network call.
 *
 * `e2e/response-headers.e2e.ts` asserted the opposite, on purpose ("the
 * assertion that the query string does not come back"). That assertion is
 * **moved rather than deleted**: `/work` may be dynamic, but it must render
 * its whole catalogue without JavaScript, filtered or not — the property the
 * cache header was standing in for.
 *
 * The three `/practice/<value>` pages are untouched: still `○`, still
 * separately indexable, still topic pages rather than filter permutations.
 * `docs/stages/TAHAP-15.md` §5.1's argument survives intact.
 */
export const instant = false

interface WorkPageProps {
  searchParams: Promise<{ practice?: string | string[] }>
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  if (!isConfigured('sanity')) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const { practice } = await searchParams
  /*
   * An unknown value falls back to the whole catalogue rather than 404ing.
   *
   * `?practice=sculpture` is a request that cannot be met, not a page that is
   * missing — the distinction `app/[locale]/practice/[value]/page.tsx` makes
   * in the other direction, where a bad *segment* really is a 404 because it
   * names a practice the studio does not have.
   *
   * `Array.isArray` rather than a `typeof` check: `?practice=a&practice=b`
   * arrives as an array, `isPractice` takes a single value, and the project's
   * own lint rule treats a runtime `typeof` as a smell worth justifying.
   * There is nothing to justify here — a repeated key is not a selection.
   */
  const requestedPractice = Array.isArray(practice) ? undefined : practice
  const active = isPractice(requestedPractice) ? requestedPractice : null

  return <Catalogue locale={locale} practice={active} />
}

export async function generateMetadata() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const t = await getTranslations('workIndex')

  return generatePageMetadata({
    title: t('title'),
    description: t('intro'),
    // Localized, not the bare template: canonical, og:url and og:locale all
    // come from this one string. See `lib/utils/metadata.ts`.
    url: localizedPath(locale, '/work'),
  })
}
