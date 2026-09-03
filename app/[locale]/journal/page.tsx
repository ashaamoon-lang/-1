import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { draftMode } from 'next/headers'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import {
  type JournalEntry,
  resolveJournalEntries,
} from '@/lib/content/journal-fallback'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { journalEntriesQuery } from '@/lib/integrations/sanity/queries'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { Reveal } from '@/vault/motion/reveal'
import { TextReveal } from '@/vault/motion/text-reveal'

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
 * ## Motion: none of its own, deliberately
 *
 * `TextReveal` on the `h1` — the site's entrance vocabulary — and the
 * container reveal on the rows. **No choreographed moment.**
 * `docs/MOTION-SPEC.md` §9.5 allows two per page; a page whose content is
 * a list of headlines does not need one, and Tahap 25 had just spent a whole
 * stage measuring two dimming values that failed contrast. Adding a sixth
 * piece of motion vocabulary immediately after would undo what that cost.
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

  return (
    <Wrapper theme="dark" gsap>
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
          <Reveal as="section" className={s.list}>
            {entries.map((entry) => (
              <article className={s.entry} data-reveal-item key={entry.slug}>
                <p className={cn('caption', s.date)}>
                  {entry.date ? (
                    <time dateTime={entry.date}>
                      {formatter.format(new Date(entry.date))}
                    </time>
                  ) : null}
                  {entry.practice ? (
                    <span className={s.practice}>{tWork(entry.practice)}</span>
                  ) : null}
                </p>

                <h2 className={cn('h2', s.entryTitle)}>
                  {/*
                    The whole row is the target, not just the title — but the
                    link wraps the title only, and the row is made clickable by
                    the link's own box being stretched over it in CSS. That
                    keeps one accessible name on one control instead of
                    wrapping a heading, a date and a paragraph in a single
                    anchor whose name would be all three read together.
                  */}
                  <Link
                    href={`/journal/${entry.slug}`}
                    className={s.link}
                    // `MOTION-SPEC.md` §9 — the row is a pressable noun.
                    data-press="entry"
                    data-intent=""
                  >
                    {entry.title}
                  </Link>
                </h2>

                <p className={s.summary}>{entry.summary}</p>
              </article>
            ))}
          </Reveal>
        )}
      </div>
    </Wrapper>
  )
}
