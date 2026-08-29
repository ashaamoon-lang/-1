'use client'

/**
 * Cursor — custom pointer with hover states.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Written from GSAP's public `quickTo` API and standard DOM events.
 *
 * Mount once, near the root of a layout. Any element in the tree can then
 * change the cursor's appearance by declaring `data-cursor`:
 *
 * ```tsx
 * <Cursor />                                  // in the layout
 * <a data-cursor="link">Work</a>              // grows, blends
 * <div data-cursor="view">…</div>             // shows a label
 * <div data-cursor="hidden">…</div>           // hides it (over video, say)
 * ```
 *
 * ## Why a custom cursor is usually a mistake, and when it is not
 *
 * A custom cursor replaces an OS-level affordance the user already trusts.
 * Done badly it lags, obscures what it points at, or disappears over an
 * `<input>`. Done well it is one of the strongest "this was made on purpose"
 * signals available.
 *
 * The rules this implementation follows:
 *
 * - **The native cursor is never hidden.** It stays visible underneath; this
 *   is an additive ring, not a replacement. Hiding the system cursor is what
 *   makes custom cursors feel broken, and it is unrecoverable if the script
 *   fails.
 * - **Fine pointers only.** Never mounted on touch, where there is no cursor.
 * - **`pointer-events: none`.** It can never intercept a click.
 * - **`aria-hidden`.** It is decoration and must not reach assistive tech.
 * - **Reduced motion still gets a cursor** — it simply stops lagging behind
 *   the pointer. Motion sensitivity is not a reason to remove a visual
 *   affordance, only to stop it moving on its own.
 */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { duration, easing } from '@/vault/motion/tokens'

import s from './cursor.module.css'

/** Values recognised in a `data-cursor` attribute. */
export type CursorState = 'default' | 'link' | 'view' | 'hidden'

const CURSOR_STATES = new Set<CursorState>([
  'default',
  'link',
  'view',
  'hidden',
])

function readCursorState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return 'default'
  const match = target.closest<HTMLElement>('[data-cursor]')
  const value = match?.dataset.cursor
  // SAFETY: `value` is arbitrary author-supplied text from a data attribute,
  // so it is checked against CURSOR_STATES before being treated as one. The
  // first cast only lets `Set.has` accept the wider string; the second is
  // reached only when that check passed. Anything unrecognised falls through
  // to 'default', so a typo in markup degrades rather than breaking.
  return value && CURSOR_STATES.has(value as CursorState)
    ? (value as CursorState)
    : 'default'
}

interface CursorProps {
  /** Label rendered inside the ring when an element declares `data-cursor="view"`. */
  viewLabel?: string | undefined
}

export function Cursor({ viewLabel = 'View' }: CursorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<CursorState>('default')
  // Gate mounting on a fine pointer. Starts false so server and first client
  // paint agree; the effect promotes it on capable devices only.
  const [isEnabled, setIsEnabled] = useState(false)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        setIsEnabled(false)
        return
      }
      setIsEnabled(true)

      const element = ref.current
      if (!element) return

      // Reduced motion: follow the pointer exactly, with no easing lag. The
      // cursor still exists — it just never animates of its own accord.
      const followDuration = prefersReducedMotion ? 0 : duration.fast
      const moveX = gsap.quickTo(element, 'x', {
        duration: followDuration,
        ease: easing.outQuart.gsap,
      })
      const moveY = gsap.quickTo(element, 'y', {
        duration: followDuration,
        ease: easing.outQuart.gsap,
      })

      const onPointerMove = (event: PointerEvent) => {
        moveX(event.clientX)
        moveY(event.clientY)
        setState(readCursorState(event.target))
      }

      // The pointer leaving the window should hide the ring rather than
      // freeze it at the last known edge position.
      const onPointerOut = (event: PointerEvent) => {
        if (!event.relatedTarget) setState('hidden')
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerout', onPointerOut)

      return () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerout', onPointerOut)
      }
    },
    { dependencies: [prefersReducedMotion] }
  )

  if (!isEnabled) return null

  return (
    <div ref={ref} className={s.cursor} data-state={state} aria-hidden="true">
      <span className={s.ring} />
      <span className={s.label}>{viewLabel}</span>
    </div>
  )
}
