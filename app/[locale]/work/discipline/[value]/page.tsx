import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { Catalogue } from '@/app/[locale]/work/catalogue'
import {
  DISCIPLINES,
  disciplineTemplate,
  isDiscipline,
} from '@/lib/content/disciplines'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { generatePageMetadata } from '@/lib/utils/metadata'

/**
 * `/[locale]/work/discipline/[value]` — the catalogue narrowed to one
 * discipline.
 *
 * A page rather than a query string, for reasons recorded in
 * `../../catalogue.tsx`: under Cache Components a route that reads
 * `searchParams` must hide its content behind a Suspense boundary, and that
 * content then reaches the reader only through an inline script. Measured,
 * that meant `/en/work` showed no work at all with JavaScript off.
 *
 * The three values are prerendered whether or not the studio has published
 * anything under them. An empty one renders the catalogue's empty state, not
 * a 404 — "no murals yet" and "mural is not a thing we do" are different
 * claims and should not share a status code.
 */
interface DisciplinePageProps {
  params: Promise<{ value: string }>
}

/**
 * Static, complete and independent of the CMS.
 *
 * Unlike `work/[slug]`, this list is a compile-time constant, so it needs no
 * Sanity round trip, no `'use cache'` wrapper, and no empty-dataset sentinel —
 * it can never return zero results and trip the Cache Components rule that
 * "all `generateStaticParams` functions must return at least one result".
 */
export function generateStaticParams() {
  return DISCIPLINES.map((value) => ({ value }))
}

export default async function DisciplinePage({ params }: DisciplinePageProps) {
  if (!isConfigured('sanity')) notFound()

  const { value } = await params
  // `dynamicParams` defaults to true, so a hand-typed
  // `/en/work/discipline/sculpture` reaches this component. It is a URL that
  // names a category the studio does not have — a 404, not an empty grid.
  if (!isDiscipline(value)) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return <Catalogue locale={locale} discipline={value} />
}

export async function generateMetadata({ params }: DisciplinePageProps) {
  const { value } = await params
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const t = await getTranslations('workIndex')

  if (!isDiscipline(value)) {
    // Matches the `notFound()` above. Without this the 404 would inherit the
    // parent layout's title and be indexable under whatever was typed.
    return generatePageMetadata({
      title: t('title'),
      noIndex: true,
      url: localizedPath(locale, '/work'),
    })
  }

  return generatePageMetadata({
    title: t(`${value}Title`),
    description: t(`${value}Intro`),
    url: localizedPath(locale, disciplineTemplate(value)),
  })
}
