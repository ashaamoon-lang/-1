import cn from 'clsx'
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
import { JsonLd } from '@/lib/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo/schemas'
import { SITE } from '@/lib/seo/site'
import { PracticeFilter } from '@/vault/blocks/practice-filter'
import { ProjectGrid } from '@/vault/blocks/project-grid'
import { Reveal } from '@/vault/motion/reveal'
import { TextReveal } from '@/vault/motion/text-reveal'

import { filteredWorkHref, practiceHref } from './hrefs'

import s from './page.module.css'

/*
 * The velocity field the plates' material reads, and nothing else.
 *
 * Opt-in for the reason `app/[locale]/page.tsx` records: a simulation with no
 * consumer still costs a render pass every frame and a window pointer
 * listener. Declared at module scope so the array identity is stable — a
 * fresh literal per render would re-subscribe the provider on every pass.
 */
const FLOWMAP_SIM: ('fluid' | 'flowmap')[] = ['flowmap']

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

  /*
   * The catalogue states what it contains — Tahap 38.
   *
   * `collectionPageSchema()` had been written, typed, exported and never
   * called, so the one page whose entire job is to list the work carried no
   * `ItemList` at all: an answer engine asking "what has this studio worked
   * on?" had to fetch and follow every card. Projects without a slug or a
   * title are dropped for the same reason `project-card` drops them — a row
   * that names nothing and links nowhere is worse in structured data than in
   * markup, because nothing renders to make its absence visible.
   */
  const listed = projects.flatMap((project) => {
    const slug = project.slug?.current
    if (!slug || !project.title) return []
    return [
      {
        name: project.title,
        url: `${SITE.url}${localizedPath(locale, `/work/${slug}`)}`,
      },
    ]
  })

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
      // The filtered catalogue, not the topic page — Tahap 39. `practiceHref`
      // still builds the latter and is still used, below, to send a reader
      // from the narrowed list to the page *about* what they narrowed to.
      href: filteredWorkHref(locale, value),
    })
  )

  return (
    <Wrapper
      theme="dark"
      /*
       * The catalogue carries the material layer as of Tahap 32.
       *
       * The home page shows a selection of the work with plates that answer
       * the pointer; this page shows **all** of it, through the same
       * `ProjectGrid`, and until now those plates were inert. A visitor who
       * pressed a plate on the home page and then opened the catalogue found
       * the same object had stopped responding — an inconsistency on the page
       * a prospective client spends the most time in.
       *
       * It is not free, and the number is written down rather than waved at:
       * `e2e/route-budget.e2e.ts` carries the measured cost and the ceiling
       * that was raised for it, deliberately. Phones and readers who ask for
       * reduced motion still download no 3D engine at all.
       */
      webgl
      simTypes={FLOWMAP_SIM}
      /*
       * The plates parallax as of Tahap 33, and a scrubbed ScrollTrigger has
       * to run inside Tempus or it renders a frame behind the scroll — the
       * ordering `components/layout/lenis` documents. `gsap` is what mounts
       * that bridge.
       */
      gsap
    >
      <JsonLd
        data={collectionPageSchema({
          name: practice ? t(`${practice}Title`) : t('title'),
          description: practice ? t(`${practice}Intro`) : t('intro'),
          url: `${SITE.url}${basePath}`,
          items: listed,
        })}
      />
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
          {/*
            The heading enters the way the home hero's does, rather than as
            one more block in the container's stagger — `docs/stages/TAHAP-23.md`.

            `key` is load-bearing as of Tahap 39, having been a guard on an
            unreachable path for eight stages. `TextReveal` hands its text to
            SplitText, which takes ownership of the rendered text nodes, so a
            changing string has to remount rather than update in place — and
            the string changes now, every time a chip narrows the list. The
            comment that used to sit here explained why the filtered branch
            never rendered; it renders.
          */}
          <TextReveal
            key={practice ?? 'all'}
            as="h1"
            split="lines"
            className="h1"
          >
            {practice ? t(`${practice}Title`) : t('title')}
          </TextReveal>
          <p data-reveal-item className={s.intro}>
            {practice ? t(`${practice}Intro`) : t('intro')}
          </p>
          {/*
            The narrowed catalogue points at the page *about* what it was
            narrowed to — Tahap 39, closing the circuit the other way.

            The chips send a reader from "what is this practice" to "what work
            is there"; without this, that trip is one-way. It renders only
            when a filter is applied, because on the unfiltered catalogue
            there is no single practice to be about.
          */}
          {practice && (
            <p data-reveal-item>
              <Link
                href={practiceHref(locale, practice)}
                className={cn('caption', s.aboutPractice)}
                data-press="practice"
                data-intent=""
              >
                {t('aboutPractice', { practice: t(practice) })}
              </Link>
            </p>
          )}
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
              material
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
