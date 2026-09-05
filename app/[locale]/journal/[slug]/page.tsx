import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Link } from '@/components/ui/link'
import {
  fallbackEntry,
  fallbackSlugs,
  type JournalEntry,
  resolveJournalEntries,
} from '@/lib/content/journal-fallback'
import { practiceTemplate } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { JsonLd } from '@/lib/seo/json-ld'
import { articleSchema } from '@/lib/seo/schemas'
import { SITE } from '@/lib/seo/site'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { Reveal } from '@/vault/motion/reveal'
import { TextReveal } from '@/vault/motion/text-reveal'

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

export default async function JournalEntryPage({ params }: EntryPageProps) {
  const { slug } = await params
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const entry = entryFor(locale, slug)
  if (!entry) notFound()

  const [t, tWork, tNav] = await Promise.all([
    getTranslations('journal'),
    getTranslations('workIndex'),
    getTranslations('nav'),
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
    <Wrapper theme="dark" gsap>
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

          <TextReveal as="h1" split="lines" className={cn('h1', s.title)}>
            {entry.title}
          </TextReveal>

          <Reveal>
            <p data-reveal-item className={cn('p-big', s.summary)}>
              {entry.summary}
            </p>
          </Reveal>
        </header>

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
