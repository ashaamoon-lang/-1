'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

/**
 * Differential depth: media that moves a little slower than its frame.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Parameters translated from `ui-ux-pro-max --domain gsap`, "Parallax Scroll
 * (Subtle)": `yPercent` 5–15, `ease: 'none'`, scrub.
 *
 * ## Why this exists now, having been argued away once
 *
 * Tahap 23 wrote the reasoning for a parallax primitive and then did not
 * install one, on the grounds that the work plates are `object-fit: cover`
 * and a gallery does not need the trick. That was defensible per-decision and
 * wrong in aggregate: Tahap 33 measured the result, and the catalogue — the
 * portfolio page — had **one distinct frame across four and a half screens**,
 * with zero of seventy-nine elements carrying a transform at any scroll
 * position. The site's motion was entrance motion. Blocks arrived and froze.
 *
 * ## The rule it does not break
 *
 * **Media only, never prose.** That is the preset's own instruction ("Don't
 * parallax body copy; it hurts reading comfort"), it is what Tahap 23 was
 * right about, and it is why this hook takes a ref to a media wrapper rather
 * than being sprinkled on a section. A gate asserts no paragraph ever
 * acquires a scroll-linked transform.
 *
 * ## How far, and why so little
 *
 * The default is the bottom of the preset's range. A plate is already the
 * loudest thing on the page; the job here is to stop the page being dead
 * still, not to make the artwork swim. The preset warns that a large delta
 * makes foreground and background desync distractingly, and on a grid of
 * plates that reads as a wobble rather than as depth.
 *
 * Under `prefers-reduced-motion` no trigger is created at all and the element
 * keeps its own untransformed position, so content ends exactly where the
 * layout put it (`CLAUDE.md` #5).
 */

// Registered here as well as in `components/effects/gsap.tsx` so a consumer is
// correct even when it renders before that bridge is dynamically imported.
// `registerPlugin` is idempotent.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ParallaxOptions {
  /**
   * How far the media travels across its own scroll pass, as a percentage of
   * its height. The preset's range is 5–15; this project uses the quiet end.
   */
  distance?: number
  /**
   * Smoothing between the scroll position and the transform, in seconds.
   * `0.5` is the preset's own value for a layered scrub — it takes the
   * jitter out of a trackpad without the media lagging behind the page.
   */
  smoothing?: number
}

/**
 * Attach to the element that wraps a picture — never to a text block.
 *
 * @example
 * ```tsx
 * const media = useRef<HTMLDivElement>(null)
 * useParallax(media)
 * return <div ref={media} className={s.media}><img … /></div>
 * ```
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  { distance = 6, smoothing = 0.5 }: ParallaxOptions = {}
) {
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const element = ref.current
      if (!element) return

      /*
       * Read `matchMedia` as well as the hook, for the reason
       * `vault/motion/text-reveal` records: the hook's server snapshot is
       * `false`, so the first commit — the one this effect runs in — sees
       * `false` even for a reader who has the preference on.
       */
      const reduced =
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) return

      /*
       * From `+distance/2` to `-distance/2`, so the media sits exactly where
       * the layout put it when it is centred in the viewport. Anchoring the
       * travel around the midpoint is what keeps a grid of plates aligned
       * with their captions at the moment a reader is actually looking at
       * them; running 0 → -distance would leave every plate offset from its
       * own caption for most of its pass.
       */
      const tween = gsap.fromTo(
        element,
        { yPercent: distance / 2 },
        {
          yPercent: -distance / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: smoothing,
          },
        }
      )

      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { dependencies: [prefersReducedMotion, distance, smoothing] }
  )
}
