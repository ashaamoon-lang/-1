import type { MetadataRoute } from 'next'

import {
  PRACTICES,
  type Practice,
  practiceTemplate,
} from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { type Locale, routing } from '@/lib/i18n/routing'
import { type Localized, SITE } from '@/lib/seo/site'

export interface StaticRoute {
  path: string
  /**
   * Both localized, because these strings are read by people and by answer
   * engines: they are what `/llms.txt`, `/[locale]/ai` and the Markdown
   * representations print next to each link. Leaving them English-only made
   * `/id/ai` an Indonesian page listing English descriptions of its own
   * pages — see `lib/seo/site.ts` for the same split applied to entity copy.
   */
  label: Localized<string>
  description: Localized<string>
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

/**
 * A {@link StaticRoute} expanded to one concrete locale, with its prose
 * already resolved to that language.
 */
export interface LocalizedStaticRoute extends Omit<
  StaticRoute,
  'label' | 'description'
> {
  label: string
  description: string
  /** The locale-free path this entry was expanded from (`/`, `/ai`). */
  template: string
  locale: Locale
}

/**
 * Starter-owned pages that always exist, independent of an optional CMS.
 *
 * These are **templates**: locale-free paths. They are what deduplication
 * against CMS slugs compares, since a CMS slug is locale-free too. The
 * emitted, per-locale form is {@link STATIC_ROUTES} below — see
 * `lib/i18n/paths.ts` for why the two are deliberately kept distinct.
 */
/*
 * Labels and descriptions for the practice views.
 *
 * Deliberately not read from `messages/*.json`. This catalogue feeds
 * `/llms.txt`, `/ai` and the sitemap, all of which are assembled outside any
 * request and therefore outside next-intl's locale context; `SITE` in
 * `lib/seo/site.ts` is hardcoded for the same reason and says so. The rendered
 * page's own `<h1>` does come from the message files, which is why these read
 * as descriptions of a listing rather than as page titles.
 */
const PRACTICE_LABELS = {
  consulting: { en: 'Consulting', id: 'Konsultasi' },
  'ai-data': { en: 'AI and data', id: 'AI dan data' },
  commission: { en: 'Commissioned work', id: 'Karya pesanan' },
} satisfies Record<Practice, Localized<string>>

const PRACTICE_DESCRIPTIONS = {
  consulting: {
    en: 'Consulting engagements — strategy, architecture and the decisions that come before a build.',
    id: 'Penugasan konsultasi — strategi, arsitektur, dan keputusan yang datang sebelum pembangunan.',
  },
  'ai-data': {
    en: 'AI and data work — evaluation, pipelines and systems that have to hold up in production.',
    id: 'Pekerjaan AI dan data — evaluasi, pipeline, dan sistem yang harus bertahan di produksi.',
  },
  commission: {
    en: 'Commissioned work — scoped, paid engagements delivered to a brief.',
    id: 'Karya pesanan — penugasan berbayar dengan lingkup jelas, dikerjakan sesuai brief.',
  },
} satisfies Record<Practice, Localized<string>>

export const STATIC_ROUTE_TEMPLATES: readonly StaticRoute[] = [
  {
    path: '/',
    label: { en: 'Home', id: 'Beranda' },
    description: SITE.description,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    path: '/ai',
    label: { en: 'Agent index', id: 'Indeks untuk agen' },
    description: {
      en: 'Server-rendered agency facts, every page link, and guidance for agents handling an enquiry.',
      id: 'Fakta agency yang dirender di server, tautan ke seluruh halaman, dan panduan untuk agen yang menangani permintaan masuk.',
    },
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    path: '/studio',
    label: { en: 'Studio', id: 'Studio' },
    description: {
      en: 'How the studio scopes, decides and delivers, the practices it covers, and the colophon for this site.',
      id: 'Bagaimana studio ini menentukan lingkup, memutuskan, dan mengirim, praktik yang dicakupnya, serta kolofon situs ini.',
    },
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    path: '/work',
    label: { en: 'Work', id: 'Karya' },
    description: {
      en: 'The full catalogue of completed engagements, with client, year, engagement and scope for each.',
      id: 'Katalog lengkap penugasan yang sudah selesai, lengkap dengan klien, tahun, bentuk keterlibatan, dan lingkupnya.',
    },
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  /*
   * One entry per practice.
   *
   * These are not filter permutations of `/work` — they are `○` static pages
   * with their own `<h1>`, their own description and their own canonical, and
   * they are the pages that should rank for "commissioned mural" rather than
   * the generic index. `app/[locale]/work/catalogue.tsx` records why the
   * filter is a route at all instead of `?practice=`.
   *
   * Generated from the same constant the route's `generateStaticParams` uses,
   * so the sitemap cannot list a view that is not built, or omit one that is.
   */
  ...PRACTICES.map((value): StaticRoute => ({
    path: practiceTemplate(value),
    label: PRACTICE_LABELS[value],
    description: PRACTICE_DESCRIPTIONS[value],
    changeFrequency: 'weekly',
    priority: 0.7,
  })),
]

/**
 * Every static route, expanded across every locale — `/en`, `/id`, `/en/ai`,
 * `/id/ai`.
 *
 * This is what gets *advertised*: the sitemap, `/llms.txt`, the machine view,
 * and the Markdown-representation lookup in `lib/seo/alternates.ts` all read
 * it. Because `localePrefix` is 'always', each entry is also the page's one
 * canonical URL, which is the invariant `alternates.ts` requires — a canonical
 * that disagrees with the sitemap asks a search engine to crawl one URL and
 * index another.
 */
export const STATIC_ROUTES: readonly LocalizedStaticRoute[] =
  routing.locales.flatMap((locale) =>
    STATIC_ROUTE_TEMPLATES.map((route) => ({
      ...route,
      label: route.label[locale],
      description: route.description[locale],
      template: route.path,
      locale,
      path: localizedPath(locale, route.path),
    }))
  )
