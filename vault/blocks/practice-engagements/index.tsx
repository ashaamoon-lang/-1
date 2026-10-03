/**
 * PracticeEngagements — a case study's practice, seen as the engagements it
 * has carried, with this one among them.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A case study says how one engagement went; a client deciding how to engage
 * wants to see it beside the others in its practice. One row per listed work
 * in the practice, in the catalogue's order: its engagement in the studio's
 * own words, then the work, linked, with client and year. This engagement is
 * in the list, unlinked and named as such (`aria-current`), so the reader sees
 * where it sits rather than a list that pretends it is elsewhere. Above the
 * rows, a frame of one bay per engagement, the current bay drawn stronger.
 *
 * The moment, `practice-engagements`, is `Brace`'s: each bay arrives racked
 * and is braced square. The rows fade in place without a lift, so the links
 * never move under a pointer (checkpoint 2, `docs/HANDOFF.md` §4.2).
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Brace } from '@/vault/motion/brace'
import { Reveal } from '@/vault/motion/reveal'

import s from './practice-engagements.module.css'

export interface PracticeEngagementRow {
  /** Stable, for the key. */
  id: string
  /** The engagement as the studio wrote it, when it names one. */
  engagement: string | null
  title: string
  /** Locale-free, for `components/ui/link`; `null` for the current work. */
  href: string | null
  /** Client and year, already joined; empty when neither is known. */
  meta: string
}

interface PracticeEngagementsProps {
  /** Already localized — "Engagements in Consulting". */
  title: string
  /** Already localized — "this engagement". */
  currentLabel: string
  rows: readonly PracticeEngagementRow[]
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function PracticeEngagements({
  title,
  currentLabel,
  rows,
  id = 'practice-engagements',
  className,
}: PracticeEngagementsProps) {
  const headingId = `${id}-title`

  return (
    <section
      aria-labelledby={headingId}
      data-epic="practice-engagements"
      className={cn(s.section, className)}
    >
      <Reveal className={s.stack}>
        <h2 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h2>
        <div aria-hidden="true" data-reveal-item className={s.frame}>
          {rows.map((row, index) => (
            <Brace key={row.id} index={index} current={row.href === null} />
          ))}
        </div>
        <ul className={s.list}>
          {rows.map((row) => (
            <li
              key={row.id}
              data-reveal-item
              className={s.row}
              {...(row.href === null && { 'aria-current': 'true' })}
            >
              {row.engagement && (
                <span className="p-big">{row.engagement}</span>
              )}
              <span className={cn('caption', s.work)}>
                {row.href === null ? (
                  <span>
                    {row.title} · {currentLabel}
                  </span>
                ) : (
                  <Link
                    href={row.href}
                    className={s.name}
                    data-press="nav"
                    data-intent=""
                  >
                    {row.title}
                  </Link>
                )}
                {row.meta && <span className={s.meta}> · {row.meta}</span>}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
