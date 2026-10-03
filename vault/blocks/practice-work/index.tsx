/**
 * PracticeWork — the work a practice has carried, as a short index under
 * whatever is written about that practice.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * One row per listed work: its title, linked to the case study, and the same
 * line of metadata the work's card reads — engagement, client, year, each
 * only when present. A work with no slug or no title cannot be linked or
 * named, so it is left out rather than drawn as a dead row; with no rows left,
 * the block renders nothing — designed absence, as the cover beside the essay
 * already does.
 *
 * The moment, `entry-work`, is `Level`'s: the index sits beneath a beam that
 * comes to level as the rows rise into place under it. The rows and heading
 * are the reveal's items; nothing else moves.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Level } from '@/vault/motion/level'
import { Reveal } from '@/vault/motion/reveal'

import s from './practice-work.module.css'

/** The card fields this reads — a subset of `workIndexQuery`'s rows. */
export interface PracticeWorkItem {
  _id: string
  slug: { current?: string | undefined } | null
  title: string | null
  engagement: string | null
  client: string | null
  year: number | null
}

interface PracticeWorkProps {
  /** Already localized — "Work in Consulting". */
  title: string
  works: readonly PracticeWorkItem[]
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function PracticeWork({
  title,
  works,
  id = 'practice-work',
  className,
}: PracticeWorkProps) {
  const headingId = `${id}-title`
  const rows = works.flatMap((work) => {
    const slug = work.slug?.current
    if (!slug || !work.title) return []

    return [
      {
        id: work._id,
        href: `/work/${slug}`,
        title: work.title,
        meta: [work.engagement, work.client, work.year]
          .filter((part) => part !== null && part !== '')
          .join(' · '),
      },
    ]
  })

  if (rows.length === 0) return null

  return (
    <section
      aria-labelledby={headingId}
      data-epic="entry-work"
      className={cn(s.section, className)}
    >
      <Reveal>
        <h2 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h2>
        <Level className={s.level} />
        <ul className={s.list}>
          {rows.map((row) => (
            <li key={row.id} data-reveal-item className={s.row}>
              <Link
                href={row.href}
                className={s.name}
                data-press="nav"
                data-intent=""
              >
                {row.title}
              </Link>
              {row.meta && (
                <span className={cn('caption', s.meta)}>{row.meta}</span>
              )}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
