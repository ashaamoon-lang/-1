'use client'

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

import s from './reading-progress.module.css'

// Registered here as well as in `components/effects/gsap.tsx`, for the reason
// `components/effects/progress-text` records: `registerPlugin` is idempotent,
// and this way the component is correct whatever order the Lenis bridge
// happens to load in.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ReadingProgressProps {
  className?: string | undefined
}

/**
 * How far through a long page the reader is — a hairline under the header.
 *
 * ## Two mechanisms, one line, and only ever one of them running
 *
 * The primary is CSS: `animation-timeline: scroll()` drives `scaleX` on the
 * compositor with **no JavaScript at all**, which is the same argument
 * `vault/blocks/project-grid` makes for CSS reveals over GSAP tweens.
 *
 * It is not Baseline. MDN, read in Tahap 52 rather than assumed: _"Limited
 * availability … this feature is not Baseline because it does not work in
 * some of the most widely-used browsers."_ Safari is the one that matters
 * here. So the fallback is a ScrollTrigger — installed **only** when
 * `CSS.supports` says the timeline is missing, and riding the shared Tempus
 * loop that Lenis and GSAP already share, so it costs a subscriber rather
 * than a second `requestAnimationFrame` (`CLAUDE.md` #6).
 *
 * ## What it is, and what it is not
 *
 * It is reinforcement, not information a reader would otherwise lack — the
 * native scrollbar reports the same thing. That is why it is `aria-hidden`
 * (a `progressbar` role would announce a decoration) and why reduced motion
 * removes it outright in CSS rather than freezing it: scroll-linked movement
 * is movement, and nothing is stranded by its absence.
 *
 * The element renders on the server either way. Branching on the media query
 * in React would make the first client render disagree with the server's, and
 * a hydration mismatch is a worse defect than a rule expressed in CSS.
 */
export function ReadingProgress({ className }: ReadingProgressProps) {
  const barRef = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const bar = barRef.current
    if (!bar) return

    /*
     * The CSS path owns the bar wherever the timeline exists. Checking here
     * rather than duplicating the `@supports` rule keeps the two in one
     * place: if the stylesheet is driving it, this must not.
     */
    if (CSS.supports('animation-timeline', 'scroll()')) return

    const mm = gsap.matchMedia()

    // Both conditions named, for the reason `progress-text` records: with only
    // `reduceMotion` the callback never fires for the readers who do not have
    // it set, which is most of them.
    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        noPreference: '(prefers-reduced-motion: no-preference)',
      },
      (context) => {
        if (context.conditions?.reduceMotion) return

        gsap.set(bar, { scaleX: 0 })
        gsap.to(bar, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        })
      }
    )

    return () => mm.revert()
  }, [])

  return (
    <div
      aria-hidden="true"
      data-reading-progress=""
      className={cn(s.track, className)}
    >
      <span ref={barRef} data-reading-progress-bar="" className={s.bar} />
    </div>
  )
}
