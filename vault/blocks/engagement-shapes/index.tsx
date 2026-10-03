/**
 * EngagementShapes — the forms an engagement with the studio has taken, each
 * beside the work it shaped.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Every listed work names its engagement — "Retainer, six months",
 * "Architecture review, six weeks" — and those names, set together, answer the
 * question a client asks before any other: what does working with you look
 * like? One row per work, in the catalogue's own order: the engagement first,
 * as the studio wrote it, then the work it shaped, linked, with its client and
 * year. Nothing is grouped, abridged or renamed — these are the studio's own
 * words — and a work with no engagement, slug or title is left out by the
 * caller rather than shown half-named.
 *
 * The moment, `engagement-shapes`, is `Plumb`'s: a line let down beside the
 * schedule as the reader goes down it. The rows fade in place without a lift,
 * so the links never move under a pointer (checkpoint 2,
 * `docs/HANDOFF.md` §4.2).
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Plumb } from '@/vault/motion/plumb'
import { Reveal } from '@/vault/motion/reveal'

import s from './engagement-shapes.module.css'

export interface EngagementShapeRow {
  /** Stable, for the key. */
  id: string
  /** The work's engagement, as the studio wrote it. */
  engagement: string
  title: string
  /** Locale-free, for `components/ui/link` to localize. */
  href: string
  /** Client and year, already joined; empty when neither is known. */
  meta: string
}

interface EngagementShapesProps {
  /** Already localized — "Shapes an engagement has taken". */
  title: string
  rows: readonly EngagementShapeRow[]
  /** Names the heading the section is labelled by; one per page. */
  id?: string | undefined
  className?: string | undefined
}

export function EngagementShapes({
  title,
  rows,
  id = 'engagement-shapes',
  className,
}: EngagementShapesProps) {
  const headingId = `${id}-title`

  return (
    <section
      aria-labelledby={headingId}
      data-epic="engagement-shapes"
      className={cn(s.section, className)}
    >
      <Reveal className={s.stack}>
        <h2 id={headingId} data-reveal-item className={cn('caption', s.title)}>
          {title}
        </h2>
        <Plumb>
          <ul className={s.list}>
            {rows.map((row) => (
              <li key={row.id} data-reveal-item className={s.row}>
                <span className={cn('p-big', s.shape)}>{row.engagement}</span>
                <span className={cn('caption', s.work)}>
                  <Link
                    href={row.href}
                    className={s.name}
                    data-press="nav"
                    data-intent=""
                  >
                    {row.title}
                  </Link>
                  {row.meta && <span className={s.meta}> · {row.meta}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Plumb>
      </Reveal>
    </section>
  )
}
