/**
 * NorthArrow — a drawing's north point, turned to bear on what it is shown.
 *
 * Provenance: original work for this project. No third-party code copied.
 * It only turns; the bearing is decided by whoever places it (`bearing.ts`
 * holds the geometry), so it has no script, loop or listener of its own.
 *
 * ## What the motion says
 *
 * Every drawing set carries a north point, so a reader who has lost their way
 * on the sheet can orient themselves. On a page whose job is to say "this is
 * not where you meant to be", the needle does that job literally: it swings
 * to bear on the way out — at rest on the best guess, and onto whichever one
 * the reader points at or tabs to. It turns the short way round
 * (`nearestTurn`), settles on `--ease-out-expo` without overshoot
 * (`MOTION-SPEC.md` §9.3), and only its `transform` changes.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the links it points at carry everything.
 *
 * ## Reduced motion
 *
 * The needle still bears on the right place; it is simply there at once
 * (§9.4 rule 3).
 *
 * @example
 * ```tsx
 * <NorthArrow bearing={Math.PI / 2} />
 * ```
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './north-arrow.module.css'

interface NorthArrowProps {
  /** Radians clockwise from north (up the screen); 0 points up. */
  bearing: number
  className?: string | undefined
}

export function NorthArrow({ bearing, className }: NorthArrowProps) {
  /*
   * The bearing reaches the stylesheet as a custom property, which React's
   * `CSSProperties` does not list — the same widening `project-spine` gives
   * its progress.
   */
  const needleStyle = { '--bearing': `${bearing}rad` } as CSSProperties

  return (
    <span aria-hidden="true" className={cn(s.arrow, className)}>
      <span className={s.needle} style={needleStyle} />
    </span>
  )
}
