import { getTranslations } from 'next-intl/server'

import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { PRACTICES, type Practice } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/routing'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  practicesQuery,
  workIndexQuery,
} from '@/lib/integrations/sanity/queries'
import { PracticeFilter } from '@/vault/blocks/practice-filter'
import { ProjectGrid } from '@/vault/blocks/project-grid'
import { Reveal } from '@/vault/motion/reveal'

import { practiceHref } from './hrefs'

import s from './page.module.css'

/**
 * The catalogue body, shared by `/work` and `/work/practice/[value]`.
 *
 * ## Why the two routes are separate pages rather than one page and a query
 *
 * Tahap 8 built this as a single route reading `?practice=`, and Tahap 10
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
 * Path segments cost one reserved slug (`lib/content/practices.ts`) and buy:
 * every view fully server-rendered, `Cache-Control: s-maxage=31536000`, no
 * Suspense fallback, and three extra indexable landing pages per locale in
 * `sitemap.xml`.
 */

/**
 * `'use cache'` is required, not stylistic: `sanityFetch` calls `cacheTag()`
 * internally, and under Cache Components that is only legal inside a cached
 * function. Locale and practice are arguments so both are part of the key.
 *
 * Published perspective only, and no `draftMode()` — for the reasons set out
 * at length in `work/[slug]/page.tsx`. Reading the draft cookie is a
 * request-time access, and it would put this page straight back into the
 * dynamic hole the route shape above exists to escape.
 */
async function fetchCatalogue(locale: string, practice: Practice | null) {
  'use cache'
  const [projects, practices] = await Promise.all([
    sanityFetch({
      query: workIndexQuery,
      params: { locale, practice },
      perspective: 'published',
      stega: false,
    }),
    sanityFetch({
      query: practicesQuery,
      params: {},
      perspective: 'published',
      stega: false,
    }),
  ])
  return { projects: projects.data, practices: practices.data }
}

interface CatalogueProps {
  locale: Locale
  /** The practice this view is narrowed to, or `null` for everything. */
  practice: Practice | null
}

export async function Catalogue({ locale, practice }: CatalogueProps) {
  const [{ projects, practices }, t] = await Promise.all([
    fetchCatalogue(locale, practice),
    getTranslations('workIndex'),
  ])

  const basePath = localizedPath(locale, '/work')

  // Only offer a chip for a practice that has listed work behind it. An
  // option that always returns nothing is a dead end wearing a control's
  // clothes.
  // SAFETY: `practices` is typed as literal unions by TypeGen because the
  // query projects a closed schema list. Widening to `(string | null)[]` only
  // relaxes the element type for this membership check — the values are
  // compared, not mutated, and `PRACTICES` stays the authority on which
  // ones are offered.
  const present = practices as readonly (string | null)[]
  const available = PRACTICES.filter((value) => present.includes(value)).map(
    (value) => ({
      value,
      label: t(value),
      href: practiceHref(locale, value),
    })
  )

  return (
    <Wrapper theme="dark">
      <div className={s.page}>
        {/*
          The catalogue's own masthead reveals like every other block that
          enters the viewport. Its three lines stagger rather than arriving
          together — eyebrow, title, then the sentence that explains what the
          list is — which is the order they are read in.
        */}
        <Reveal as="header" className={s.header}>
          <p data-reveal-item className="caption">
            {t('eyebrow')}
          </p>
          <h1 data-reveal-item className="h1">
            {practice ? t(`${practice}Title`) : t('title')}
          </h1>
          <p data-reveal-item className={s.intro}>
            {practice ? t(`${practice}Intro`) : t('intro')}
          </p>
        </Reveal>

        {/*
          The filter is deliberately not revealed.

          It is a control, not content. `MOTION-SPEC.md` §9 treats a control
          as a pressable noun whose job is to answer INTENT and COMMIT — and
          a control that fades in is a control the reader cannot use yet. The
          masthead above it is prose and arrives; this is the first thing on
          the page anyone might click, and it is there immediately.
        */}
        <PracticeFilter
          className={s.filter}
          allLabel={t('all')}
          allHref={basePath}
          options={available}
          active={practice}
          label={t('filterLabel')}
        />

        {projects.length > 0 ? (
          <>
            <p className="caption">{t('count', { count: projects.length })}</p>
            {/*
            `catalogue`, not the default `editorial` layout. A work's `span`
            composes the home page's curated selection; applied to a full
            listing it leaves holes. `vault/blocks/project-grid` carries the
            measurement.
          */}
            <ProjectGrid
              projects={projects}
              layout="catalogue"
              className={s.grid}
            />
          </>
        ) : (
          /*
           * An empty result gets a sentence and a way out, not a blank
           * screen — the `ui-ux-pro-max` Empty States guideline, which asks
           * for "a helpful message and action".
           *
           * Reachable now in a way it was not before: a practice route is
           * prerendered for all three values whether or not the studio has
           * published anything under them, so `/en/work/practice/ai-data` on
           * a catalogue with no such work lands here. That is the right answer —
           * a 404 would say the practice does not exist, which is a
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
