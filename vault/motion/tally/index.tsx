/**
 * Tally — a count shown as marks, and counted out one mark at a time.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: the marks follow the global reveal contract (`data-reveal` on an
 * ancestor), and there is no script or loop of its own.
 *
 * ## What the motion says
 *
 * A quantity a reader can see the size of, before reading the number: one
 * stroke per unit, gathered in fives, the way a site inspector keeps count.
 * When the reveal arrives the strokes are counted out from the end nearest
 * what they are counted for, one after another — and over one slow beat
 * whatever the count, so a large number is counted faster rather than longer.
 * Only `opacity` changes; nothing moves, so nothing slides out from under a
 * pointer (the lesson of checkpoint 2, `docs/HANDOFF.md` §4.2).
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the caller states the count in text beside it,
 * which is what a screen reader hears and what a reader can quote.
 *
 * ## Reduced motion, and no script
 *
 * Both show the full count at once. Reduced motion drops the beat in this
 * stylesheet; with no script no ancestor is ever `hidden` (§9.4 rules 3 and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <Tally count={7} /> <span>7 engagements</span>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './tally.module.css'

interface TallyProps {
  count: number
  /**
   * The end the count starts from — the one nearest what is being counted
   * for. `end` counts out toward the inline start.
   */
  from?: 'start' | 'end' | undefined
  className?: string | undefined
}

export function Tally({ count, from = 'start', className }: TallyProps) {
  const marks = Array.from({ length: count }, (_, index) => ({
    id: `mark-${index}`,
    index,
  }))

  return (
    <span
      aria-hidden="true"
      className={cn(s.tally, className)}
      data-from={from}
      style={{ '--tally-count': count } as CSSProperties}
    >
      {marks.map((mark) => (
        <span
          key={mark.id}
          className={s.mark}
          style={{ '--tally-index': mark.index } as CSSProperties}
        />
      ))}
    </span>
  )
}
