/**
 * EngagementWriting — what a practice has written, read against when this
 * engagement happened.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * At the foot of a case study, the journal entries filed under the work's
 * practice, set out from a datum: the engagement's year. What was written
 * after it sits above the line and what was written in it or before sits
 * below (`split.ts`), so a reader sees at a glance whether the thinking came
 * before the work or out of it. The relationship is the dates', not a claim
 * that one entry shaped one engagement; the label says only "this
 * engagement" and its year. With no year there is no datum, and the entries
 * are one list.
 *
 * The moment, `engagement-writing`, is `Datum`'s: the line stays still and
 * the rows move away from it as they arrive.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Datum } from '@/vault/motion/datum'
import { Reveal } from '@/vault/motion/reveal'

import { splitAtDatum } from './split'

import s from './engagement-writing.module.css'

export interface EngagementWritingEntry {
  slug: string
  /** ISO date, or empty when the entry has none. */
  date: string
  title: string
  summary: string
}

interface EngagementWritingProps {
  /** Already localized — "Writing on Consulting". */
  title: string
  entries: readonly EngagementWritingEntry[]
  /** The engagement's year: the datum. `null` draws no datum. */
  year: number | null
  /** Already localized — "This engagement, 2025". */
  datumLabel: string
  /** The reader's locale, for the dates. */
  locale: string
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function EngagementWriting({
  title,
  entries,
  year,
  datumLabel,
  locale,
  id = 'engagement-writing',
  className,
}: EngagementWritingProps) {
  const headingId = `${id}-title`
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const list = (items: readonly EngagementWritingEntry[]) =>
    items.length > 0 ? (
      <ul className={s.list}>
        {items.map((entry) => (
          <li key={entry.slug} data-reveal-item className={s.row}>
            {entry.date && (
              <time dateTime={entry.date} className={cn('caption', s.date)}>
                {formatter.format(new Date(entry.date))}
              </time>
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
          </li>
        ))}
      </ul>
    ) : null

  const sides = year === null ? null : splitAtDatum(entries, year)

  return (
    <section
      aria-labelledby={headingId}
      data-epic="engagement-writing"
      className={cn(s.section, className)}
    >
      <Reveal>
        <h2 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h2>
        {sides === null ? (
          list(entries)
        ) : (
          <Datum
            above={list(sides.above)}
            label={datumLabel}
            below={list(sides.below)}
            className={s.datum}
          />
        )}
      </Reveal>
    </section>
  )
}
