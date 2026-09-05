import { defineQuery } from 'next-sanity'
import { z } from 'zod'

import { isConfigured } from '@/integrations/registry'
import { sanityFetch } from '@/integrations/sanity/live'
import { urlForReference } from '@/integrations/sanity/utils/link'
import { resolveJournalEntries } from '@/lib/content/journal-fallback'
import { localizedPath } from '@/lib/i18n/paths'
import { type Locale, routing } from '@/lib/i18n/routing'
import { MARKDOWN_HANDLER_PATH } from '@/lib/seo/markdown-path'
import { STATIC_ROUTE_TEMPLATES, STATIC_ROUTES } from '@/lib/seo/route-catalog'

// Both forms are re-exported: `STATIC_ROUTES` is the expanded, per-locale list
// that gets advertised (sitemap, llms.txt, hreflang), while
// `STATIC_ROUTE_TEMPLATES` is the locale-free list that CMS-slug deduplication
// compares against. See lib/i18n/paths.ts for why the distinction matters.
export { STATIC_ROUTE_TEMPLATES, STATIC_ROUTES }
export type { StaticRoute } from '@/lib/seo/route-catalog'

/**
 * Route enumeration shared by `app/sitemap.ts` and `app/llms.txt/route.ts` —
 * the sitemap and the machine-readable content list must never disagree
 * about which URLs exist, so both read from here instead of keeping their
 * own copies.
 */

export interface ContentRoute {
  path: string
  label: string
  lastModified: Date
}

/**
 * Routes with no CMS backing. `/ai` has no link from the design, so
 * `app/sitemap.ts` is the only place crawlers discover it — see
 * `app/[locale]/ai/page.tsx`, which reads the same catalog for the
 * human/agent-facing machine view.
 *
 * This list is what gets *advertised* — every entry here is emitted into
 * `sitemap.xml`/`llms.txt`. See `RESERVED_PATHS` below for routes that must
 * be excluded from CMS dedup without being advertised themselves.
 *
 * - `/cms` — `app/(chrome)/cms/[[...tool]]/page.tsx`, Sanity Studio.
 * - `/work` — `app/[locale]/work/page.tsx`, the catalogue added in Tahap 8.
 *   A project slugged `work` would otherwise shadow the page that lists it.
 * - `/agent-content` — the internal Markdown negotiation handler proxy.ts
 *   rewrites to (`app/agent-content/route.ts`); a CMS doc slugged
 *   `agent-content` would otherwise be advertised in the sitemap/`/ai` while
 *   direct requests to it still 404 (see `MACHINE_PATHS` in `proxy.ts`).
 *
 * Without this, a CMS document slugged `cms` or `work` would resolve to
 * `/cms` or `/work` via `urlForReference` and get emitted into the
 * sitemap/llms.txt, even though the real route at that path serves something
 * else entirely. `/sanity` used to be listed here for a wiring-tutorial route
 * Phase A deleted, so it blocked a legitimate slug for eight stages. (`/api` needs no entry: there's no page/route at that root
 * segment, so it already falls through to the catch-all untouched.)
 */
/** Static routes already advertised, so a CMS slug cannot duplicate one. */
const staticPaths = new Set(STATIC_ROUTE_TEMPLATES.map((route) => route.path))

/*
 * Paths a CMS slug may not claim.
 *
 * `/sanity` used to be here for a wiring-tutorial route that Phase A deleted,
 * so a work legitimately slugged `sanity` was blocked for a page that has not
 * existed for eight stages (`docs/AUDIT-2026-08.md` §Tier 4). `/work` is new
 * and real: the catalogue route added in Tahap 8 would otherwise be shadowed
 * by a project whose slug happened to be `work`.
 */
const RESERVED_PATHS = new Set(['/cms', '/work', MARKDOWN_HANDLER_PATH])

/**
 * Every document type with a `slug` — kept permissive (`nullable()` fields)
 * because this validates a hand-written query rather than a typegen'd one;
 * malformed documents are skipped per-entry in `getCmsRoutes` rather than
 * failing the whole fetch.
 */
const routableDocumentSchema = z.object({
  _type: z.enum(['page', 'project']),
  /*
   * Resolved to a plain string by the query's `select()`.
   *
   * A `project`'s title is an `internationalizedArray` (`[{_key, value}]`),
   * not a string, so projecting it raw made this parse fail on every project
   * — and because entries are skipped one at a time (deliberately, see below),
   * they vanished from the sitemap and /llms.txt with no error anywhere. The
   * label is English because these surfaces list locale-free templates; the
   * per-locale URLs are expanded by the sitemap itself.
   */
  title: z.string().nullable(),
  // A dot is a valid Sanity slug character but collides with proxy.ts's
  // FILE_EXTENSION heuristic (`/\/[^/]+\.[^/]+$/`): any dotted last path
  // segment is treated as a static asset and skips Markdown content
  // negotiation. Rejecting it here — same as any other malformed document —
  // keeps that heuristic correct for every routable document.
  slug: z
    .object({ current: z.string().refine((value) => !value.includes('.')) })
    .nullable(),
  _updatedAt: z.string(),
})

