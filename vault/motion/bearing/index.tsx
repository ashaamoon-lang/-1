'use client'

/**
 * Bearing — the frame arrives first, then the load settles onto it.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Wraps Satūs's `useReveal` (MIT, darkroom.engineering), as `Reveal` does;
 * the motion is CSS keyframes and transitions, with no loop of its own.
 *
 * ## What the motion says
 *
 * "Work that has to hold up" is a claim about structure, so this moves the
 * way structure is made. Posts rise from the ground and beams span between
 * them; only then does the load arrive — it lands on its beam, takes the
 * weight in a short compression, and settles. The compression is the press
 * grammar's own (`--press-scale`, `docs/MOTION-SPEC.md` §9.1: COMMIT is "a
 * compression before the release"), and the settle is `--ease-out-expo`
 * (§9.1: SETTLE). It never passes its resting place: §9.3 rejects overshoot
 * on the record, and a bounce would say the load is light.
 *
 * ## Markup contract
 *
 * The container owns the mechanism; the caller marks what is structure and
 * what is carried:
 *
 * - `data-bearing="span"` — a beam along the element's block-end edge.
 * - `data-bearing="post"` — a post along its inline-start edge. The two
 *   combine: `data-bearing="span post"`.
 * - `data-reveal-item data-bearing="load"` — something carried. It needs a
 *   box (`display: block` or `inline-block`) for the transform to apply. A
 *   load that is also a pressable noun (`data-press`) takes the compression;
 *   one that is not lands and settles without it.
 *
 * Nothing unmarked moves, so a block can be wrapped and marked piece by piece.
 *
 * ## Reduced motion, and no script
 *
 * Both end where the motion ends. `useReveal` reveals at once under reduced
 * motion and this stylesheet removes the beat, so the frame and its load are
 * there immediately. With no script the hidden state is never set — it is
 * scoped under `[data-reveal]`, as the global reveal contract is — so the
 * server-rendered frame is the finished one (§9.4 rule 4).
 *
 * @example
 * ```tsx
 * <Bearing>
 *   <div data-bearing="span post">
 *     <a href="/work/x" data-reveal-item data-bearing="load">…</a>
 *   </div>
 * </Bearing>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import { useReveal } from '@/lib/hooks/use-reveal'

import s from './bearing.module.css'

interface BearingProps {
  children: ReactNode
  /** The element to render. Defaults to `div`. */
  as?: 'div' | 'section' | undefined
  className?: string | undefined
  /**
   * Names the moment when the block that bears *is* the moment. Declared
   * rather than spread, for the reason `vault/motion/reveal` gives.
   */
  'data-epic'?: string | undefined
}

export function Bearing({
  children,
  as: Element = 'div',
  className,
  'data-epic': epic,
}: BearingProps) {
  // `HTMLDivElement` for the same reason `Reveal` gives: every tag `as`
  // accepts is a plain block container, and the hook reads only `dataset`
  // and `querySelectorAll`.
  const ref = useReveal<HTMLDivElement>()

  return (
    <Element
      ref={ref}
      className={cn(s.bearing, className)}
      {...(epic && { 'data-epic': epic })}
    >
      {children}
    </Element>
  )
}
