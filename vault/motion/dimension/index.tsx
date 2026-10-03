/**
 * Dimension — a span measured the way a drawing gives one: a witness line at
 * each end, a dimension line between them, and the value written above.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it draws when the `Reveal` it sits in arrives, through the global
 * reveal contract (`data-reveal` on an ancestor), and has no script or loop of
 * its own.
 *
 * ## What the motion says
 *
 * `Bearing` shows a frame taking its load; this shows a span being measured.
 * The witness lines drop first, then the dimension line runs out from its
 * centre to meet them, carrying the marks between the ends out to their
 * places — the length is established before anything is read off it. Nothing
 * lands, nothing compresses, and nothing runs past an end (MOTION-SPEC §9.3).
 *
 * ## Reading it
 *
 * The value and the two ends are text, and they arrive as the reveal's items.
 * The drawing is `aria-hidden`: everything it shows is in the text. The ends
 * are hidden too and read once, as one range, so a screen reader hears
 * `from`–`to` rather than two bare numbers. Marks are decorative by the same
 * reasoning — a caller with something to say about a mark says it in the
 * value.
 *
 * ## Reduced motion, and no script
 *
 * Both end drawn. Reduced motion drops the beat in this stylesheet; with no
 * script no ancestor is ever `hidden`, so the server-rendered drawing is the
 * finished one (§9.4 rule 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <Dimension from="2023" to="2025" marks={[0.5]}>
 *     6 engagements for 5 clients
 *   </Dimension>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

import s from './dimension.module.css'

/** One empty list for every call without marks, so the default is stable. */
const NO_MARKS: readonly number[] = []

interface DimensionProps {
  /** The measured value, written above the line. */
  children: ReactNode
  /** The two ends, written beside the witness lines. */
  from: string
  to: string
  /**
   * Places along the line, from 0 at `from` to 1 at `to`, for marks between
   * the ends. Decorative — see above.
   */
  marks?: readonly number[] | undefined
  className?: string | undefined
  /** Declared rather than spread, for the reason `vault/motion/reveal` gives. */
  'data-epic'?: string | undefined
}

export function Dimension({
  children,
  from,
  to,
  marks = NO_MARKS,
  className,
  'data-epic': epic,
}: DimensionProps) {
  return (
    <div
      className={cn(s.dimension, className)}
      {...(epic && { 'data-epic': epic })}
    >
      <span data-reveal-item="" className={s.value}>
        {children}
      </span>
      <span data-reveal-item="" className={s.end} aria-hidden="true">
        {from}
      </span>
      <span className={s.line} aria-hidden="true">
        <span className={s.rule}>
          {marks.map((at) => (
            <span
              key={at}
              className={s.mark}
              style={{ '--dimension-at': at } as CSSProperties}
            />
          ))}
        </span>
      </span>
      <span data-reveal-item="" className={s.end} aria-hidden="true">
        {to}
      </span>
      <span className="sr-only">{`${from}–${to}`}</span>
    </div>
  )
}
