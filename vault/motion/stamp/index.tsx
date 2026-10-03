/**
 * Stamp — a ruled mark struck onto the sheet once something has been done.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it plays once, when it mounts, and has no script or loop of its
 * own. Mount it again — a new `key` — to stamp again.
 *
 * ## What the motion says
 *
 * A drawing is marked when something has happened to it — issued, checked,
 * approved — and the mark is a stamp: it comes down, stops dead on the sheet,
 * and the ink is there. So the frame comes down half a gutter onto the page,
 * gathering speed as a hand does, and stops without a bounce (`MOTION-SPEC.md`
 * §9.3). The word appears only once the frame has met the sheet, so the word
 * itself never moves. Only the frame's `transform` and `opacity`, and the
 * ink's `opacity`, change.
 *
 * It is the one curve here that accelerates — `--ease-in-quart`, where the
 * grammar's own states ease out. A stamp is not set down, it is struck, and an
 * arrival that slowed before contact would read as hesitation. 350ms in all:
 * never faster than the press that caused it (§9.1).
 *
 * ## Reading it
 *
 * The word is real text, not decoration. Put the stamp in a live region — a
 * `role="status"` — and a screen reader announces what it says; a stamp
 * mounted again is a new node, and is announced again.
 *
 * ## Reduced motion
 *
 * The stamp is simply there (§9.4 rule 3). Without script nothing is done, so
 * nothing mounts one.
 *
 * @example
 * ```tsx
 * <span role="status">{done && <Stamp key={count}>Copied</Stamp>}</span>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './stamp.module.css'

interface StampProps {
  children: ReactNode
  className?: string | undefined
}

export function Stamp({ children, className }: StampProps) {
  return (
    <span className={cn(s.stamp, className)}>
      <span className={s.ink}>{children}</span>
    </span>
  )
}
