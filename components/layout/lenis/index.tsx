'use client'

import type { LenisOptions } from 'lenis'

import 'lenis/dist/lenis.css'
import type { LenisRef, LenisProps as ReactLenisProps } from 'lenis/react'
import { ReactLenis } from 'lenis/react'
import { type ComponentType, useEffect, useRef, useState } from 'react'
import { useTempus } from 'tempus/react'

import { scrollVelocity } from '@/lib/motion/scroll-velocity'

/**
 * Loads the ScrollTrigger bridge only once a page has asked for it.
 *
 * This was `next/dynamic(() => import('./scroll-trigger'))`, which is lazy
 * about *evaluating* the module and not about *fetching* it: a module-scope
 * reference inside a client component puts the chunk in the page's graph, so
 * GSAP core shipped to every route with a `<Wrapper>` — measured at 26.8KB
 * gzipped on `/en/work/*`, which opts into neither `gsap` nor `webgl`, and
 * whose own feature flag documents that "a site that never animates should
 * not pay for it" (`docs/AUDIT-2026-08.md` §Tier 4).
 *
 * Identical shape to the fix in `lib/webgl/components/canvas` and
 * `vault/webgl/scene-shell`; `e2e/route-budget.e2e.ts` holds all three.
 */
function useScrollTriggerSync(enabled: boolean): ComponentType | null {
  const [Sync, setSync] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!enabled || Sync) return

    let cancelled = false
    import('./scroll-trigger')
      .then(({ LenisScrollTriggerSync }) => {
        // Thunk: `setState` treats a bare function as an updater.
        if (!cancelled) setSync(() => LenisScrollTriggerSync)
      })
      .catch(() => {
        // Degrade quietly. Without the bridge GSAP runs on its own ticker
        // rather than in Tempus order — scrubbed ScrollTriggers may render a
        // frame behind, which is the documented cost of not mounting it.
      })

    return () => {
      cancelled = true
    }
  }, [enabled, Sync])

  return Sync
}

/**
 * The velocity that counts as "moving fast", in Lenis' own units.
 *
 * Chosen from what a normal wheel gesture actually produces rather than from
 * a round number: a firm flick reaches roughly this, so the normalised value
 * spends its time in the part of the range consumers were tuned against and
 * only saturates on a deliberate throw.
 */
const VELOCITY_SCALE = 40

/** Beyond this the value stops meaning "faster" and starts meaning "thrown". */
const VELOCITY_CLAMP = 1

/**
 * Below this change, republishing costs a style invalidation and buys nothing
 * a reader could see.
 */
const VELOCITY_EPSILON = 0.004

function clampVelocity(value: number): number {
  return Math.min(VELOCITY_CLAMP, Math.max(-VELOCITY_CLAMP, value))
}

interface LenisProps extends Omit<ReactLenisProps, 'ref'> {
  root: boolean
  options: LenisOptions
  syncScrollTrigger?: boolean
}

export function Lenis({
  root,
  options,
  syncScrollTrigger = false,
}: LenisProps) {
  const ScrollTriggerSync = useScrollTriggerSync(syncScrollTrigger && root)

  const lenisRef = useRef<LenisRef>(null)

  // order: 5 — Lenis writes scroll state; GSAP's updateRoot (order: 10, see
  // components/effects/gsap.tsx) reads it for scrubbed ScrollTriggers. Without
  // an explicit order the sequencing is mount-order luck, and a scrub tween
  // would render one frame behind the scroll.
  /*
   * The reader's own movement, published once for anything that wants it.
   *
   * Lenis has computed a velocity all along and nothing read it. Tahap 33
   * measured what that meant: outside the entrance animations, this site did
   * not move at all — the catalogue had one distinct frame across four and a
   * half screens. So the velocity becomes an input the stylesheet can reach,
   * and things respond to it continuously rather than once on arrival.
   *
   * Written **inside the callback Lenis already runs**, at the moment its
   * scroll state is fresh. Not a second `requestAnimationFrame` loop — the
   * one `CLAUDE.md` #6 forbids — and not a scroll event listener, which fires
   * at a different cadence than the frame that would read it.
   *
   * `--scroll-velocity` is normalised to roughly -1..1 and only ever read by
   * `transform`, so it can never trigger layout. It is written on the root
   * element so a value set once is visible to every consumer, and skipped
   * entirely when it has not meaningfully changed — a custom property write
   * invalidates style for its subtree, and doing that sixty times a second
   * for an unchanged number is pure cost.
   */
  const publishedVelocity = useRef(0)

  useTempus(
    ({ time }) => {
      const lenis = lenisRef.current?.lenis
      if (!lenis) return

      lenis.raf(time)

      const normalised = clampVelocity(lenis.velocity / VELOCITY_SCALE)
      if (Math.abs(normalised - publishedVelocity.current) < VELOCITY_EPSILON) {
        return
      }

      publishedVelocity.current = normalised
      // Two readers, one number: the stylesheet, and anything on the GPU that
      // cannot read a custom property. See `lib/motion/scroll-velocity.ts`.
      scrollVelocity.current = normalised
      document.documentElement.style.setProperty(
        '--scroll-velocity',
        normalised.toFixed(3)
      )
    },
    { order: 5 }
  )

  return (
    <ReactLenis
      ref={lenisRef}
      root={root}
      options={{
        ...options,
        lerp: options?.lerp ?? 0.125,
        autoRaf: false,
        anchors: true,
        autoToggle: true,
        prevent: (node: Element | null) =>
          node?.nodeName === 'VERCEL-LIVE-FEEDBACK' ||
          node?.id === 'theatrejs-studio-root' ||
          // react-scan renders its panel into a shadow root on this host;
          // composedPath() pierces the shadow boundary so the id is matchable.
          node?.id === 'react-scan-root',
      }}
    >
      {ScrollTriggerSync && (
        /*
         * Not created during render: the module's own export, fetched once
         * and held in state, so its identity is stable across renders.
         */
        // oxlint-disable-next-line react/static-components
        <ScrollTriggerSync />
      )}
    </ReactLenis>
  )
}
