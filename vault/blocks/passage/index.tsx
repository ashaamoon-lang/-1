'use client'

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { type ReactNode, useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { GridPattern } from '@/vault/magic/grid-pattern'

import s from './passage.module.css'

/**
 * Passage — the home page's third choreographed moment, and the way its work
 * arrives.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The ground it draws is `vault/magic/grid-pattern` (Magic UI, MIT — see that
 * file's header).
 *
 * ## What it is made of, and why that was the hard part
 *
 * The home page has **no spare words.** `CLAUDE.md` and the owner's own
 * instruction both forbid invented content, and every sentence on this page
 * already has a home: the studio statement is in `StudioNote`, the practice
 * names are in `PracticeList`, the headline is in the hero.
 *
 * So this is not a new block with new copy. It is **the work section's own
 * arrival, choreographed** — the existing `SectionHeader`, with its existing
 * title and count, handed a passage to arrive through. Zero copy added, and
 * the block stops being something bolted between the hero and the work: it
 * becomes how the work gets there.
 *
 * ## The choreography
 *
 * One ScrollTrigger, pinned, scrubbed, `ease: 'none'` — roughly two and a
 * half screens of scroll driving one screen of content, on the shared GSAP
 * loop (order 10, behind Lenis at order 5).
 *
 * | Fraction | Movement |
 * | --- | --- |
 * | 0 → 0.35 | The studio's grid sharpens: `scale(1.5)` → `scale(1)`, `opacity` 0 → its resting value |
 * | 0.35 → 0.7 | The section title rises through its mask: `yPercent` 40 → 0, `opacity` 0 → 1 |
 * | 0.7 → 1 | The ground settles and the contents drift up as the pin releases |
 *
 * **What this movement communicates** — the `taste-skill` test, whose only
 * valid answers are hierarchy, narrative, feedback, or state transition:
 * **narrative.** The twelve-column grid this site composes everything on
 * becomes visible, sharpens to its real rhythm, and the work's own title
 * arrives on top of it. That is a story about how this studio puts things
 * together, told with its own structure. "It looks cool" is not an answer and
 * was not the reason.
 *
 * ## This is not scroll hijacking
 *
 * The distinction matters because the plan rejects hijacking permanently. The
 * reader scrolls at their own rate; `End` still reaches the footer; `Tab`
 * still walks the whole page; letting go stops the movement instantly. What
 * is pinned is **what is visible**, not **how fast the page scrolls**.
 * `e2e/journey.e2e.ts` proves it with the keyboard alone, which is the only
 * proof that counts.
 *
 * ## Reduced motion
 *
 * No ScrollTrigger is created at all, so **no pin spacer exists** — a reader
 * who asked for no motion does not get two and a half screens of empty page
 * to scroll through. That is the failure this shape avoids, and it is why the
 * scroll length comes from `end: '+=250%'` rather than from a CSS height.
 *
 * ## Without JavaScript
 *
 * Identical. Every tween is a `fromTo`, so the DOM's resting state is the
 * readable one and the "from" only exists once GSAP has set it.
 */

/**
 * How far the pin runs, as a fraction of the viewport.
 *
 * Two and a half screens for one screen of content. Longer reads as a stall —
 * the reader has already understood the grid by the second screen and is now
 * waiting for the page to let them past. Shorter and the three beats overlap
 * into one blur.
 *
 * A recorded guess, not a measurement: no instrument can say how long a
 * passage should feel. `docs/stages/TAHAP-49.md` §6 says what it looked like
 * once it was on screen.
 */
const PIN_SCREENS = 2.5

/** Where the ground rests once the passage has resolved. */
const GROUND_REST = 1

/** How much coarser the grid starts than it ends. */
const GROUND_ENTRY_SCALE = 1.5

/** The title's travel through its mask, as a percentage of its own height. */
const TITLE_RISE = 40

interface PassageProps {
  /**
   * The section header this passage delivers.
   *
   * A slot rather than props, because the header is
   * `components/ui/section-header` and already owns its own typography. The
   * page owns the words; this block owns only when they arrive.
   */
  children: ReactNode
  className?: string | undefined
}

export function Passage({ children, className }: PassageProps) {
  const root = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const element = root.current
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

      gsap.registerPlugin(ScrollTrigger)

      const ground = element.querySelector(`.${s.ground}`)
      const title = element.querySelector(`.${s.title}`)
      const stage = element.querySelector(`.${s.stage}`)
      if (!ground || !title || !stage) return

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          end: `+=${PIN_SCREENS * 100}%`,
          pin: true,
          /*
           * Half a second of catch-up, the same figure `vault/motion/parallax`
           * uses. Shared so the two scrubbed mechanisms on this page settle
           * at the same rate; two different smoothings read as two systems
           * disagreeing rather than as one page.
           */
          scrub: 0.5,
          /*
           * ScrollTrigger's own spacer takes the pinned element out of flow
           * and replaces it with its measured height. Letting it manage that
           * is what keeps the footer reachable and `End` honest.
           */
          pinSpacing: true,
        },
      })

      timeline
        .fromTo(
          ground,
          { scale: GROUND_ENTRY_SCALE, opacity: 0 },
          { scale: 1, opacity: GROUND_REST, ease: 'none', duration: 0.35 },
          0
        )
        .fromTo(
          title,
          { yPercent: TITLE_RISE, opacity: 0 },
          { yPercent: 0, opacity: 1, ease: 'none', duration: 0.35 },
          0.35
        )
        /*
         * The release. The stage drifts up as the pin lets go, so the passage
         * reads as lifting away rather than as the page jumping past it —
         * the same asymmetry `page-transition` uses on its way out.
         */
        .fromTo(
          stage,
          { yPercent: 0 },
          { yPercent: -6, ease: 'none', duration: 0.3 },
          0.7
        )

      return () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
      }
    },
    { dependencies: [prefersReducedMotion], scope: root }
  )

  return (
    <section
      ref={root}
      className={cn(s.passage, className)}
      /*
       * The third named moment on this page, and the one §9.5's ceiling was
       * raised for. Named in the DOM so `e2e/interaction-grammar.e2e.ts` can
       * say which moment overspent rather than point at an anonymous element.
       */
      data-epic="arth-passage"
      /*
       * The heading inside is announced by this moment, not by the reveal
       * contract — `e2e/reveal-coverage.e2e.ts`.
       *
       * That gate asks that no heading arrives unannounced, and its escape
       * hatch is exactly this attribute: an explicit exemption, at the place
       * it applies, rather than a heading quietly slipping through. The
       * header lost its `reveal` prop when it moved in here because a
       * container reveal and a scrubbed passage are two entrances competing
       * for one element, which `MOTION-SPEC.md` §9.4 rule 2 forbids. What it
       * gained is a longer, named arrival.
       */
      data-reveal-exempt=""
    >
      <div className={s.stage}>
        {/*
          The ground, and it is the composition rather than decoration: the
          twelve columns this site lays everything on, made briefly visible.
          `aria-hidden` and inert — `vault/magic/README.md` house rule 4.
        */}
        <GridPattern width={48} height={48} className={s.ground} />
        <div className={s.mask}>
          <div className={s.title}>{children}</div>
        </div>
      </div>
    </section>
  )
}
