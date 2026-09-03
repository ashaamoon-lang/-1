'use client'

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type { CSSProperties, ReactNode } from 'react'
import { useRef } from 'react'

import s from './progress-text.module.css'

// Registered here (not only in `components/effects/gsap.tsx`) so this
// component works correctly even if it renders before the Lenis↔ScrollTrigger
// bridge (`components/layout/lenis/scroll-trigger.tsx`) has been dynamically
// imported — registerPlugin is idempotent, so re-registering is a no-op once
// that module has also loaded.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

type ProgressTextProps = {
  /**
   * Text content to reveal — a string, or JSX with inline markup (e.g.
   * `<em>word</em>`). SplitText splits every rendered word regardless of
   * nesting. Treated as STATIC after mount: SplitText takes ownership of the
   * rendered text nodes, so React updating `children` in place would clash
   * with the split DOM. To change the content, remount with a `key`.
   */
  children: ReactNode
  /** ScrollTrigger `start` position (element keyword + viewport keyword, e.g. `'top top'`). */
  start?: string
  /** ScrollTrigger `end` position, e.g. `'bottom bottom'`. */
  end?: string
  /** Opacity of words the scroll position hasn't reached yet. */
  dimOpacity?: number
  className?: string
  style?: CSSProperties
}

/**
 * Scroll-driven text reveal, built on GSAP's SplitText + ScrollTrigger.
 *
 * Words fade from `dimOpacity` to fully opaque as scroll progress advances
 * through `start`..`end` (scrubbed 1:1, no easing lag) — the same fold-based
 * mapping `hamo`'s `useScrollTrigger` used, expressed as native ScrollTrigger
 * keywords. `prefers-reduced-motion: reduce` skips the scroll linkage and
 * fades every word in once, instantly.
 */
export function ProgressText({
  children,
  start = 'top top',
  end = 'bottom bottom',
  dimOpacity = 0.33,
  className,
  style,
}: ProgressTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const container = containerRef.current
      if (!container) return

      const split = SplitText.create(container, {
        type: 'words',
        /*
         * `none`, and the accessible copy is a real element below.
         *
         * This shipped as `'auto'`, which writes the original string to an
         * `aria-label` on the container — and that is a **serious a11y
         * violation** here, because the container is a `<span>`:
         * `aria-label` is prohibited on any element whose role does not
         * support naming, which includes `generic` (a bare span or div) and
         * `paragraph` (a `<p>`), so there is no tag that would have made it
         * legal.
         *
         * axe reported it as `aria-prohibited-attr` on `/en/studio` in Tahap
         * 24. It was present on every practice page too, and the route sweep
         * was green on those by luck of position: their statement sits below
         * the fold, so the split had not run yet when axe looked. The studio
         * page puts one near the top, and the latent defect surfaced.
         *
         * The fix keeps the intent — never announce word-by-word — but uses
         * the pattern that is provably correct rather than one that depends
         * on how a given screen reader treats inline spans: hide the split
         * copy from assistive tech entirely, and put the full text beside it
         * in a visually hidden element.
         */
        aria: 'none',
        tag: 'span',
        // `noUncheckedIndexedAccess` types the CSS module's index signature
        // as `string | undefined`; the class always exists at build time.
        wordsClass: s.word ?? '',
      })

      // SplitText instances register with the active useGSAP context and are
      // auto-reverted on unmount, but that DOM mutation deserves an explicit,
      // visible cleanup rather than relying on that implicitly — mirrors the
      // manual-revert pattern GSAP's own React docs show.
      const cleanup = () => split.revert()

      if (split.words.length === 0) {
        return cleanup
      }

      gsap.set(split.words, { opacity: dimOpacity })

      const mm = gsap.matchMedia()

      // Declare both states explicitly. gsap.matchMedia() only invokes the
      // callback when at least one named condition currently matches — a
      // single `reduceMotion` key would silently never fire (and never wire
      // up the scroll-linked reveal) for the common case where it doesn't
      // match, since `no-preference` is what's true for those visitors.
      mm.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
          noPreference: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          if (context.conditions?.reduceMotion) {
            // Reduced motion: still becomes visible, just not scroll-linked
            // and with no movement — a gentle opacity-only fade.
            gsap.to(split.words, { opacity: 1, duration: 0.3 })
            return
          }

          gsap.to(split.words, {
            opacity: 1,
            stagger: { each: 1 / split.words.length, from: 'start' },
            scrollTrigger: {
              trigger: container,
              start,
              end,
              scrub: true,
            },
          })
        },
        container
      )

      return cleanup
    },
    // revertOnUpdate: a dependency change must revert the previous context
    // (split spans, ScrollTrigger, matchMedia listeners) before re-running —
    // without it useGSAP only reverts on unmount and each change stacks a
    // fresh SplitText + trigger on top of the last.
    {
      scope: containerRef,
      dependencies: [start, end, dimOpacity],
      revertOnUpdate: true,
    }
  )

  return (
    <>
      {/*
        The accessible copy. `sr-only` is clipped out of the visual flow, so
        it changes no layout, and it carries the passage exactly once — which
        is what a paragraph needs, since a paragraph is read from its content
        rather than from a name.
      */}
      <span className="sr-only">{children}</span>
      <span
        ref={containerRef}
        aria-hidden="true"
        className={cn(s.progressText, className)}
        style={style}
      >
        {children}
      </span>
    </>
  )
}
