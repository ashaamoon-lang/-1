'use client'

/**
 * PageTransition — route-change overlay.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on Next.js's `onNavigate`/`usePathname`, both public APIs.
 *
 * Mount once in a layout, above `{children}`. A panel sweeps up across the
 * viewport when a navigation *starts* and continues off the top once the new
 * route has committed.
 *
 * ```tsx
 * // app/[locale]/layout.tsx
 * <PageTransition />
 * {children}
 * ```
 *
 * ## Two bugs this component shipped with
 *
 * Neither was noticed, because it was never mounted. It sat in `vault/motion/`
 * for ten stages, complete with a story and reduced-motion handling, doing
 * nothing (`docs/stages/TAHAP-11.md` §2.4). A component that is never
 * rendered is never wrong, which is the most expensive kind of finished.
 *
 * **It ran at the wrong moment.** The whole cover-then-reveal sequence fired
 * from a `usePathname()` change — and a pathname change is the moment the
 * **new** route has already rendered. The reader would have watched the page
 * they asked for get progressively covered, then uncovered: 1.2 seconds spent
 * hiding the thing they were waiting to see. A transition needs two moments
 * and the App Router publishes only one; `lib/motion/navigation-signal.ts`
 * supplies the other from `onNavigate` on `<Link>`, which fires only for real
 * client-side navigations — never for a modified click, a new-tab click, or
 * an external href.
 *
 * **It cost GSAP to do a job CSS does.** GSAP is mounted per page here
 * (`components/layout/wrapper`), and only the home page opts in — so a
 * GSAP-driven overlay would have animated on exactly one route, which for a
 * transition is the same as none. Turning GSAP on everywhere to fix that
 * would have put ~69KB on every route to move one element along one axis.
 * `vault/motion/README.md` is explicit: reach for CSS before GSAP. This costs
 * nothing and runs on the compositor.
 *
 * ## One axis, and why
 *
 * The panel translates rather than scaling. A scale wipe has to flip its
 * transform origin between the two halves, and a navigation that resolves
 * mid-cover — the common case, since routes here are prerendered and
 * prefetched — would jump as the anchor moved. Translating on one axis has no
 * anchor to move: interrupt it anywhere and the panel simply carries on out
 * of the top.
 *
 * ## Timing
 *
 * Cover is fast, reveal is slower. That is the asymmetry the `ui-ux-pro-max`
 * motion data asks for — *"exit animation should always resolve faster than
 * entrance so back/forward feels snappy"* — and it is also the honest shape:
 * covering happens while the reader is waiting, and every millisecond of it
 * is latency they can feel; uncovering happens once the page is there.
 *
 * Navigation is never blocked on either.
 *
 * ## The failure mode that matters
 *
 * An overlay that covers and never uncovers is a blank screen. Three things
 * prevent it:
 *
 *   - the CSS parks the panel below the viewport, so with no JavaScript at
 *     all the overlay is simply absent rather than stuck;
 *   - `maxWait` uncovers regardless if the route never commits — a cancelled
 *     navigation, a same-route link, a failed fetch. The `ui-ux-pro-max`
 *     guidance names this exactly: *"don't tie the overlay's reveal directly
 *     to data-fetch completion without a max-wait timeout"*;
 *   - the reveal is a single terminal state, so an interrupted cover cannot
 *     strand the panel part-way.
 *
 * ## Accessibility
 *
 * - `aria-hidden` and `pointer-events: none` — the overlay is decoration and
 *   can never trap focus or swallow a click.
 * - Under `prefers-reduced-motion` the overlay removes itself. There is no
 *   "reduced" version worth showing: a full-viewport wipe is precisely the
 *   kind of large-area motion the preference exists to suppress, and the
 *   route change is already communicated by the content changing.
 *
 *   Precisely: it removes itself *on hydration*. `usePreferredReducedMotion`
 *   reads a media query and the server has no media to query, so the markup
 *   is in the server-rendered HTML for every reader — measured, not assumed
 *   (`e2e/motion.e2e.ts`). The CSS `@media (--reduced-motion) { display:
 *   none }` rule is what covers that window, which makes it load-bearing
 *   rather than the belt-and-braces it is labelled as. The panel is never
 *   visible to a reader who asked for no motion; it is briefly present.
 * - Route changes are announced by the browser's own navigation handling; this
 *   component adds no live region, because a decorative wipe should not be
 *   narrated.
 */

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { subscribeNavigation } from '@/lib/motion/navigation-signal'

import s from './page-transition.module.css'

/**
 * `idle` parks the panel below the viewport with no transition, so returning
 * to it after a reveal is instant and invisible rather than a slide back down.
 */
type State = 'idle' | 'covering' | 'revealing'

interface PageTransitionProps {
  /**
   * Milliseconds to wait for a route commit before revealing anyway.
   *
   * Not a timing choice — a safety net, so a navigation that never produces a
   * pathname change cannot leave a panel over a working page.
   */
  maxWait?: number | undefined
}

export function PageTransition({ maxWait = 2000 }: PageTransitionProps) {
  const [state, setState] = useState<State>('idle')
  const pathname = usePathname()
  const prefersReducedMotion = usePreferredReducedMotion()

  // Set while a navigation is in flight, so the pathname effect can tell a
  // covered route change from a first paint, a back button, or a hash change.
  const covering = useRef(false)
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reveal = useCallback(() => {
    if (!covering.current) return
    covering.current = false
    if (safety.current) clearTimeout(safety.current)
    setState('revealing')
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    return subscribeNavigation(() => {
      covering.current = true
      setState('covering')
      if (safety.current) clearTimeout(safety.current)
      safety.current = setTimeout(reveal, maxWait)
    })
  }, [maxWait, prefersReducedMotion, reveal])

  // The other half of the pair: the new route has committed. `reveal` no-ops
  // unless a navigation actually covered the screen.
  useEffect(() => {
    reveal()
  }, [pathname, reveal])

  useEffect(
    () => () => {
      if (safety.current) clearTimeout(safety.current)
    },
    []
  )

  if (prefersReducedMotion) return null

  return (
    <div
      className={s.overlay}
      data-state={state}
      aria-hidden="true"
      // Park it again once it has left the top of the screen. Off-screen at
      // both ends, so the reset is never visible.
      onTransitionEnd={() => {
        if (state === 'revealing') setState('idle')
      }}
    />
  )
}
