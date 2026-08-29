'use client'

/**
 * PageTransition — route-change overlay.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on Next.js's `usePathname` and GSAP timelines, both public APIs.
 *
 * Mount once in a layout, above `{children}`. It watches the pathname and
 * runs a cover → reveal sequence whenever the route changes.
 *
 * ```tsx
 * // app/(site)/layout.tsx
 * <PageTransition />
 * {children}
 * ```
 *
 * ## What this does and does not solve
 *
 * This is a **visual** transition: an overlay covers the viewport, the route
 * swaps underneath, the overlay leaves. It deliberately does **not** delay
 * navigation or gate rendering on the animation. Next.js has already
 * committed the new route by the time the reveal runs, so the transition
 * never makes the site slower than it is — it only makes the change legible.
 *
 * A true exit animation for the *outgoing* page (holding the old DOM while it
 * animates away) is not possible in the App Router without keeping a snapshot
 * of the previous tree. That is a large amount of machinery for a small
 * payoff, and it is the usual reason page transitions in Next projects end up
 * janky. This implementation is honest about the constraint instead of
 * fighting it: the cover hides the swap, which is what the eye reads as a
 * transition anyway.
 *
 * ## Accessibility
 *
 * - `aria-hidden` and `pointer-events: none` — the overlay is decoration and
 *   can never trap focus or swallow a click.
 * - Under `prefers-reduced-motion` the overlay is not rendered at all. There
 *   is no "reduced" version worth showing: a full-viewport wipe is precisely
 *   the kind of large-area motion the preference exists to suppress, and the
 *   route change is already communicated by the content changing.
 * - Route changes are announced by the browser's own navigation handling; this
 *   component adds no live region, because a decorative wipe should not be
 *   narrated.
 */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import { duration, easing } from '../tokens'

import s from './page-transition.module.css'

interface PageTransitionProps {
  /**
   * Total budget for cover + reveal, in seconds. `MOTION-SPEC.md` §7 sets the
   * range at 0.8–1.2s; the default sits at the confident end of it.
   */
  total?: number | undefined
}

export function PageTransition({
  total = duration.choreographed,
}: PageTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const overlay = overlayRef.current
      if (!overlay || prefersReducedMotion) return

      // Split the budget: the cover is quicker than the reveal. An overlay
      // that arrives fast and leaves slowly reads as deliberate; the reverse
      // reads as a stall.
      const coverDuration = total * 0.4
      const revealDuration = total * 0.6

      const timeline = gsap.timeline()

      timeline
        .fromTo(
          overlay,
          { scaleY: 0, transformOrigin: 'bottom' },
          { scaleY: 1, duration: coverDuration, ease: easing.outQuart.gsap }
        )
        .to(overlay, {
          scaleY: 0,
          transformOrigin: 'top',
          duration: revealDuration,
          ease: easing.outExpo.gsap,
        })

      return () => {
        timeline.kill()
      }
    },
    // Re-runs on every pathname change — that is the trigger.
    { dependencies: [pathname, prefersReducedMotion, total] }
  )

  // No overlay at all under reduced motion; nothing to hide or unhide.
  if (prefersReducedMotion) return null

  return <div ref={overlayRef} className={s.overlay} aria-hidden="true" />
}
