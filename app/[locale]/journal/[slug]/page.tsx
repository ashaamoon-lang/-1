import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'
import { ViewTransition } from 'react'

import { Wrapper } from '@/components/layout/wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import {
  fallbackEntry,
  fallbackSlugs,
  type JournalEntry,
  resolveJournalEntries,
} from '@/lib/content/journal-fallback'
import { practiceTemplate } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { workIndexQuery } from '@/lib/integrations/sanity/queries'
import { toImageSource } from '@/lib/integrations/sanity/utils/image'
import { transitionName } from '@/lib/motion/transition-name'
import { JsonLd } from '@/lib/seo/json-ld'
import { articleSchema } from '@/lib/seo/schemas'
import { SITE } from '@/lib/seo/site'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { Reveal } from '@/vault/motion/reveal'

import s from './page.module.css'

/**
 * One journal entry.
 *
 * ## Why this reads the fallback rather than the CMS today
 *
 * The dataset holds no `journalEntry` documents — none were written into it,
 * for the reason `lib/content/journal-fallback.ts` records. So this route
 * resolves against the scaffolding, and `notFound()` for anything else.
 *
 * When the studio publishes, `resolveJournalEntries` stops returning the
 * scaffolding entirely and this route needs the CMS branch its index sibling
 * already has. That is a small, contained change, and it is left undone
 * rather than written blind against a shape no document has taken yet —
 * `docs/stages/TAHAP-26.md` §8 states it as the stage's one deliberate gap
 * rather than leaving it to be discovered.
 *
 * ## Motion
 *
 * `TextReveal` on the `h1` and the container reveal on the blocks. Nothing
 * else: this is a page of prose, and the curated motion data this project
 * reads is explicit that body copy is the one thing not to animate against
 * scroll.
 */

interface EntryPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return fallbackSlugs().map((slug) => ({ slug }))
}

function entryFor(locale: Locale, slug: string): JournalEntry | undefined {
  return fallbackEntry(locale, slug)
}

export async function generateMetadata({ params }: EntryPageProps) {
  const { slug } = await params
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const entry = entryFor(locale, slug)

  if (!entry) {
    const t = await getTranslations('notFound')
    return { title: t('title') }
  }

  return generatePageMetadata({
    title: entry.title,
    description: entry.summary,
    url: `/${locale}/journal/${slug}`,
  })
}

/**
 * One cover from a practice, for the entry that names it — Tahap 44.
 *
 * ## Why the practice rather than a project the entry names
 *
 * It cannot name one. `schemas/journalEntry.ts` carries `title`, `slug`,
 * `date`, `summary`, `body`, `practice` and `listed`, and no reference to a
 * project at all — so the plan's "if the entry names a project" describes a
 * field that does not exist. Adding one would have shipped a column none of
 * the entries fill, which renders the same nothing this page rendered before,
 * only with more schema behind it.
 *
 * The practice is real, stored, and already rendered as a link in the header
 * above. Work from that practice beside an essay about it is a relationship
 * the data asserts rather than one invented to fill a hole.
 *
 * Returns `null` for an entry with no practice, or a practice with no listed
 * work. That is designed absence — see the render site.
 */
async function coverForPractice(locale: string, practice: string | null) {
  'use cache'
  if (!practice) return null

  const projects = await sanityFetch({
    query: workIndexQuery,
    /*
     * The reader's locale, not a hardcoded `'en'`.
     *
     * `$locale` is what selects the cover's `alt` out of its
     * internationalized array, and an alt is the one string on a page that a
     * screen reader reads *instead of* looking. Pinning it to English would
     * have described every Indonesian page's plate in English.
     */
    params: { locale, practice },
    perspective: 'published',
    stega: false,
  })
  // `workIndexQuery` is ordered `order asc, publishedAt desc`, so the same
  // entry gets the same cover on every render rather than one that moves
  // between builds.
  return projects.data[0] ?? null
}