/*
 * `listed != false` excludes a work the studio has withdrawn.
 *
 * Not `listed == true`: documents written before the field existed have no
 * value at all, and treating those as listed is both the safe default and the
 * reason no migration is needed.
 *
 * This clause is why turning a work off now removes it from the sitemap,
 * `/llms.txt` and `/ai` as well as from the grid. Before it,
 * `docs/PANDUAN-STUDIO.md` §7 told the studio that unfeaturing hid a work
 * while all three surfaces kept advertising it.
 */
const routableContentQuery = defineQuery(`
  *[_type in ["page", "project"]
    && defined(slug.current)
    && (_type != "project" || listed != false)] {
    _type,
    slug,
    _updatedAt,
    "title": select(
      _type == "project" => title[_key == "en"][0].value,
      title
    )
  }
`)

/**
 * Turns the raw (`unknown`) Sanity query result into routes, skipping
 * malformed documents one at a time rather than failing the whole batch.
 * Pulled out of `getCmsRoutes` so the skip-per-entry behaviour is testable
 * without a network dependency.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- this IS the I/O boundary: the untyped Sanity result is validated per entry below
export function buildRoutesFromDocuments(data: unknown): ContentRoute[] {
  if (!Array.isArray(data)) return []

  const routes = new Map<string, ContentRoute>()

  for (const rawDoc of data) {
    // Validated per entry, not as a whole array: `z.array(...).safeParse`
    // fails closed on the FIRST malformed document, dropping every valid
    // route from the sitemap and `/llms.txt`. One bad document should only
    // cost that one document.
    const parsedDoc = routableDocumentSchema.safeParse(rawDoc)
    if (!parsedDoc.success) continue
    const doc = parsedDoc.data

    if (!doc.slug) continue

    const lastModified = new Date(doc._updatedAt)
    if (Number.isNaN(lastModified.getTime())) continue

    const path = urlForReference({
      linkType: 'internal',
      internalLink: { _type: doc._type, slug: doc.slug },
    })

    // `path === '#'` is unresolvable; a `staticPaths` hit means the document's
    // slug collides with an already-listed static route (e.g. a `page` with
    // slug `ai` resolves to `/ai`, which the static route already serves).
    // A `RESERVED_PATHS` hit means it collides with a route outside the
    // catch-all that isn't advertised in the sitemap at all (e.g. `studio`).
    if (path === '#' || staticPaths.has(path) || RESERVED_PATHS.has(path))
      continue

    routes.set(path, {
      path,
      label: doc.title ?? doc.slug.current,
      lastModified,
    })
  }

  return [...routes.values()]
}

export interface CmsRoutesResult {
  routes: ContentRoute[]
  /**
   * True when the last fetch attempt failed (Sanity unreachable) rather
   * than the CMS genuinely having zero published `page`/`project`
   * documents. `getCmsRoutes` collapses both cases to `[]` on purpose —
   * sitemap/llms.txt/`/ai` must always respond, degraded or not — but the
   * Markdown handler needs to tell them apart to avoid 404ing a route that
   * would exist once the outage clears.
   */
  degraded: boolean
}

/**
 * Every published `page`/`project` document, resolved to the same URL
 * `urlForReference` (`@/integrations/sanity/utils/link`) uses for internal
 * links elsewhere in the app — so the sitemap and `/llms.txt` can never
 * disagree with on-page navigation about where a document lives.
 *
 * Returns `{ routes: [], degraded: false }` when Sanity isn't configured (a
 * fresh clone's default state): no fetch runs, and callers degrade to
 * `STATIC_ROUTES` only.
 *
 * `'use cache'` is required: `sanityFetch` calls `cacheTag()` internally,
 * which Cache Components (`cacheComponents: true`) only allows inside a
 * `'use cache'` boundary — see `app/[locale]/[...slug]/page.tsx` for
 * the same constraint applied to a page-level fetch. `perspective`/`stega`
 * are hardcoded to the published, non-stega variant: crawlers never see
 * draft content, so there's no request-level (draft mode) state to branch
 * on here, unlike a rendered page.
 */
async function fetchCmsRoutesResult(): Promise<CmsRoutesResult> {
  'use cache'

  if (!isConfigured('sanity')) return { routes: [], degraded: false }

  // A schema-valid env (`isConfigured`) doesn't guarantee the project/dataset
  // it points to actually exists or is reachable — `sanityFetch` throws on a
  // Sanity API error (wrong project ID, deleted dataset, network failure).
  // Crawlers depend on `sitemap.xml`/`llms.txt` always responding, even for
  // the static routes, so a broken CMS connection degrades to no CMS routes
  // instead of taking the whole response down.
  let data: unknown
  try {
    ;({ data } = await sanityFetch({
      query: routableContentQuery,
      perspective: 'published',
      stega: false,
    }))
  } catch (error) {
    console.error(
      '[seo/routes] Sanity fetch failed, omitting CMS routes:',
      error
    )
    return { routes: [], degraded: true }
  }

  return { routes: buildRoutesFromDocuments(data), degraded: false }
}

