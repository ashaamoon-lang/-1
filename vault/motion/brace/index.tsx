/**
 * Brace — a bay that stands square because it is braced.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it follows the global reveal contract (`data-reveal` on an
 * ancestor) and has no script or loop of its own.
 *
 * ## What the motion says
 *
 * A frame of posts and a beam is not yet a structure: pushed sideways it
 * racks, and only a diagonal stops it. Each bay here arrives racked — leaning
 * a quarter of its height — then its brace goes in corner to corner and the
 * bay is pulled square, in order along the frame. It is the one primitive in
 * this set that shears (`skewX`), because racking is a shear; nothing else on
 * the page is touched, and nothing passes square (MOTION-SPEC §9.3).
 *
 * The geometry is computed, not chosen: the lean is `atan2` of a quarter
 * gutter over the bay's height, the brace is `hypot` of the bay's sides long
 * and set at `atan2` of them, so no angle is written down anywhere.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration. A bay marked `current` is drawn in the stronger
 * line, and the caller says in text which one that is.
 *
 * ## Reduced motion, and no script
 *
 * Both show every bay braced and square at once (§9.4 rules 3 and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <div aria-hidden="true">
 *     <Brace index={0} />
 *     <Brace index={1} current />
 *   </div>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './brace.module.css'

interface BraceProps {
  /** Its place along the frame, for the order the bays are squared in. */
  index?: number | undefined
  /** Drawn in the stronger line — the bay the page is about. */
  current?: boolean | undefined
  className?: string | undefined
}

export function Brace({ index = 0, current = false, className }: BraceProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(s.brace, className)}
      {...(current && { 'data-current': '' })}
      style={{ '--brace-index': index } as CSSProperties}
    >
      <span className={s.bay}>
        <span className={s.diagonal} />
      </span>
    </span>
  )
}
