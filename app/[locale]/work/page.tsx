import { getTranslations } from 'next-intl/server'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  disciplinesQuery,
  workIndexQuery,
} from '@/lib/integrations/sanity/queries'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { DisciplineFilter } from '@/vault/blocks/discipline-filter'
import { ProjectGrid } from '@/vault/blocks/project-grid'

import s from './page.module.css'

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
 * ## Filtering on the server
 *
 * The discipline filter is a set of links and the narrowing happens in GROQ.
 * The reasoning is recorded in `docs/stages/TAHAP-8.md` §2 and in
 * `vault/blocks/discipline-filter`; the short version is that it makes the
 * filtered view a shareable URL, ships no client JavaScript, and keeps
 * working with JavaScript off.
 *
 * Reading `searchParams` makes this route `◐`, the same as its sibling CMS
 * routes.
 */

interface WorkPageProps {
  searchParams: Promise<{ discipline?: string | string[] }>
}

/**
 * `'use cache'` is required, not stylistic: `sanityFetch` calls `cacheTag()`
 * internally, and under Cache Components that is only legal inside a cached
 * function. Locale and discipline are arguments so both are part of the key.
 */
async function fetchWork(
  locale: string,
  discipline: string | null,
  perspective: 'published' | 'drafts',
  stega: boolean
) {
  'use cache'
  const [projects, disciplines] = await Promise.all([
    sanityFetch({
      query: workIndexQuery,
      params: { locale, discipline },
      perspective,
      stega,
    }),
    sanityFetch({ query: disciplinesQuery, params: {}, perspective, stega }),
  ])
  return { projects: projects.data, disciplines: disciplines.data }
}

async function fetchWorkForRequest(locale: string, discipline: string | null) {
  const { isEnabled: isDraftMode } = await draftMode()
  return isDraftMode
    ? fetchWork(locale, discipline, 'drafts', true)
    : fetchWork(locale, discipline, 'published', false)
}

/**
 * The disciplines the schema defines, in the order they are offered.
 *
 * Fixed rather than derived from the data so the chips do not reorder when the
 * catalogue changes; the query decides which of them appear at all.
 */
const DISCIPLINES = ['painting', 'mural', 'illustration'] as const
type Discipline = (typeof DISCIPLINES)[number]

function isDiscipline(value: string | undefined): value is Discipline {
  // SAFETY: `DISCIPLINES` is a readonly tuple of string literals. Widening it
  // to `readonly string[]` only relaxes the element type for `includes`,
  // which cannot accept the narrower union, and reads no property the tuple
  // does not have. Same shape as `isLocale` in `lib/i18n/routing.ts`.
  return (
    value !== undefined && (DISCIPLINES as readonly string[]).includes(value)
  )
}

/**
 * Reads `?discipline=` as one trusted value, or null.
 *
 * An unknown value resolves to null — the unfiltered view — rather than an
 * empty grid. A URL someone mistyped or a stale link should show the
 * catalogue, not an apology.
 */
function readDiscipline(raw: string | string[] | undefined): Discipline | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  return isDiscipline(value) ? value : null
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  if (!isConfigured('sanity')) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const discipline = readDiscipline((await searchParams).discipline)

  const [{ projects, disciplines }, t] = await Promise.all([
    fetchWorkForRequest(locale, discipline),
    getTranslations('workIndex'),
  ])

  const basePath = localizedPath(locale, '/work')

  // Only offer a chip for a discipline that has listed work behind it. An
  // option that always returns nothing is a dead end wearing a control's
  // clothes.
  // SAFETY: `disciplines` is typed as stega-wrapped literals because the
  // query can run with stega enabled in draft mode. Widening to `string[]`
  // only relaxes the element type for this membership check — the values
  // themselves are compared, not mutated, and `DISCIPLINES` is the authority
  // on which ones are offered.
  const present = disciplines as readonly (string | null)[]
  const available = DISCIPLINES.filter((value) => present.includes(value)).map(
    (value) => ({ value, label: t(value) })
  )

  return (
    <Wrapper theme="dark">
      <div className={s.page}>
        <header className={s.header}>
          <p className="caption">{t('eyebrow')}</p>
          <h1 className="h1">{t('title')}</h1>
          <p className={s.intro}>{t('intro')}</p>
        </header>

        <DisciplineFilter
          className={s.filter}
          allLabel={t('all')}
          options={available}
          active={discipline}
          basePath={basePath}
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
           * for "a helpful message and action". Reachable only via a
           * hand-edited URL today, since chips are offered for disciplines
           * that have work; it exists because that can stop being true the
           * moment the studio unlists something.
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
