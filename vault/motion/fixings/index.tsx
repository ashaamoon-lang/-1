/**
 * Fixings — a plate arrives, and is fixed at its four corners.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: the plate is a reveal item, and the fixings follow the global
 * reveal contract (`data-reveal` on an ancestor); there is no script or loop
 * of its own.
 *
 * ## What the motion says
 *
 * A plate that has only been put in place has not been fixed. This one
 * arrives with the reveal, as everything on the page does, and then — once it
 * is where it belongs — it is fixed: a mark at each corner, set one after
 * another around the plate, each growing from its own centre the way a fixing
 * is driven home. The plate does not move again. Nothing overshoots
 * (MOTION-SPEC §9.3), and only the marks' `transform` changes after arrival.
 *
 * ## Reading it
 *
 * The marks are `aria-hidden` decoration: the plate's content is the caller's
 * and reads exactly as it would without them.
 *
 * ## Reduced motion, and no script
 *
 * Both show the plate fixed — every mark in place at once. Reduced motion
 * drops the beat in this stylesheet; with no script no ancestor is ever
 * `hidden`, so the marks are never taken out (§9.4 rules 3 and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <Fixings>…</Fixings>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './fixings.module.css'

/** Clockwise from the start of the first line, the order they are set in. */
const CORNERS = ['start-start', 'start-end', 'end-end', 'end-start'] as const

interface FixingsProps {
  children: ReactNode
  /** The element to render; the plate is a reveal item either way. */
  as?: 'div' | 'article' | undefined
  className?: string | undefined
}

export function Fixings({
  children,
  as: Element = 'div',
  className,
}: FixingsProps) {
  return (
    <Element data-reveal-item="" className={cn(s.plate, className)}>
      {children}
      {CORNERS.map((corner) => (
        <span
          key={corner}
          aria-hidden="true"
          className={s.fixing}
          data-corner={corner}
        />
      ))}
    </Element>
  )
}
