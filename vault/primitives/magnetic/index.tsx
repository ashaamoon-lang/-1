'use client'

/**
 * Magnetic — pointer-attracted wrapper.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The magnetic-button interaction is a widely-reproduced technique with no
 * single owner; this implementation was written from GSAP's public
 * `quickTo` API. Sources of the *idea* include agency portfolios generally;
 * no implementation was consulted or copied.
 *
 * The child drifts toward the pointer while it is within `radius`, then
 * springs back on leave. Used on primary CTAs and nav items, it is one of the
 * cheapest interactions that reads as "considered" rather than "default".
 *
 * ## Why `quickTo`
 *
 * A naive version calls `gsap.to()` on every `pointermove`, allocating a new
 * tween per event — dozens per second, each one garbage. `gsap.quickTo()`
 * builds one reusable setter and mutates its target, which is what makes this
 * cheap enough to put on several elements at once.
 *
 * ## Accessibility
 *
 * - The effect is pointer-only. Keyboard focus is untouched, and because the
 *   transform never moves the element far, the focus ring stays where the user
 *   expects.
 * - Disabled entirely under `prefers-reduced-motion`, and on coarse pointers
 *   (touch), where there is no hover to track and the listener would be waste.
 * - This component renders a `<span>` wrapper and adds no semantics. Put a real
 *   `<button>` or `<a>` inside it — the magnet is decoration over an
 *   accessible control, never a replacement for one.
 *
 * @example
 * ```tsx
 * <Magnetic>
 *   <button type="button">Start a project</button>
 * </Magnetic>
 * ```
 */

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import type { ReactNode } from 'react'
import { useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { duration, easing } from '@/vault/motion/tokens'

import s from './magnetic.module.css'

interface MagneticProps {
  children: ReactNode
  /**
   * How far the pointer can be, in px beyond the element's own bounds, and
   * still attract it. Larger values feel heavier and start earlier.
   */
  radius?: number | undefined
  /**
   * Fraction of the pointer's offset the element travels. 0.3 is a firm,
   * confident pull; above ~0.5 the element outruns the cursor and reads as
   * unstable rather than premium.
   */
  strength?: number | undefined
  className?: string | undefined
}

export function Magnetic({
  children,
  radius = 80,
  strength = 0.3,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const element = ref.current
      if (!element || prefersReducedMotion) return

      // Coarse pointer (touch): no hover to follow, so the listeners would
      // only ever cost. Checked here rather than in CSS because the whole
      // behaviour, not just its styling, is conditional.
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        return
      }

      // One reusable setter per axis, rather than a fresh tween per event.
      const moveX = gsap.quickTo(element, 'x', {
        duration: duration.base,
        ease: easing.outQuart.gsap,
      })
      const moveY = gsap.quickTo(element, 'y', {
        duration: duration.base,
        ease: easing.outQuart.gsap,
      })

      const onPointerMove = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect()
        const centerX = bounds.left + bounds.width / 2
        const centerY = bounds.top + bounds.height / 2
        const deltaX = event.clientX - centerX
        const deltaY = event.clientY - centerY

        // Attract only inside the radius, measured from the element's edges
        // rather than its centre — otherwise a wide button attracts from much
        // further away horizontally than vertically.
        const withinX = Math.abs(deltaX) < bounds.width / 2 + radius
        const withinY = Math.abs(deltaY) < bounds.height / 2 + radius

        if (withinX && withinY) {
          moveX(deltaX * strength)
          moveY(deltaY * strength)
        } else {
          moveX(0)
          moveY(0)
        }
      }

      const onPointerLeave = () => {
        moveX(0)
        moveY(0)
      }

      // Listening on window, not the element: tracking must begin *before* the
      // pointer arrives, or the element only starts moving once the cursor is
      // already on it and the magnetism is invisible. Passive — never blocks
      // scrolling.
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      element.addEventListener('pointerleave', onPointerLeave)

      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        element.removeEventListener('pointerleave', onPointerLeave)
        // Return to origin so a remount (or a reduced-motion switch) never
        // leaves the element stranded off-centre.
        gsap.set(element, { x: 0, y: 0 })
      }
    },
    { scope: ref, dependencies: [prefersReducedMotion, radius, strength] }
  )

  return (
    <span ref={ref} className={cn(s.magnetic, className)}>
      {children}
    </span>
  )
}
