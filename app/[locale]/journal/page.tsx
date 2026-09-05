import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { draftMode } from 'next/headers'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import {
  type JournalEntry,
  resolveJournalEntries,
} from '@/lib/content/journal-fallback'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { journalEntriesQuery } from '@/lib/integrations/sanity/queries'
import { JsonLd } from '@/lib/seo/json-ld'
import { collectionPageSchema } from '@/lib/seo/schemas'
import { SITE } from '@/lib/seo/site'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { Reveal } from '@/vault/motion/reveal'
import { TextReveal } from '@/vault/motion/text-reveal'

import { JournalIndexRows, type JournalRow } from './index-rows'

import s from './page.module.css'

/**
 * The journal index — what the studio has written, newest first.
 *
 * ## Where the entries come from
 *
 * The CMS when it has any, `lib/content/journal-fallback.ts` when it does not,
 * and **all or nothing** — merging the two would put scaffolding articles
 * beside the studio's real ones with nothing on the page to tell a reader
 * which is which. `journal-fallback.test.ts` asserts the precedence rather
 * than leaving it to be read out of the code.
 *
 * Nothing was written into the dataset to make this page renderable. That
 * decision, and the reasoning, is `lib/content/home-fallback.ts`'s, taken
 * again unchanged: the alternatives were a blank page or invented articles in
 * a studio's live content library.
 *
 * ## Motion
 *
 * `TextReveal` on the `h1` — the site's entrance vocabulary — and one
 * choreographed moment, `journal-index`, which lives in `index-rows.tsx`.
 *
 * It shipped in Tahap 26 with **no** moment, and Tahap 27 measured what that
 * meant: all four reveal items sat above the fold, so the entrance fired once
 * on the first frame and the three rows reported `1.00 1.00 1.00` at every
 * scroll position afterwards. On a page whose entire content is three
 * headlines, that was the whole experience of it.
 *
 * The moment reuses `useActiveInSequence` rather than introducing a mechanism
 * — the same one the studio page's process uses. `MOTION-SPEC.md` §9.5 allows
 * two per page; this uses one.
 *
 * The summaries are **not** hidden behind hover. An index whose content only
 * appears when pointed at cannot be used with a keyboard and cannot be read
 * on a touch screen; hover and focus add the acknowledgement the site's
 * interaction grammar already defines, and nothing more.
 */

const fetchEntries = async (
  locale: Locale,
  perspective: 'published' | 'drafts',
  stega: boolean
) => {
  'use cache'
  return sanityFetch({
    query: journalEntriesQuery,
    params: { locale },
    perspective,
    stega,
  })
}

async function entriesForRequest(locale: Locale): Promise<JournalEntry[]> {
  if (!isConfigured('sanity')) return [...resolveJournalEntries(locale, null)]

  const { isEnabled: isDraftMode } = await draftMode()
  const { data } = await fetchEntries(
    locale,
    isDraftMode ? 'drafts' : 'published',
    isDraftMode
  )

  return [...resolveJournalEntries(locale, data)]
}

export async function generateMetadata() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const t = await getTranslations('journal')

  return generatePageMetadata({
    title: t('title'),
    description: t('intro'),
    url: `/${locale}/journal`,
  })
}

export default async function JournalPage() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const [t, tWork, entries] = await Promise.all([
    getTranslations('journal'),
    getTranslations('workIndex'),
    entriesForRequest(locale),
  ])

  /*
   * The reader's own formatting, from the stored date.
   *
   * `date` is an ISO string in both the CMS and the fallback precisely so it
   * can be formatted here — a pre-formatted string in the content would be
   * English in the Indonesian page, which is the class of bug that made every
   * localized field an `internationalizedArray` in the first place.
   */
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const rows: JournalRow[] = entries.map((entry) => ({
    ...entry,
    dateLabel: entry.date ? formatter.format(new Date(entry.date)) : '',
    practiceLabel: entry.practice ? tWork(entry.practice) : null,
  }))

  return (
    <Wrapper theme="dark" gsap>
      {/*
        The index states its membership — Tahap 38.

        `collectionPageSchema()` had been written, typed, exported and never
        called. Without it a listing is a page of links: an answer engine
        asking what the studio has written has to follow every one to find
        out, and the six entry URLs were not in the sitemap either. The
        builder omits the `ItemList` entirely when the list is empty rather
        than asserting an empty collection, so the designed-absence branch
        below needs no special case here.
      */}
      <JsonLd
        data={collectionPageSchema({
          name: t('title'),
          description: t('intro'),
          url: `${SITE.url}${localizedPath(locale, '/journal')}`,
          items: entries.map((entry) => ({
            name: entry.title,
            url: `${SITE.url}${localizedPath(locale, `/journal/${entry.slug}`)}`,
          })),
        })}
      />
      <div className={s.page}>
        <header className={s.header}>
          <p className={cn('caption', s.eyebrow)}>{t('eyebrow')}</p>
          <TextReveal as="h1" split="lines" className={cn('h1', s.title)}>
            {t('title')}
          </TextReveal>
          <Reveal>
            <p data-reveal-item className={cn('p-big', s.intro)}>
              {t('intro')}
            </p>
          </Reveal>
        </header>

        {entries.length === 0 ? (
          /*
           * The designed absence. It should never render while the fallback
           * carries entries, and it exists for the day the studio withdraws
           * every published one — a state that is reachable, so it is drawn
           * rather than left to collapse into a blank column.
           */
          <Reveal as="section" className={s.empty}>
            <p data-reveal-item className={cn('p-big', s.emptyTitle)}>
              {t('emptyTitle')}
            </p>
            <p data-reveal-item className={cn('caption', s.emptyBody)}>
              {t('emptyBody')}
            </p>
          </Reveal>
        ) : (
          /*
            The rows move to a client island so the page keeps its server work
            — CMS resolution, locale date formatting, translations — while the
            three rows can answer the scroll position. See `index-rows.tsx`.
          */
          <Reveal as="section">
            <JournalIndexRows rows={rows} />
          </Reveal>
        )}
      </div>
    </Wrapper>
  )
}
