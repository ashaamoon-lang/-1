/**
 * Leader — the line a drawing runs from a note to the thing the note is
 * about, ending in a dot on it.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it is drawn when the `Reveal` it sits in arrives, through the
 * global reveal contract (`data-reveal` on an ancestor), and has no script or
 * loop of its own.
 *
 * ## What the motion says
 *
 * A note on a drawing is not left to float: a leader carries it to the part it
 * describes and ends in a dot on that part, so no one has to guess what the
 * note is about. Placed between a claim and what bears it out — what a
 * practice covers, and the work that shows it — it says exactly that: the line
 * drops from the note, turns toward the evidence, and the dot lands on it once
 * the line arrives. Only the segments' `transform` and the dot's `opacity`
 * change. The note and the evidence do not move at all.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the note and the evidence beside it carry
 * everything, and read in order without it.
 *
 * ## Reduced motion, and no script
 *
 * Both show the leader drawn — dropped, turned, dot on — at once (§9.4 rules 3
 * and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <span>Note</span>
 *   <Leader />
 *   <span>The part it describes</span>
 * </Reveal>
 * ```
 */

import cn from 'clsx'

import s from './leader.module.css'

interface LeaderProps {
  className?: string | undefined
}

export function Leader({ className }: LeaderProps) {
  return (
    <span aria-hidden="true" className={cn(s.leader, className)}>
      <span className={s.drop} />
      <span className={s.run} />
      <span className={s.dot} />
    </span>
  )
}
