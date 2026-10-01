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
 * Passage — the way the home page's work arrives: a pinned reel of the work
 * itself, then the section's own title.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The ground it draws is `vault/magic/grid-pattern` (Magic UI, MIT — see that
 * file's header).
 *
 * ## What it used to be, and what was wrong with it on screen
 *
 * Tahap 49 built this as two and a half screens of scroll in which "the
 * studio's twelve-column grid sharpens" and the section title rises. Looked
 * at in the fork, frame by frame at 1440×900, it was **two and a half screens
 * of dark page with a strip of ticks across the middle.** The grid was
 * `position: absolute; inset: 0` inside the stage — and the stage was only as
 * tall as the title, so the ground the whole passage was about covered about
 * a hundred pixels. The narrative its doc comment argued for never reached a
 * reader. Then the pin released onto a screen-tall box with the title in its
 * middle, and the first card arrived five hundred pixels later.
 *
 * ## What it is now
 *
 * The page still has no spare words — `CLAUDE.md` forbids inventing content,
 * and every sentence on the home page has a home. But it has **pictures**:
 * the featured works' covers. So the passage becomes a reel of them. One
 * plate at a time wipes up through a fixed frame, its caption and index
 * change with it, the studio's grid holds still behind the whole screen, and
 * only then does the section's title rise and the pin let go — straight onto
 * the grid of the same works, now at their own sizes and one click away.
 *
 * | Fraction | Movement |
 * | --- | --- |
 * | 0 → 0.15 | The ground sharpens (`scale 1.5 → 1`), the frame lifts in |
 * | 0.15 → 0.75 | Each plate wipes up through the frame; the image inside counter-moves and settles from `scale 1.2`; index and caption roll to match |
 * | 0.72 → 0.88 | The section title rises through its mask |
 * | 0.85 → 1 | The stage drifts up as the pin releases |
 *
 * ## The reel is a preview, and it says so to assistive technology
 *
 * `aria-hidden`, and nothing in it is focusable. Every plate is a duplicate
 * of a card that follows immediately in `ProjectGrid`, which carries the
 * link, the real alt text and the heading; announcing the same four works
 * twice in a row would be noise, and a link inside a pinned layer is a focus
 * target that can sit off screen. The accessible page is unchanged: title,
 * then the grid.
 *
 * ## Resting state — without JavaScript, and under reduced motion
 *
 * Without JavaScript the reel rests on its first plate: index `01`, the first
 * work's cover and caption, the title below. A readable composition rather
 * than a blank, because the stylesheet — not a tween — puts the other plates
 * below the frame.
 *
 * Under reduced motion the reel is not drawn at all and the passage is only
 * as tall as its title: no ScrollTrigger is created, so no pin spacer exists,
 * and a reader who asked for stillness does not get a screen of preview
 * before the work. That is `e2e/journey.e2e.ts`' "reduced motion adds no
 * empty scroll".
 *
 * ## This is not scroll hijacking
 *
 * The reader scrolls at their own rate; `End` still reaches the footer; `Tab`
 * still walks the whole page; letting go stops the movement instantly. What
 * is pinned is **what is visible**, not **how fast the page scrolls**.
 */

/** A work as the reel shows it. */
export interface PassagePlate {
  /** Stable key — the work's id. */
  id: string
  title: string
  /** One line of facts, already joined: engagement · client · year. */
  meta?: string | undefined
  /**
   * The cover, rendered by the caller. Decorative here — the reel is
   * `aria-hidden` — so the caller passes `alt=""`; the card below carries
   * the real description.
   */
  media: ReactNode
}

/** Screens of scroll per plate, on top of the intro and the title's rise. */
const SCREENS_PER_PLATE = 0.7

/** Screens of scroll the passage spends before and after the plates. */
const SCREENS_AROUND = 1.2

/** How much coarser the grid starts than it ends. */
const GROUND_ENTRY_SCALE = 1.5

/** The title's travel through its mask, as a percentage of its own height. */
const TITLE_RISE = 40

