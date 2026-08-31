import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

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
 * ## Why it reads nothing from the request
 *
 * No `searchParams`, no `draftMode()`, no `<Suspense>`. That is what makes it
 * `○` static and fully present in the HTML for a reader or an agent that runs
 * no JavaScript. The filter lives at `/work/discipline/[value]` instead;
 * `catalogue.tsx` records the two build errors that forced the change.
 */
export default async function WorkPage() {
  if (!isConfigured('sanity')) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return <Catalogue locale={locale} discipline={null} />
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
