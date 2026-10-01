'use client'

import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { PARALLAX_PLANES, type ParallaxPlane, useParallax } from './index'

/**
 * Puts its children on a named depth plane, and publishes how far they travel.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why the hook was not enough
 *
 * Tahap 80 gave `useParallax` a `plane` option and stopped there, which left
 * every consumer needing three things at once: a client component, a ref, and
 * a wrapper element. That is four lines repeated per call site, which is where
 * a system stops being one — and it is worse than merely repetitive inside a
 * list, because a ref per item cannot come from a hook in a loop. A component
 * is the only shape that works there.
 *
 * ## `--plane-travel`, and the failure it exists to prevent
 *
 * A layer that moves inside a clipped frame must be **taller than the frame by
 * its own travel**, or it shows the frame's own background at the ends of every
 * pass. This repository has already paid for that: `project-card.module.css`
 * records Tahap 43, where a layer sized against the hook's default distance
 * while the hook moved it further made `e2e/continuous-motion.e2e.ts` report
 * **two exposed plates at three of four scroll positions**. The fix there was
 * `--card-drift`, set from the same number handed to the hook, "so the two
 * cannot drift apart".
 *
 * Named planes make that risk worse rather than better, and the reason is the
 * whole point of naming: a caller writing `plane="subject"` deliberately does
 * **not** know the number. So this publishes it. The frame's stylesheet sizes
 * the overshoot from `--plane-travel` and never restates the value:
 *
 * ```css
 * .frame  { position: relative; overflow: clip; aspect-ratio: 4 / 5; }
 * .layer  {
 *   position: absolute;
 *   inset-inline: 0;
 *   inset-block-start: calc((var(--plane-travel) + 4) * -0.5%);
 *   block-size: calc(100% + (var(--plane-travel) + 4) * 1%);
 * }
 * ```
 *
 * ## Why `+ 4`, when `project-card` uses `+ 2`
 *
 * Because the margin feeds the travel. GSAP's `yPercent` is a share of the
 * element's **own** height, and the overshoot has just made that height larger
 * than the frame — so widening the margin also lengthens the trip it has to
 * absorb. Writing the constant as `k`, the layer is `100 + t + k` percent of
 * the frame, offset by `-(t + k) / 2`, and travels
 * `(t / 2) * (100 + t + k) / 100` from there. It stays covered only while
 *
 * ```
 * (t + k) / 2  >=  (t / 2) * (100 + t + k) / 100
 * ```
 *
 * At `k = 2` that holds up to **t = 13.2**, and `foreground` is **14** — so
 * the top rung of the ladder would have exposed the frame edge, which is
 * exactly the Tahap 43 failure this property exists to prevent.
 * `project-card` never met it because its largest measured drift is 9.
 *
 * `k = 4` clears all four rungs with room to spare: 1.84% of the frame at
 * `ground`, 1.70% at `mid`, 1.30% at `subject`, 0.74% at `foreground`. The
 * remaining margin is the sub-pixel headroom `project-card` documents — a
 * layer sized to exactly its travel lands flush with the frame edge and shows
 * a hairline at fractional device pixel ratios.
 *
 * A layer that is **not** inside a clipped frame needs none of this, and simply
 * ignores the property.
 *
 * ## What it must not wrap
 *
 * **Media and ornament only.** `e2e/continuous-motion.e2e.ts` asserts that no
 * paragraph or list item ever acquires a scroll-linked transform, and the
 * preset gives the reason rather than the rule: "Don't parallax body copy; it
 * hurts reading comfort and can trigger motion sickness."
 *
 * **Not a `position: fixed` layer.** A fixed ornament is already at rate zero,
 * which is slower than any plane here — `useParallax`'s own doc records why
 * placing one deepens nothing and drags its edge into view instead.
 *
 * ## Why a plain `<div>` and no `as` prop
 *
 * The element exists to carry a transform. Letting a caller pick the tag
 * invites `<p>` and `<li>`, which are exactly the two the gate forbids; a
 * `<div>` cannot become either by accident.
 *
 * Under `prefers-reduced-motion` the hook creates no ScrollTrigger at all, so
 * this renders as an ordinary wrapper and the layer sits where the layout put
 * it (`CLAUDE.md` #5). `--plane-travel` is still published, which is correct:
 * the frame keeps its overshoot and the picture keeps the position it has at
 * rest, rather than reflowing when the preference changes.
 */
export function Plane({
  plane,
  className,
  children,
}: {
  /** Which depth plane the children sit on. */
  plane: ParallaxPlane
  className?: string | undefined
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useParallax(ref, { plane })

  // SAFETY: CSS custom properties are valid in a React style object at
  // runtime; `CSSProperties` has no index signature to express one. Same
  // shape as `vault/blocks/project-card`'s `parallaxStyle`.
  const style = { '--plane-travel': PARALLAX_PLANES[plane] } as CSSProperties

  return (
    <div ref={ref} style={style} {...(className && { className })}>
      {children}
    </div>
  )
}
