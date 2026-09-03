'use client'

/**
 * Which item in an ordered run the reader is currently on.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on GSAP ScrollTrigger — see `docs/PROVENANCE.md` §2 on GSAP licensing.
 *
 * ## Why this is a hook and not two copies
 *
 * It was written inside `vault/blocks/step-sequence` in Tahap 25, for the
 * studio page's process. Tahap 27 needed exactly the same behaviour for the
 * journal index, and copying it would have made "which one is being read" a
 * thing this project answers twice, in two files, that could drift.
 *
 * The extraction is also the argument for the effect at all. `CLAUDE.md`
 * closes on restraint applied *consistently*, and a mechanism that lives on
 * one page is not a vocabulary — it is an exception. This is the same case
 * Tahap 23 made about the entrance reveal, made again one level down.
 *
 * ## The reading band
 *
 * `top 60%` → `bottom 40%` is the middle of the viewport: an item becomes the
 * one being read when it reaches where a reader's eye actually sits, not when
 * its first pixel appears at the bottom of the screen. `onEnterBack` reports
 * on the way up too, so the answer is correct in both directions rather than
 * only while scrolling down.
 *
 * ## Reduced motion
 *
 * No trigger is created at all, and the index stays at 0. Consumers must not
 * rely on that to keep content visible — the stylesheet has to promise it, or
 * every item after the first sits at the receded value permanently. Both
 * consumers do this in a `@media (--reduced-motion)` block, and
 * `e2e/motion.e2e.ts` measures it on each.
 */

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'
import { useState } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

// Registered here as well as in `components/effects/gsap.tsx` so a consumer is
// correct even when it renders before that bridge is dynamically imported.
// `registerPlugin` is idempotent.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function useActiveInSequence(
  rootRef: RefObject<HTMLElement | null>,
  /** Attribute selector for the items, e.g. `'[data-step]'`. */
  selector: string,
  /** Re-create the triggers when this changes — usually the item count. */
  count: number
): number {
  const [active, setActive] = useState(0)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      /*
       * Read from `matchMedia` as well as the hook, for the reason
       * `vault/motion/text-reveal` records: the hook's *server* snapshot is
       * `false`, so the first commit — the one this effect runs in — sees
       * `false` even for a reader who has the preference on. Inside an effect
       * we are on the client and `matchMedia` is truthful now.
       */
      const reduced =
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) return

      const items = [...root.querySelectorAll(selector)]
      if (items.length === 0) return

      const triggers = items.map((item, index) =>
        ScrollTrigger.create({
          trigger: item,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => setActive(index),
          onEnterBack: () => setActive(index),
        })
      )

      return () => {
        for (const trigger of triggers) trigger.kill()
      }
    },
    { scope: rootRef, dependencies: [prefersReducedMotion, selector, count] }
  )

  return active
}
