import { getTranslations } from 'next-intl/server'

import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { DISCIPLINES, type Discipline } from '@/lib/content/disciplines'
import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/routing'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  disciplinesQuery,
  workIndexQuery,
} from '@/lib/integrations/sanity/queries'
import { DisciplineFilter } from '@/vault/blocks/discipline-filter'
import { ProjectGrid } from '@/vault/blocks/project-grid'

import { disciplineHref } from './hrefs'

import s from './page.module.css'

/**
 * The catalogue body, shared by `/work` and `/work/discipline/[value]`.
 *
 * ## Why the two routes are separate pages rather than one page and a query
 *
 * Tahap 8 built this as a single route reading `?discipline=`, and Tahap 10
 * §1.4 initially decided to keep that shape. Two build errors overturned it,
 * and both are reproducible:
 *
 *   - `searchParams` outside a `<Suspense>` fails the build outright under
 *     `cacheComponents` — *"Next.js encountered uncached or runtime data
 *     during prerendering"*.
 *   - `export const dynamic = 'force-dynamic'` is rejected too — *"Route
 *     segment config "dynamic" is not compatible with
 *     `nextConfig.cacheComponents`"*.
 *
 * So a route that reads a query string must put its content behind a Suspense
 * boundary, and content behind a Suspense boundary is streamed in and swapped
 * by an inline script. Measured on the built site: `/en/work` with JavaScript
 * disabled rendered its heading and the word *Loading*, and not one project.
 *
 * That is the exact failure `docs/AUDIT-2026-08.md` §2.1 was about.
 * `lib/seo/site.ts` instructs agents to browse `/en/work`, and an answer
 * engine fetching it over plain HTTP would have found an empty catalogue.
 *
 * Path segments cost one reserved slug (`lib/content/disciplines.ts`) and buy:
 * every view fully server-rendered, `Cache-Control: s-maxage=31536000`, no
 * Suspense fallback, and three extra indexable landing pages per locale in
 * `sitemap.xml`.
 */

/**
 * `'use cache'` is required, not stylistic: `sanityFetch` calls `cacheTag()`
 * internally, and under Cache Components that is only legal inside a cached
 * function. Locale and discipline are arguments so both are part of the key.
 *
 * Published perspective only, and no `draftMode()` — for the reasons set out
 * at length in `work/[slug]/page.tsx`. Reading the draft cookie is a
 * request-time access, and it would put this page straight back into the
 * dynamic hole the route shape above exists to escape.
 */
async function fetchCatalogue(locale: string, discipline: Discipline | null) {
  'use cache'
  const [projects, disciplines] = await Promise.all([
    sanityFetch({
      query: workIndexQuery,
      params: { locale, discipline },
      perspective: 'published',
      stega: false,
    }),
    sanityFetch({
      query: disciplinesQuery,
      params: {},
      perspective: 'published',
      stega: false,
    }),
  ])
  return { projects: projects.data, disciplines: disciplines.data }
}

interface CatalogueProps {
  locale: Locale
  /** The discipline this view is narrowed to, or `null` for everything. */
  discipline: Discipline | null
}

export async function Catalogue({ locale, discipline }: CatalogueProps) {
  const [{ projects, disciplines }, t] = await Promise.all([
    fetchCatalogue(locale, discipline),
    getTranslations('workIndex'),
  ])

  const basePath = localizedPath(locale, '/work')

  // Only offer a chip for a discipline that has listed work behind it. An
  // option that always returns nothing is a dead end wearing a control's
  // clothes.
  // SAFETY: `disciplines` is typed as literal unions by TypeGen because the
  // query projects a closed schema list. Widening to `(string | null)[]` only
  // relaxes the element type for this membership check — the values are
  // compared, not mutated, and `DISCIPLINES` stays the authority on which
  // ones are offered.
  const present = disciplines as readonly (string | null)[]
  const available = DISCIPLINES.filter((value) => present.includes(value)).map(
    (value) => ({
      value,
      label: t(value),
      href: disciplineHref(locale, value),
    })
  )

  return (
    <Wrapper theme="dark">
      <div className={s.page}>
        <header className={s.header}>
          <p className="caption">{t('eyebrow')}</p>
          <h1 className="h1">
            {discipline ? t(`${discipline}Title`) : t('title')}
          </h1>
          <p className={s.intro}>
            {discipline ? t(`${discipline}Intro`) : t('intro')}
          </p>
        </header>

        <DisciplineFilter
          className={s.filter}
          allLabel={t('all')}
          allHref={basePath}
          options={available}
          active={discipline}
          label={t('filterLabel')}
        />

        {projects.length > 0 ? (
          <>
            <p className="caption">{t('count', { count: projects.length })}</p>
            <ProjectGrid projects={projects} className={s.grid} />
          </>
        ) : (
          /*
           * An empty result gets a sentence and a way out, not a blank
           * screen — the `ui-ux-pro-max` Empty States guideline, which asks
           * for "a helpful message and action".
           *
           * Reachable now in a way it was not before: a discipline route is
           * prerendered for all three values whether or not the studio has
           * published anything under them, so `/en/work/discipline/mural` on
           * a catalogue with no murals lands here. That is the right answer —
           * a 404 would say the discipline does not exist, which is a
           * different claim from "no work under it yet".
           */
          <div className={s.empty}>
            <h2 className="h2">{t('emptyTitle')}</h2>
            <p className={s.intro}>{t('emptyBody')}</p>
            <Link href={basePath} className={s.emptyAction}>
              {t('emptyAction')}
            </Link>
          </div>
        )}
      </div>
    </Wrapper>
  )
}
