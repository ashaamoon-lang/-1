'use client'

import type { LenisOptions } from 'lenis'

import 'lenis/dist/lenis.css'
import type { LenisRef, LenisProps as ReactLenisProps } from 'lenis/react'
import { ReactLenis } from 'lenis/react'
import { type ComponentType, useEffect, useRef, useState } from 'react'
import { useTempus } from 'tempus/react'

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
  useTempus(
    ({ time }) => {
      if (lenisRef.current?.lenis) {
        lenisRef.current.lenis.raf(time)
      }
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
