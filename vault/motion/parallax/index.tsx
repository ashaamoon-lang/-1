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

/**
 * Named depth planes, and the ladder they stand on.
 *
 * ## Why names rather than numbers at each call site
 *
 * Parallax reads as depth only when layers keep a *relationship*. Tuned one
 * component at a time, the numbers drift apart and the effect degrades into
 * several things moving at several speeds — which the preset names as the way
 * this goes wrong: "vary speed per layer (background slowest, foreground
 * fastest) to sell the depth illusion".
 *
 * ## The ladder is measured, not invented
 *
 * `ui-ux-pro-max --domain gsap` gives the shape as `yPercent: (i + 1) * -8`,
 * which would be 8 / 16 / 24 / 32. **Those numbers are not used**: this site
 * runs deliberately quieter — the hook's default is 6, the bottom of the
 * preset's own 5–15 band, because a plate is already the loudest thing on the
 * page. Taking the skill's absolute values would have been adopting a register
 * this project rejected on purpose.
 *
 * So the shape is the skill's and the values are this site's. Three of the four
 * are already on screen and already measured:
 *
 *   ground      4   `work-constellation`'s slow column (Tahap 43)
 *   mid         6   this hook's own default since Tahap 33
 *   subject    10   `project-gallery`'s PLATE_DRIFT (Tahap 56)
 *   foreground 14   the only new one — the top of the preset's 5–15 band
 *
 * ## Four, and not more
 *
 * The preset is explicit: "Layer count beyond 3-4 has diminishing visual return
 * and multiplies scroll-listener cost." Four is the ceiling, so the type is a
 * closed set rather than a number a caller can keep raising.
 *
 * ## There is a fifth plane, and it is not in this object
 *
 * `position: fixed` is the degenerate case: **rate zero**, slower than any
 * distance here can be. `/studio` and `/practice/<value>` already reach it that
 * way — their `DotPattern` is `position: fixed; inset: 0`, so it does not
 * travel with the page at all.
 *
 * This matters because the obvious next move is wrong. Attaching `ground` to
 * one of those ornaments does not deepen it; it makes a background that is
 * currently still **start moving**, and since `inset: 0` sizes it to the
 * viewport exactly, any `yPercent` drags an edge into view.
 *
 * So: a fixed ornament is already at the bottom of the ladder. Reach for a
 * plane when a layer scrolls — `/work`'s `GridPattern` is `position: absolute`
 * inside the page and does travel, which is what makes it a candidate and the
 * other two not.
 */
export const PARALLAX_PLANES = {
  ground: 4,
  mid: 6,
  subject: 10,
  foreground: 14,
} as const

export type ParallaxPlane = keyof typeof PARALLAX_PLANES

interface ParallaxOptions {
  /**
   * Which depth plane this media sits on. Prefer this over `distance`: it is
   * what keeps two layers on one page related rather than merely both moving.
   */
  plane?: ParallaxPlane
  /**
   * An explicit travel, as a percentage of the element's height.
   *
   * The escape hatch, kept because two consumers measured their own number
   * against their own layout before the planes existed and those measurements
   * are real — `project-gallery` records why its plates sit above the default
   * in `TAHAP-56.md`. **`distance` wins over `plane`** when both are given, so
   * a component that has measured is never silently overridden by the system.
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
  { plane, distance, smoothing = 0.5 }: ParallaxOptions = {}
) {
  // `distance` wins, then the named plane, then the long-standing default of
  // 6 — which is `mid`, so an untouched call site keeps the exact travel it
  // had before planes existed.
  const travel = distance ?? (plane ? PARALLAX_PLANES[plane] : 6)
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
        { yPercent: travel / 2 },
        {
          yPercent: -travel / 2,
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
    { dependencies: [prefersReducedMotion, travel, smoothing] }
  )
}
