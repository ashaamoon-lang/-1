/**
 * Formwork — an item arrives inside its form, and the form is struck.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it follows the global reveal contract (`data-reveal` on an
 * ancestor, `--reveal-index` on the item), and has no script or loop of its
 * own.
 *
 * ## What the motion says
 *
 * Every other moment in this set adds structure — `Bearing` a frame, a
 * `Dimension` its measure, a `Level` its beam. This one takes structure away,
 * which is the test a built thing actually faces: the formwork comes off, and
 * what was cast inside it has to stand on its own. Each item arrives with a
 * dashed form around it, holds for a beat, and then the form is struck — it
 * fades and drops half a gutter, the way struck formwork falls rather than
 * lifts. The item itself does not move again. Nothing overshoots
 * (MOTION-SPEC §9.3), and only the form's `opacity` and `transform` change.
 *
 * ## Reading it
 *
 * The form is a pseudo-element: no text, no role, nothing to announce. The
 * finished state has no form at all, so nothing the reader is left looking at
 * depends on it.
 *
 * ## Reduced motion, and no script
 *
 * Both show the struck state — the item, without its form. With no script no
 * ancestor is ever `hidden`, so the form is never put up; under reduced motion
 * this stylesheet keeps it down (§9.4 rules 3 and 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <ul>
 *     <Formwork as="li">…</Formwork>
 *   </ul>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './formwork.module.css'

interface FormworkProps {
  children: ReactNode
  /** The element to render; the item is a reveal item either way. */
  as?: 'div' | 'li' | undefined
  className?: string | undefined
}

export function Formwork({
  children,
  as: Element = 'div',
  className,
}: FormworkProps) {
  return (
    <Element data-reveal-item="" className={cn(s.formwork, className)}>
      {children}
    </Element>
  )
}
