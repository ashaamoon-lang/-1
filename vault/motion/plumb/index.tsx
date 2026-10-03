/**
 * Plumb — a line let down beside a block as the reader goes down it.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only, and the only primitive in this set driven by the reader's scroll
 * rather than by a reveal: a CSS view timeline (`animation-timeline`), so the
 * browser runs it on the compositor with no script, no loop and no listener.
 *
 * ## What the motion says
 *
 * A plumb line is how a builder knows something is true: let it down beside
 * the work and it hangs straight. This one is let down beside a block as the
 * block comes up the screen — the line grows from the top and its bob travels
 * with its end, so the reader is the weight that pays it out. When the whole
 * block is on screen the line hangs its full length. It is tied to scroll
 * position, not to time, so it never runs ahead of the reader or past the end
 * of the block, and nothing it touches is content.
 *
 * ## Reading it
 *
 * The line and its bob are `aria-hidden` decoration. What hangs beside them is
 * the caller's content, laid out as it would be without them, one gutter in.
 *
 * ## Reduced motion, no script, and no support
 *
 * All three show the line let fully down: reduced motion removes the
 * animation in this stylesheet, no script changes nothing (it never needed
 * one), and a browser without scroll-driven animations never applies it —
 * the animation is declared only under `@supports`.
 *
 * @example
 * ```tsx
 * <Plumb>
 *   <ul>…</ul>
 * </Plumb>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './plumb.module.css'

interface PlumbProps {
  children: ReactNode
  className?: string | undefined
}

export function Plumb({ children, className }: PlumbProps) {
  return (
    <div className={cn(s.plumb, className)}>
      <span aria-hidden="true" className={s.line} />
      <span aria-hidden="true" className={s.carriage}>
        <span className={s.bob} />
      </span>
      {children}
    </div>
  )
}
