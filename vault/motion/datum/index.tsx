/**
 * Datum — a level everything else is set out from, and that does not move.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it points the global reveal's offset, `--reveal-transform`, away
 * from the datum on each side, and has no script or loop of its own.
 *
 * ## What the motion says
 *
 * A drawing measures heights from a datum — a level line, marked with a
 * triangle standing point-down on it — and the datum is the one thing on the
 * sheet that is never moved. So here the line is drawn and stays still, and
 * what is set out from it moves away from it as it arrives: whatever sits
 * above rises into place, whatever sits below sinks into place, both by the
 * reveal's own gutter and in its own settle. The motion is a statement about
 * the reference, not about the items: everything is read from this level.
 * Nothing overshoots (MOTION-SPEC §9.3).
 *
 * ## Reading it
 *
 * The label is text, in reading order between the two sides, so a screen
 * reader meets the datum exactly where a sighted reader does. The mark is
 * `aria-hidden` decoration.
 *
 * ## Reduced motion, and no script
 *
 * Both show everything in place: the offset only exists while a reveal is
 * pending, reduced motion zeroes it in this stylesheet, and with no script no
 * reveal is ever pending (§9.4 rules 3 and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <Datum above={<ul>…</ul>} label="This engagement, 2025" below={<ul>…</ul>} />
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './datum.module.css'

interface DatumProps {
  /** What is set out above the level — later than it. */
  above?: ReactNode
  /** The level's name: what everything here is read from. */
  label: ReactNode
  /** What is set out at or below it. */
  below?: ReactNode
  className?: string | undefined
}

export function Datum({ above, label, below, className }: DatumProps) {
  return (
    <div className={cn(s.datum, className)}>
      {above ? <div className={s.above}>{above}</div> : null}
      <p className={cn('caption', s.level)}>
        <span aria-hidden="true" className={s.mark} />
        <span className={s.label}>{label}</span>
      </p>
      {below ? <div className={s.below}>{below}</div> : null}
    </div>
  )
}