/** Graceful-empty-on-failure accessor for sitemap.xml, llms.txt, and /ai. */
/**
 * Expands locale-free CMS templates into the URLs the site actually serves.
 *
 * `getCmsRoutes` returns templates (`/work/rimbun`) because a slug is shared
 * across languages. Every surface that *advertises* a route has to expand it
 * — `localePrefix` is 'always', so the bare template is not a page: it 307s
 * to whichever locale the visitor's `Accept-Language` picks.
 *
 * `app/sitemap.ts` did this inline and correctly. `/llms.txt` and
 * `app/[locale]/ai/page.tsx` did not, and shipped `https://…/work/rimbun`
 * for every artwork — a URL that appears in no sitemap and is no page's
 * canonical, on the two surfaces whose entire job is handing machines the
 * canonical address. Extracted here so the three cannot drift again.
 *
 * Pass `locale` to expand for one locale (the `/ai` page, which is itself
 * locale-scoped); omit it for every locale (`/llms.txt` and the sitemap,
 * which are single documents covering the whole site).
 */
export function localizedContentRoutes(
  routes: readonly ContentRoute[],
  locale?: Locale
): ContentRoute[] {
  const locales = locale ? [locale] : routing.locales

  return routes.flatMap((route) =>
    locales.map((each) => ({
      ...route,
      path: localizedPath(each, route.path),
    }))
  )
}

export async function getCmsRoutes(): Promise<ContentRoute[]> {
  return (await fetchCmsRoutesResult()).routes
}

/**
 * The journal's entries, as advertisable routes — Tahap 38.
 *
 * ## The defect this closes
 *
 * `routableContentQuery` above covers `page` and `project` only, and
 * `STATIC_ROUTE_TEMPLATES` carries `/journal` but none of its children. So
 * six real URLs — three entries in two languages — were absent from
 * `sitemap.xml`, `/llms.txt` and `/ai` while being present in the search
 * palette and reachable by a reader. Measured before this existed: the string
 * `/journal/` appeared **once** in the sitemap, for the index.
 *
 * ## Why the labels are localized here and the CMS's are not
 *
 * `localizedContentRoutes` expands a path across locales; it cannot translate
 * a label, because a CMS document's title arrives as one string from one
 * projection. These entries carry both languages already, so the label is
 * resolved per locale rather than left English — which is what
 * `/id/ai` needs, and what it still does not get for projects.
 *
 * ## The gap this leaves, stated rather than hidden
 *
 * `resolveJournalEntries(locale, null)` returns the scaffolding, and the entry
 * route reads the same scaffolding (`fallbackEntry`), so the two agree today
 * and every advertised URL resolves. When the studio publishes real entries,
 * **both** have to start reading the CMS together — advertising CMS slugs
 * while the route still serves the fallback would put 404s in the sitemap.
 * `app/[locale]/journal/[slug]/page.tsx` already records that gap as open;
 * this is the second place it now has to be closed.
 */
export function journalContentRoutes(locale?: Locale): ContentRoute[] {
  const locales = locale ? [locale] : routing.locales

  return locales.flatMap((each) =>
    resolveJournalEntries(each, null).map((entry) => ({
      path: localizedPath(each, `/journal/${entry.slug}`),
      label: entry.title,
      // The entry's own date. An `Invalid Date` here would serialize as an
      // empty `<lastmod>` and invalidate the whole sitemap entry, so a
      // malformed one falls back to now rather than being emitted broken.
      lastModified: Number.isNaN(new Date(entry.date).getTime())
        ? new Date()
        : new Date(entry.date),
    }))
  )
}

/**
 * Everything beyond the static catalogue that a machine surface advertises,
 * already expanded to real URLs.
 *
 * The sitemap, `/llms.txt` and `/ai` all call this and nothing else, which is
 * the point: the three used to assemble their own lists and drifted twice —
 * once over locale expansion (`localizedContentRoutes`' own doc comment) and
 * once over the journal, which reached all three only when it was added here.
 *
 * Pass `locale` for a surface that is itself locale-scoped (`/ai`); omit it
 * for the two single documents that cover the whole site.
 */
export async function getAdvertisedRoutes(
  locale?: Locale
): Promise<ContentRoute[]> {
  return [
    ...journalContentRoutes(locale),
    ...localizedContentRoutes(await getCmsRoutes(), locale),
  ]
}

/** Outage-aware accessor — see `CmsRoutesResult.degraded`. Used by markdown-document.ts. */
export async function getCmsRoutesResult(): Promise<CmsRoutesResult> {
  return fetchCmsRoutesResult()
}