/** How far into the frame an image starts, and how much larger. */
const PLATE_COUNTER = -30
const PLATE_ENTRY_SCALE = 1.2

/** Stable across renders, so a page that passes no plates re-renders nothing. */
const NO_PLATES: readonly PassagePlate[] = []

/** A reel of one is a still, not a reel. */
const REEL_MINIMUM = 2

/**
 * The most plates the reel runs through. The pin grows by
 * `SCREENS_PER_PLATE` for each, and the grid right after shows every featured
 * work anyway; past six the reel stops previewing and starts withholding the
 * page. Measured: six plates pin for 5.4 screens.
 */
const REEL_MAXIMUM = 6

/** Index as the reel prints it: `01`, `02` … */
function index(value: number) {
  return String(value).padStart(2, '0')
}

interface PassageProps {
  /**
   * The section header this passage delivers.
   *
   * A slot rather than props, because the header is
   * `components/ui/section-header` and already owns its own typography. The
   * page owns the words; this block owns only when they arrive.
   */
  children: ReactNode
  /** The works the reel runs through. Fewer than two draws no reel. */
  plates?: readonly PassagePlate[] | undefined
  className?: string | undefined
}

export function Passage({
  children,
  plates = NO_PLATES,
  className,
}: PassageProps) {
  const root = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePreferredReducedMotion()
  const reel =
    plates.length >= REEL_MINIMUM ? plates.slice(0, REEL_MAXIMUM) : []
  const count = reel.length

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

      /*
       * No reel, no pin. A passage with nothing to run through used to pin
       * for the Tahap 49 two and a half screens — and since the fork it is
       * only as tall as its title, so that would hold a title-high strip
       * under the fixed header while the reader scrolled past nothing. Found
       * by review, not on screen: every seeded dataset has four covers.
       */
      if (reduced || count === 0) return

      gsap.registerPlugin(ScrollTrigger)

      const ground = element.querySelector(`.${s.ground}`)
      const title = element.querySelector(`.${s.title}`)
      const stage = element.querySelector(`.${s.stage}`)
      if (!ground || !title || !stage) return

      const screens = SCREENS_AROUND + SCREENS_PER_PLATE * count

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          end: `+=${Math.round(screens * 100)}%`,
          pin: true,
          /*
           * Half a second of catch-up, the same figure `vault/motion/parallax`
           * uses. Shared so the two scrubbed mechanisms on this page settle
           * at the same rate; two different smoothings read as two systems
           * disagreeing rather than as one page.
           */
          scrub: 0.5,
          pinSpacing: true,
        },
      })

      timeline.fromTo(
        ground,
        { scale: GROUND_ENTRY_SCALE, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.15 },
        0
      )

      const frame = element.querySelector(`.${s.frame}`)
      const plateNodes = [...element.querySelectorAll(`.${s.plate}`)]
      const mediaNodes = [...element.querySelectorAll(`.${s.plateMedia}`)]
      const countStrip = element.querySelector(`.${s.countStrip}`)
      const captionStrip = element.querySelector(`.${s.captionStrip}`)

      const indexNode = element.querySelector(`.${s.count}`)
      const captions = element.querySelector(`.${s.captions}`)

      if (frame && countStrip && captionStrip && indexNode && captions) {
        timeline
          .fromTo(
            frame,
            { yPercent: 8, scale: 0.94, opacity: 0 },
            { yPercent: 0, scale: 1, opacity: 1, duration: 0.15 },
            0
          )
          /*
           * The index and the caption arrive with the frame they describe.
           * They used to sit at full opacity from the first frame, so a
           * reader approaching the passage saw "01 / 04" and a title beside
           * an empty screen.
           */
          .fromTo(
            [indexNode, captions],
            { opacity: 0 },
            { opacity: 1, duration: 0.15 },
            0
          )

        /*
         * The plates. The first rests in the frame already; each one after
         * it wipes up over the last while the picture inside moves the other
         * way and settles from a larger scale — two transforms in opposite
         * directions, which is what makes a flat wipe read as depth.
         */
        const span = 0.6 / (count - 1)
        for (let i = 1; i < count; i += 1) {
          const at = 0.15 + span * (i - 1)
          const plate = plateNodes[i]
          const media = mediaNodes[i]
          if (!plate || !media) continue

          timeline
            /*
             * `y: 0` on both ends, and it is load-bearing. At rest the
             * stylesheet parks this plate with `translateY(101%)`; GSAP reads
             * that computed matrix back as a **pixel** `y`, and a tween of
             * `yPercent` alone would stack on top of it — the plate would
             * travel from 202% to 101% and never enter the frame. Measured:
             * the first build showed the first work's cover under all four
             * indices.
             */
            .fromTo(
              plate,
              { y: 0, yPercent: 101 },
              { y: 0, yPercent: 0, duration: span * 0.85 },
              at
            )
            .fromTo(
              media,
              { yPercent: PLATE_COUNTER, scale: PLATE_ENTRY_SCALE },
              { yPercent: 0, scale: 1, duration: span * 0.85 },
              at
            )
            .to(
              [countStrip, captionStrip],
              { yPercent: (-100 * i) / count, duration: span * 0.5 },
              at + span * 0.35
            )
        }
      }

      timeline
        .fromTo(
          title,
          { yPercent: TITLE_RISE, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.16 },
          0.72
        )
        /*
         * The release. The stage drifts up as the pin lets go, so the passage
         * reads as lifting away rather than as the page jumping past it —
         * the same asymmetry `page-transition` uses on its way out.
         */
        .fromTo(stage, { yPercent: 0 }, { yPercent: -6, duration: 0.15 }, 0.85)

      return () => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
      }
    },
    /*
     * `revertOnUpdate`, so a dependency change tears down what the last run
     * built before the next one runs. Without it, turning reduced motion on
     * mid-visit left the pin alive, and a change in the number of plates
     * would have stacked a second pin over the first.
     */
    {
      dependencies: [prefersReducedMotion, count],
      scope: root,
      revertOnUpdate: true,
    }
  )

  return (
    <section
      ref={root}
      className={cn(s.passage, count > 0 && s.withReel, className)}
      /*
       * A named moment, so `e2e/interaction-grammar.e2e.ts` can report it by
       * name rather than point at an anonymous element.
       */
      data-epic="arth-passage"
      /*
       * The heading inside is announced by this moment rather than by the
       * reveal contract: a container reveal and a scrubbed passage would be
       * two entrances competing for one element (`MOTION-SPEC.md` §9.4
       * rule 2).
       */
      data-reveal-exempt=""
    >
      {/*
        The ground, across the whole pinned screen: the twelve-column grid
        this site lays everything on, held still behind the reel.
        `aria-hidden` and inert — `vault/magic/README.md` house rule 4.
      */}
      <GridPattern width={48} height={48} className={s.ground} />
      <div className={s.stage}>
        {count > 0 && (
          <div className={s.reel} aria-hidden="true">
            <div className={cn('h1', s.count)}>
              <div className={s.countMask}>
                <div className={s.countStrip}>
                  {reel.map((plate, position) => (
                    <span key={plate.id} className={s.countValue}>
                      {index(position + 1)}
                    </span>
                  ))}
                </div>
              </div>
              <span className={cn('caption', s.countTotal)}>
                / {index(count)}
              </span>
            </div>

            <div className={s.frame}>
              {reel.map((plate) => (
                <div key={plate.id} className={s.plate}>
                  <div className={s.plateMedia}>{plate.media}</div>
                </div>
              ))}
            </div>

            <div className={s.captions}>
              <div className={s.captionStrip}>
                {reel.map((plate) => (
                  <div key={plate.id} className={s.caption}>
                    <span className={cn('p-big', s.captionTitle)}>
                      {plate.title}
                    </span>
                    {plate.meta && (
                      <span className={cn('caption', s.captionMeta)}>
                        {plate.meta}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className={s.mask}>
          <div className={s.title}>{children}</div>
        </div>
      </div>
    </section>
  )
}
