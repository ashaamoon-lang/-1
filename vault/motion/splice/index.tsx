/**
 * Splice — two halves of a member brought together at a joint, and the plate
 * that fixes them.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it is drawn when the `Reveal` it sits in arrives, through the
 * global reveal contract (`data-reveal` on an ancestor), and has no script or
 * loop of its own.
 *
 * ## What the motion says
 *
 * A member too long to bring in whole arrives in two pieces, each set from
 * its own end, and is made continuous at a splice: the halves meet in the
 * middle and a plate is bolted across the joint. Placed between two things a
 * reader should read as one — a term and what it means — it says exactly
 * that: each half starts from its own side, they meet, and the plate goes on
 * once they have. Nothing passes the joint (MOTION-SPEC §9.3), and only the
 * halves' `transform` and the plate's `opacity` change. Whatever sits either
 * side of it does not move at all.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the term and the meaning beside it carry
 * everything, and read in order without it.
 *
 * ## Reduced motion, and no script
 *
 * Both show the joint made — halves met, plate on — at once (§9.4 rules 3 and
 * 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <span>Term</span>
 *   <Splice />
 *   <span>What it means</span>
 * </Reveal>
 * ```
 */

import cn from 'clsx'

import s from './splice.module.css'

interface SpliceProps {
  className?: string | undefined
}

export function Splice({ className }: SpliceProps) {
  return (
    <span aria-hidden="true" className={cn(s.splice, className)}>
      <span className={s.half} data-side="start" />
      <span className={s.plate} />
      <span className={s.half} data-side="end" />
    </span>
  )
}
