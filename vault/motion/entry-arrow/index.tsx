/**
 * EntryArrow — the arrow a plan draws at the door the reader came in by.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it is drawn once its parent carries `data-arrived`, plays once,
 * and has no script or loop of its own.
 *
 * ## What the motion says
 *
 * A plan marks the entrance with an arrow: this is where you come in. In a
 * case study's spine it marks the section a link brought the reader to — the
 * part a colleague copied and sent. It slides in from outside the row to the
 * edge it points across, and stays, so "you came in here" is still there
 * after the reader has moved on. Only its `transform` and `opacity` change.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the row's link names the section, and the browser
 * has already taken the reader to it.
 *
 * ## Placing it
 *
 * As the direct child of a positioned element; it sits just outside that
 * element's start edge, in the gutter.
 *
 * ## Reduced motion
 *
 * The arrow is simply there (§9.4 rule 3).
 *
 * @example
 * ```tsx
 * <li data-arrived="" style={{ position: 'relative' }}>
 *   <EntryArrow />
 *   <a href="#outcome">Outcome</a>
 * </li>
 * ```
 */

import cn from 'clsx'

import s from './entry-arrow.module.css'

interface EntryArrowProps {
  className?: string | undefined
}

export function EntryArrow({ className }: EntryArrowProps) {
  return <span aria-hidden="true" className={cn(s.arrow, className)} />
}
