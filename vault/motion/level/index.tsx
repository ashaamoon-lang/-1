/**
 * Level — a beam that comes to level once what it rests on arrives.
 *
 * Provenance: original work for this project. No third-party code copied.
 * CSS only: it settles when the `Reveal` it sits in arrives, through the
 * global reveal contract (`data-reveal` on an ancestor), and has no script or
 * loop of its own.
 *
 * ## What the motion says
 *
 * `Bearing` lands a load on a frame and `Dimension` measures a span; this is
 * the third thing a structure does — it holds level. Before the reveal the
 * beam is a cantilever, fixed at its start and hanging one gutter low at its
 * free end. As the reveal brings in what sits beneath it, the free end rises
 * to level in the house settle (`--ease-out-expo`) and stops there: no
 * overshoot (MOTION-SPEC §9.3), and rotation is the only thing that moves.
 *
 * The tilt is measured rather than chosen. `atan2` of one gutter over the
 * beam's own length — its container's inline size — puts the free end exactly
 * a gutter low at any width, so a phone and a desktop show the same sag rather
 * than the same angle.
 *
 * ## Reading it
 *
 * Decoration: `aria-hidden`, and nothing in it is text. What it rests on is
 * the caller's content, and arrives through the caller's reveal items.
 *
 * ## Reduced motion, and no script
 *
 * Both end level. Reduced motion drops the beat in this stylesheet; with no
 * script no ancestor is ever `hidden`, so the server-rendered beam is the
 * settled one (§9.4 rule 4).
 *
 * @example
 * ```tsx
 * <Reveal>
 *   <h2 data-reveal-item>…</h2>
 *   <Level />
 *   <ul>…</ul>
 * </Reveal>
 * ```
 */

import cn from 'clsx'

import s from './level.module.css'

interface LevelProps {
  className?: string | undefined
}

export function Level({ className }: LevelProps) {
  return (
    <div aria-hidden="true" className={cn(s.level, className)}>
      <div className={s.beam} />
    </div>
  )
}