export default async function JournalEntryPage({ params }: EntryPageProps) {
  const { slug } = await params
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const entry = entryFor(locale, slug)
  if (!entry) notFound()

  const [t, tWork, tNav, work] = await Promise.all([
    getTranslations('journal'),
    getTranslations('workIndex'),
    getTranslations('nav'),
    coverForPractice(locale, entry.practice),
  ])

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  /*
   * The next entry, wrapping at the end.
   *
   * The same circuit `next-project` and `next-practice` close, and for the
   * same reason `e2e/site-reach.e2e.ts` exists: a page that ends with nowhere
   * to go is where a reader leaves.
   */
  const all = resolveJournalEntries(locale, null)
  const index = all.findIndex((candidate) => candidate.slug === entry.slug)
  const next = all[(index + 1) % all.length]

  const url = `${SITE.url}${localizedPath(locale, `/journal/${slug}`)}`

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
        `articleSchema()` was written, typed, exported and never called —
        Tahap 38's audit found three builders in that state. An entry is the
        one document type on this site that is an article, and until now the
        only structured data it carried was the site-wide Organization graph
        every route shares, which says nothing about the page it is on.

        `dateModified` is deliberately absent rather than copied from
        `datePublished`: the scaffolding records when an entry was written and
        nothing tracks edits, so asserting the two are equal would be a claim
        this site cannot support.
      */}
      <JsonLd
        data={articleSchema({
          headline: entry.title,
          description: entry.summary,
          url,
          ...(entry.date && { datePublished: entry.date }),
        })}
      />
      <article className={s.page}>
        <Breadcrumbs
          className={s.breadcrumbs}
          label={tNav('breadcrumb')}
          trail={[
            {
              href: '/',
              label: tNav('crumbHome'),
              url: `${SITE.url}${localizedPath(locale, '/')}`,
            },
            {
              href: '/journal',
              label: tNav('journal'),
              url: `${SITE.url}${localizedPath(locale, '/journal')}`,
            },
            { label: entry.title, url },
          ]}
        />

        <header className={s.header}>
          <p className={cn('caption', s.meta)}>
            <time dateTime={entry.date}>
              {formatter.format(new Date(entry.date))}
            </time>
            {/*
              The practice is a link now — Tahap 38.

              It named a practice that has had its own page since Tahap 15a
              and pointed nowhere, on a page that offered exactly one way
              onward. An entry filed under "AI and data" is the strongest
              possible cue that the reader wants the practice behind it.
            */}
            {entry.practice ? (
              <Link
                href={practiceTemplate(entry.practice)}
                className={s.practice}
                aria-label={`${tNav('relatedPractice')}: ${tWork(entry.practice)}`}
                data-press="practice"
                data-intent=""
              >
                {tWork(entry.practice)}
              </Link>
            ) : null}
          </p>

          {/*
            The receiving half of `journal-transport` — Tahap 41.

            A plain `<h1>`, not a `TextReveal`, and that is the same call
            `docs/stages/TAHAP-23.md` §3.2 made for the practice page's
            heading: `<ViewTransition>` photographs real DOM, and SplitText
            takes ownership of the text nodes of the element it is given. The
            two cannot both have this element.

            The trade runs the right way. The morph **is** this page's
            arrival; a line reveal on top of it would be a second arrival
            competing with the first. `vault/blocks/practice-hero` is the
            shape this copies.

            A measured side effect: Tahap 40 found this heading moving
            702–766ms with no named moment behind it. It is not split at all
            now.
          */}
          <ViewTransition
            name={transitionName(`journal-${slug}`)}
            share="morph"
            default="none"
          >
            <h1 className={cn('h1', s.title)}>{entry.title}</h1>
          </ViewTransition>

          <Reveal>
            <p data-reveal-item className={cn('p-big', s.summary)}>
              {entry.summary}
            </p>
          </Reveal>
        </header>

        {/*
          Work from this entry's practice — Tahap 44.

          Between the summary and the body, where a periodical puts its
          opening plate: after the reader knows what the piece is about and
          before they commit to reading it.

          **Designed absence when there is none.** No placeholder, no empty
          frame, no "image coming soon" — an entry whose practice has no
          listed work simply reads as text, which is what it is. An empty
          frame says the page is broken; nothing says there is nothing to
          show, and only one of those is true.

          `Reveal` and nothing else: no named moment, no `data-epic`. This
          page's one choreographed moment is `journal-transport` arriving
          from the index, and a second would need a §9.5 amendment for an
          image that is context rather than subject.

          A `div`, not a `figure`: `Reveal`'s `as` admits only the elements it
          has been reasoned about on, and widening that union for one call
          site would be the wrong trade. Without a caption a `<figure>` adds
          nothing a screen reader uses anyway — the image carries its own
          description.
        */}
        {work?.cover && (
          <Reveal className={s.opening}>
            <SanityImage
              data-reveal-item
              image={toImageSource(work.cover)}
              alt={work.coverAlt ?? ''}
              /*
                The reading column, which this page caps at a measure rather
                than running to the full grid — so the request is the column
                it lands in, not the viewport.
              */
              maxWidth={720}
              sizes="(max-width: 800px) 100vw, 48vw"
              className={s.openingImage}
            />
          </Reveal>
        )}

        <Reveal as="section" className={s.body}>
          {entry.body.map((paragraph) => (
            <p data-reveal-item className={s.paragraph} key={paragraph}>
              {paragraph}
            </p>
          ))}
        </Reveal>

        {next && next.slug !== entry.slug ? (
          <Reveal as="aside" className={s.next}>
            <p data-reveal-item className={cn('caption', s.nextEyebrow)}>
              {t('nextEyebrow')}
            </p>
            <p data-reveal-item className={cn('h3', s.nextTitle)}>
              <Link
                href={`/journal/${next.slug}`}
                className={s.nextLink}
                data-press="next-entry"
                data-intent=""
              >
                {next.title}
              </Link>
            </p>
          </Reveal>
        ) : null}
      </article>
    </Wrapper>
  )
}
