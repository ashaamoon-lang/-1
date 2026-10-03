/**
 * PracticeWriting — what a practice has written down about how it works,
 * listed on the practice's own page.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The journal files each entry under a practice; this reads that filing the
 * other way. One row per entry: its date, its title linked to the entry, and
 * the summary the journal index already shows. The caller resolves the
 * entries exactly as the index does, so the two never disagree about what
 * has been written; with none, the caller renders nothing.
 *
 * The moment, `practice-writing`, is `Formwork`'s: each row arrives inside its
 * form and stands once the form is struck.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { Formwork } from '@/vault/motion/formwork'
import { Reveal } from '@/vault/motion/reveal'

import s from './practice-writing.module.css'

export interface PracticeWritingEntry {
  slug: string
  /** ISO date, or empty when the entry has none. */
  date: string
  title: string
  summary: string
}

interface PracticeWritingProps {
  /** Already localized — "Writing from this practice". */
  title: string
  entries: readonly PracticeWritingEntry[]
  /** The reader's locale, for the dates. */
  locale: string
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function PracticeWriting({
  title,
  entries,
  locale,
  id = 'practice-writing',
  className,
}: PracticeWritingProps) {
  const headingId = `${id}-title`
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section
      aria-labelledby={headingId}
      data-epic="practice-writing"
      className={cn(s.section, className)}
    >
      <SectionHeader reveal id={headingId} title={title} />
      <Reveal>
        <ul className={s.list}>
          {entries.map((entry) => (
            <Formwork key={entry.slug} as="li" className={s.row}>
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
            </Formwork>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
