/**
 * PracticeKey — the key to the catalogue's frame: what each of its rows means.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The frame above it places every work by the practice that carried it, and
 * the filter chips name the same three practices — but nowhere on `/work` was
 * a reader told what a practice *is*. A drawing answers that with its key. One
 * row per practice the frame actually shows, in the frame's own order: the
 * practice, then the one sentence the site already uses to describe it
 * (`workIndex.<practice>Intro`). Nothing new is written, and the row for work
 * no practice names has no meaning to give, so it has no key row.
 *
 * The moment, `catalogue-key`, is `Splice`'s: each term is joined to its
 * meaning. The rows fade in place without a lift; the text never moves.
 */

import cn from 'clsx'

import { Reveal } from '@/vault/motion/reveal'
import { Splice } from '@/vault/motion/splice'

import s from './practice-key.module.css'

export interface PracticeKeyRow {
  /** Stable, for the key. */
  practice: string
  /** Already localized — the practice's name. */
  label: string
  /** Already localized — the sentence that says what the practice is. */
  meaning: string
}

interface PracticeKeyProps {
  /** Already localized — "Key". */
  title: string
  rows: readonly PracticeKeyRow[]
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function PracticeKey({
  title,
  rows,
  id = 'practice-key',
  className,
}: PracticeKeyProps) {
  const headingId = `${id}-title`

  return (
    <section
      aria-labelledby={headingId}
      data-epic="catalogue-key"
      className={cn(s.section, className)}
    >
      <Reveal className={s.stack}>
        <h3 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h3>
        <ul className={s.list}>
          {rows.map((row) => (
            <li key={row.practice} data-reveal-item className={s.row}>
              <span className={cn('caption', s.term)}>{row.label}</span>
              <Splice />
              <span className={cn('caption', s.meaning)}>{row.meaning}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
