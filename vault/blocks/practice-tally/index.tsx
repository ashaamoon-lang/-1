/**
 * PracticeTally — the journal, read against the work: for each practice, how
 * much it has written down beside how much it has delivered.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A table with the practice in the middle, its writing counted out to one side
 * and its work to the other (`tally.ts`), so the balance between thinking and
 * doing is visible before a number is read — and so is a practice that has
 * done work it has not yet written about. Each practice links to its own page,
 * where the two now sit together, which also gives the journal index the way
 * onward it ended without. The counts are text; the tallies only draw them.
 *
 * The moment, `practice-tally`, is `Tally`'s: the strokes are counted out from
 * the practice. The rows fade in place rather than lifting, so the links never
 * move under a pointer (checkpoint 2, `docs/HANDOFF.md` §4.2).
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Reveal } from '@/vault/motion/reveal'
import { Tally } from '@/vault/motion/tally'

import s from './practice-tally.module.css'

export interface PracticeTallyRow {
  /** Stable, for the key. */
  practice: string
  /** Already localized — the practice's name. */
  label: string
  /** Locale-free, for `components/ui/link` to localize. */
  href: string
  entries: number
  works: number
  /** Already localized — "2 entries", "none yet". */
  entriesLabel: string
  /** Already localized — "2 engagements". */
  worksLabel: string
}

interface PracticeTallyProps {
  /** Already localized — "The journal, by practice". */
  title: string
  /** Already localized column heads. */
  headings: { writing: string; practice: string; work: string }
  rows: readonly PracticeTallyRow[]
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function PracticeTally({
  title,
  headings,
  rows,
  id = 'practice-tally',
  className,
}: PracticeTallyProps) {
  const headingId = `${id}-title`

  return (
    <section
      aria-labelledby={headingId}
      data-epic="practice-tally"
      className={cn(s.section, className)}
    >
      <Reveal className={s.stack}>
        <h2 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h2>
        <table aria-labelledby={headingId} className={s.table}>
          <thead>
            <tr className="caption">
              <th scope="col" className={s.writing}>
                {headings.writing}
              </th>
              <th scope="col" className={s.practice}>
                {headings.practice}
              </th>
              <th scope="col" className={s.work}>
                {headings.work}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.practice} data-reveal-item>
                <td className={s.writing}>
                  <span className={cn('caption', s.count)}>
                    {row.entriesLabel}
                  </span>{' '}
                  <Tally count={row.entries} from="end" />
                </td>
                <th scope="row" className={s.practice}>
                  <Link
                    href={row.href}
                    className={s.name}
                    data-press="nav"
                    data-intent=""
                  >
                    {row.label}
                  </Link>
                </th>
                <td className={s.work}>
                  <Tally count={row.works} />{' '}
                  <span className={cn('caption', s.count)}>
                    {row.worksLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </section>
  )
}
