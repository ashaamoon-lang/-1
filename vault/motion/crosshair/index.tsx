/**
 * Crosshair — two hairlines run in from a grid's edges to the point in hand.
 *
 * Provenance: original work for this project. No third-party code copied.
 * It only draws where it is told; whoever places it decides the point (in the
 * frame, `vault/blocks/catalogue-frame/reader.tsx`), so it has no script,
 * listener or loop of its own.
 *
 * ## What the motion says
 *
 * A drawing's grid is read by its edges: a point is "row C, column 4" because
 * a line runs from each axis to it. Laid over the catalogue's frame, the two
 * lines do exactly that for the work under the pointer or the keyboard focus —
 * one along its practice's row from the frame's left edge, one down its year's
 * column from the frame's top — and when the reader moves on, they glide to
 * the next work instead of jumping, so the eye follows the move. Only the
 * lines' `transform` and `opacity` change.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration over a real table: the row and column headings
 * already name every cell to a screen reader.
 *
 * ## Reduced motion
 *
 * The lines still reach the same point; they are simply there at once
 * (§9.4 rule 3).
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <table>…</table>
 *   <Crosshair on x={120} y={64} reachX={0.4} reachY={0.5} />
 * </div>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './crosshair.module.css'

interface CrosshairProps {
  /** Whether there is a point in hand at all. */
  on: boolean
  /** The point, in pixels from the container's left and top edges. */
  x: number
  y: number
  /** The same point as a fraction of the container's width and height. */
  reachX: number
  reachY: number
  className?: string | undefined
}

export function Crosshair({
  on,
  x,
  y,
  reachX,
  reachY,
  className,
}: CrosshairProps) {
  /*
   * The point reaches the stylesheet as custom properties, which React's
   * `CSSProperties` does not list — the same widening `project-spine` gives
   * its progress.
   */
  const style = {
    '--cross-x': `${x}px`,
    '--cross-y': `${y}px`,
    '--cross-reach-x': reachX,
    '--cross-reach-y': reachY,
  } as CSSProperties

  return (
    <span
      aria-hidden="true"
      className={cn(s.crosshair, className)}
      style={style}
      {...(on && { 'data-on': '' })}
    >
      <span className={s.row} />
      <span className={s.column} />
    </span>
  )
}
