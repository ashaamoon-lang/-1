import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { draftMode } from 'next/headers'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { SanityImage } from '@/components/ui/sanity-image'
import {
  type JournalEntry,
  resolveJournalEntries,
} from '@/lib/content/journal-fallback'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  journalEntriesQuery,
  projectsQuery,
} from '@/lib/integrations/sanity/queries'
import { toImageSource } from '@/lib/integrations/sanity/utils/image'
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

/**
 * One work per practice, so a journal row has something to look at —
 * Tahap 44.
 *
 * ## Why the practice and not a named project
 *
 * The plan asked for the project an entry "names". `schemas/journalEntry.ts`
 * has no field that can name one — `title`, `slug`, `date`, `summary`,
 * `body`, `practice`, `listed`, and nothing else. Adding a reference field
 * would have shipped a column with no data behind it: none of the entries
 * would set it, so the page would render the same zero images it renders
 * now, only with more schema.
 *
 * Every entry does carry a practice, and every practice has work behind it.
 * An essay about a practice sitting beside work from that practice is a
 * relationship the data already asserts — nothing here is invented, which is
 * what `docs/ROADMAP.md`'s standing rule 10 requires.
 *
 * ## Why a list per practice rather than one cover per practice
 *
 * Measured on `/en/journal` with a single cover per practice: two of the
 * three entries are `consulting`, so two rows carried **the same picture** —
 * three images, two descriptions. A repeated image down an index does not
 * read as "these share a practice", it reads as a bug: the eye finds the
 * repetition before it finds the reason.
 *
 * So each practice keeps its whole list in catalogue order and the rows draw
 * from it in turn, wrapping when there are more entries than works.
 * `projectsQuery` is already ordered `order asc, publishedAt desc`, so a
 * given entry gets a given cover on every render rather than one that moves
 * between builds.
 */
async function coversByPractice(locale: string) {
  'use cache'
  const projects = await sanityFetch({
    query: projectsQuery,
    // `$locale` picks the reader's language out of each internationalized
    // field — here it is the cover's own `alt`, which must be in the language
    // of the page a screen reader is reading.
    params: { locale },
    perspective: 'published',
    stega: false,
  })

  const byPractice = new Map<string, typeof projects.data>()
  for (const project of projects.data) {
    if (!project.practice) continue
    byPractice.set(project.practice, [
      ...(byPractice.get(project.practice) ?? []),
      project,
    ])
  }
  return byPractice
}

export default async function JournalPage() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const [t, tWork, entries, covers] = await Promise.all([
    getTranslations('journal'),
    getTranslations('workIndex'),
    entriesForRequest(locale),
    coversByPractice(locale),
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

  /*
   * How many entries of each practice have already been given a cover, so the
   * next one takes the next work rather than the same one again.
   */
  const drawn = new Map<string, number>()

  const rows: JournalRow[] = entries.map((entry) => {
    const pool = entry.practice ? covers.get(entry.practice) : undefined
    const taken = entry.practice ? (drawn.get(entry.practice) ?? 0) : 0
    if (entry.practice && pool?.length) {
      drawn.set(entry.practice, taken + 1)
    }
    // Wraps: more entries than works is the normal case as the journal grows,
    // and repeating in order is better than dropping the image entirely.
    const work = pool?.length ? pool[taken % pool.length] : undefined
    return {
      ...entry,
      dateLabel: entry.date ? formatter.format(new Date(entry.date)) : '',
      practiceLabel: entry.practice ? tWork(entry.practice) : null,
      /*
       * Rendered here, on the server, as `dateLabel` and `practiceLabel` are
       * resolved here — and for a sharper reason than symmetry.
       *
       * The rows are a client island. Importing `SanityImage` into it put the
       * component and its dependencies into that island's bundle and took
       * `/en/journal` from 870KB to **901KB** against a 900KB ceiling. An
       * already-rendered element is a value, so it crosses the boundary
       * without taking its implementation with it.
       */
      cover: work?.cover ? (
        <SanityImage
          image={toImageSource(work.cover)}
          alt={work.coverAlt ?? ''}
          /*
            The column this actually renders in — the date rail, 3 of the
            12-column grid, which is ~330px at the 1440 desktop anchor,
            rounded up. The default of 1920 would fetch a full-desktop
            candidate for a box a quarter that wide: `components/ui/image`
            records that this never errors, it just downloads several times
            the bytes.
          */
          maxWidth={360}
          sizes="(max-width: 800px) 100vw, 25vw"
          className={s.coverImage}
        />
      ) : null,
    }
  })

  return (
    <Wrapper
      theme="light"
      /*
        The journal is a reading surface — Tahap 43.

        Every other route on this site is a *looking* surface: work sits on
        ink so the plates carry the light. A journal entry is prose, and a
        site that turns the paper on when the reader stops looking and starts
        reading is a site that was composed rather than themed once.

        It is also the fix for a system half of which was never exercised.
        `contrast.test.ts` measures eleven pairs in **both** themes, and
        before this stage the light half guarded zero reachable routes:
        `error.tsx` only paints on a runtime error, and the markdown
        catch-all always resolves to not-found because no `page` document is
        published. Measured: `curl /en/about` returns 200 and the words "Page
        not found". `docs/stages/TAHAP-43.md` §1.2.
      */
      gsap
    >
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
