/**
 * LatestWriting — the studio's newest journal entry, on the page a client
 * reaches first.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The home page shows the work, the practices and how the studio works, and
 * until now nothing of what it thinks — the journal was a link in the header.
 * This puts the newest entry in front of a reader: its date and practice, its
 * title linked to it, and the summary the journal index already shows, with a
 * way into the rest. The caller resolves "newest" exactly as `/journal` does,
 * so the two pages agree on what came last; with no entry, the caller renders
 * nothing.
 *
 * The moment, `latest-writing`, is `Fixings`': the entry arrives as a plate and
 * is fixed in place at its corners.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Fixings } from '@/vault/motion/fixings'
import { Reveal } from '@/vault/motion/reveal'

import s from './latest-writing.module.css'

export interface LatestWritingEntry {
  slug: string
  /** ISO date, or empty when the entry has none. */
  date: string
  title: string
  summary: string
}

interface LatestWritingProps {
  /** Already localized — "From the journal". */
  eyebrow: string
  entry: LatestWritingEntry
  /** Already localized — the entry's practice, when it has one. */
  practice?: string | undefined
  /** Already localized — "All writing". */
  allLabel: string
  /** The reader's locale, for the date. */
  locale: string
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function LatestWriting({
  eyebrow,
  entry,
  practice,
  allLabel,
  locale,
  id = 'latest-writing',
  className,
}: LatestWritingProps) {
  const headingId = `${id}-title`
  const date = entry.date
    ? new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(entry.date))
    : null

  return (
    <section
      aria-labelledby={headingId}
      data-epic="latest-writing"
      className={cn(s.section, className)}
    >
      <Reveal className={s.stack}>
        <h2
          id={headingId}
          data-reveal-item
          className={cn('caption', s.eyebrow)}
        >
          {eyebrow}
        </h2>
        <Fixings as="article" className={s.plate}>
          {(date || practice) && (
            <p className={cn('caption', s.meta)}>
              {date && <time dateTime={entry.date}>{date}</time>}
              {date && practice && ' · '}
              {practice}
            </p>
          )}
          <Link
            href={`/journal/${entry.slug}`}
            className={cn('p-big', s.name)}
            data-press="nav"
            data-intent=""
          >
            {entry.title}
          </Link>
          {entry.summary && (
            <p className={cn('caption', s.summary)}>{entry.summary}</p>
          )}
        </Fixings>
        <p data-reveal-item className={s.all}>
          <Link
            href="/journal"
            className={cn('caption', s.name)}
            data-press="nav"
            data-intent=""
          >
            {allLabel}
          </Link>
        </p>
      </Reveal>
    </section>
  )
}
