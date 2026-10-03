/**
 * TitleBlock — the box in the corner of a drawing that says what the sheet
 * is, who it is for and who it comes from, with the one action it asks for.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Every drawing in a set carries one, and it is the first thing a builder
 * reads: not the drawing, but the ruled cells that say what the drawing is.
 * Here it frames a page's invitation the same way — a few labelled facts
 * the caller already knows (a practice, the studio, an address), ruled into
 * cells, and beneath them the action. It states; it does not persuade.
 *
 * ## No motion
 *
 * Deliberately still. The action is where the reader acts, and checkpoint 2
 * showed what a lift does to a press target (`docs/HANDOFF.md` §4.2); a title
 * block is also the one part of a sheet that never moves. Reduced motion and
 * no script therefore have nothing to undo — the block is the same in all
 * three.
 *
 * ## Reading it
 *
 * A labelled region holding a `<dl>`: each row a term and its value, in the
 * order they are drawn. The action is the caller's — a standalone link, never
 * inline in running text (checkpoint 3).
 *
 * @example
 * ```tsx
 * <TitleBlock
 *   label="Start an engagement"
 *   rows={[{ label: 'Practice', value: 'Consulting' }]}
 *   action={<EngagementEnquiry href={href} label="Discuss an engagement" />}
 * />
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './title-block.module.css'

export interface TitleBlockRow {
  label: string
  value: ReactNode
}

interface TitleBlockProps {
  /** Names the region for assistive technology. */
  label: string
  rows: readonly TitleBlockRow[]
  /** What the block asks the reader to do, if anything. */
  action?: ReactNode
  className?: string | undefined
  /** Declared rather than spread, for the reason `vault/motion/reveal` gives. */
  'data-epic'?: string | undefined
}

export function TitleBlock({
  label,
  rows,
  action,
  className,
  'data-epic': epic,
}: TitleBlockProps) {
  return (
    <section
      aria-label={label}
      className={cn(s.block, className)}
      {...(epic && { 'data-epic': epic })}
    >
      <dl className={s.rows}>
        {rows.map((row) => (
          <div key={row.label} className={s.row}>
            <dt className={cn('caption', s.label)}>{row.label}</dt>
            <dd className={s.value}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {action ? <div className={s.action}>{action}</div> : null}
    </section>
  )
}
