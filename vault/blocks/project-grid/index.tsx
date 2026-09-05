'use client'

/**
 * ProjectGrid — the core block of a commissioned-artwork portfolio.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Composes Satūs's `useReveal` (MIT, darkroom.engineering) with this
 * project's own tokens and card component.
 *
 * The card itself lives in `vault/blocks/project-card`. This block owns
 * exactly two things: placement, and the staggered entrance. Keeping them
 * apart is what lets a detail page render one card without inheriting a grid.
 *
 * ## Why this uses CSS reveals rather than GSAP
 *
 * The entrance is a staggered fade-and-rise — exactly what
 * `lib/hooks/use-reveal.ts` does with an IntersectionObserver and CSS
 * transitions on `transform`/`opacity`. That runs on the compositor thread,
 * survives a slow hydration, and ships no GSAP. Reaching for a timeline here
 * would cost ~43KB to produce the same pixels. GSAP earns its place on
 * sequenced choreography and scrubbing, not on fading cards in.
 *
 * See `vault/motion/README.md` — "Reach for CSS before GSAP".
 *
 * ## Layout
 *
 * 12 columns on desktop, 4 on mobile, matching `lib/styles/layout.mjs` and
 * the grids measured on Lusion and basement.studio. Every track is
 * `minmax(0, 1fr)`, never bare `1fr` — bare `1fr` refuses to shrink below its
 * content's intrinsic width and is the usual cause of horizontal scroll on
 * mobile when a title runs long.
 *
 * ### Two layouts, because a selection and a catalogue are different jobs
 *
 * `editorial` honours each work's own `span`: the studio composes the home
 * page by deciding which piece runs full width. That is the block's original
 * job and stays the default.
 *
 * `catalogue` ignores `span` and gives every work the same half-width column.
 * This exists because the editorial layout was measured on `/en/work` and
 * does not survive contact with a full listing. With three works spanning
 * 6, 12 and 6, auto-placement produced three separate rows — 691px, 1398px,
 * 691px — because a `span 12` cannot sit beside a `span 6`. Two of the three
 * rows carried ~700px of dead space, and the page ran 3802px tall for three
 * pieces. Twenty works would run past 18,000px with the same holes.
 *
 * `grid-auto-flow: dense` would backfill those holes, and is the wrong fix: a
 * catalogue is ordered (`order asc, publishedAt desc`), and dense placement
 * reorders what the reader sees away from what the studio arranged.
 *
 * ## Accessibility
 *
 * The grid is a `<ul>` of `<li>`, so a screen reader announces how many works
 * there are before the reader commits to walking them. Each card contributes
 * exactly one tab stop.
 */

import cn from 'clsx'
import { useRef } from 'react'

import { useReveal } from '@/lib/hooks/use-reveal'
import { type Project, ProjectCard } from '@/vault/blocks/project-card'
import { FLIP_ID, useFlipGrid } from '@/vault/motion/flip'

import s from './project-grid.module.css'

export type { Project }

/**
 * How far each column's covers travel — `work-constellation`, Tahap 43.
 *
 * Two values, not a formula, and the gap between them is the whole point.
 * Measured before this stage, both catalogue columns reported an identical
 * parallax offset — `1.863183333333333` against `1.863183333333333`, to
 * thirteen decimal places. Two columns moving in perfect lockstep are one
 * column drawn twice.
 *
 * The difference is 5, inside the ceiling of 6 that
 * `e2e/exploratory-layer.e2e.ts` holds. Above that the columns stop reading
 * as one grid with depth and start reading as two grids that disagree, which
 * is the "distracting desync" `vault/motion/parallax` records the preset
 * warning about.
 */
const COLUMN_DRIFT = [4, 9] as const

/**
 * The three editorial offsets, in grid steps, cycled by card index.
 *
 * Three values rather than a random per-card figure, because irregularity has
 * to read as a decision. A random offset reads as a bug — the eye cannot find
 * the rule, so it assumes there isn't one. A repeating three-value figure
 * against a two-column grid never lets a row line up (0/1, 2/0, 1/2) while
 * staying recognisably periodic.
 *
 * Non-negative on purpose: a negative offset on the first row would pull a
 * card up out of the grid's own top edge and into the section above it.
 */
const OFFSET_CYCLE = 3

/**
 * The column each layout forces, or `undefined` to honour the work's own.
 *
 * `editorial` is the one that defers: a work's `span` says how the studio
 * wants that piece to sit among curated neighbours, and that authority is the
 * whole reason the field exists. The other two override it because a listing
 * and a strip want one rhythm, not six opinions.
 */
const LAYOUT_SPAN = {
  editorial: undefined,
  catalogue: 6,
  strip: 4,
} as const

interface ProjectGridProps {
  projects: Project[]
  /**
   * `editorial` (default) honours each work's `span`; `catalogue` gives every
   * work the same half-width column; `strip` gives every work a third, for a
   * single row of evidence beside prose rather than a listing. See the layout
   * note above for the measurement.
   */
  layout?: 'editorial' | 'catalogue' | 'strip' | undefined
  /**
   * How many leading cards are preloaded. Two is what fits above the fold at
   * desktop width; raising it to cover the whole grid defeats the point.
   */
  preloadCount?: number | undefined
  /**
   * Animate surviving cards from where they were to where they now are when
   * the list changes under the grid — `catalogue-sift`, Tahap 39.
   *
   * Opt-in, and deliberately not derived from `layout`. The catalogue is the
   * only place the contents change without the page changing; the home page's
   * selection is fixed, and running a FLIP there would measure and store on
   * every render to animate nothing.
   */
  sift?: string | undefined
  /**
   * Names this grid as a choreographed moment — `MOTION-SPEC.md` §9.5.
   *
   * Declared rather than spread: `ProjectGrid` takes no arbitrary props, and
   * a marker the budget sampler reads is worth naming in the type so it
   * cannot be typo'd into silence.
   */
  'data-epic'?: string | undefined
  /**
   * Give every cover in this grid a material surface —
   * `vault/webgl/material-image`.
   *
   * Off by default, and deliberately not derived from `layout`. The two
   * happen to coincide today (only the home page's editorial grid opts in),
   * but they answer different questions: `layout` is composition, this is
   * which route is allowed to pay for three.js. Tying them would mean a
   * future editorial grid on another route silently blew
   * `e2e/route-budget.e2e.ts`.
   */
  material?: boolean | undefined
  className?: string | undefined
}

export function ProjectGrid({
  projects,
  layout = 'editorial',
  preloadCount = 2,
  material = false,
  sift,
  'data-epic': epic,
  className,
}: ProjectGridProps) {
  // Flips [data-reveal] on the container; CSS animates [data-reveal-item]
  // children with a staggered transition-delay. Reduced motion is handled
  // inside the hook — it reveals immediately and never observes.
  const ref = useReveal<HTMLUListElement>()

  /*
   * A second ref onto the same element, because `useReveal` owns the one it
   * returns and `useFlipGrid` needs to read from it rather than attach to it.
   * Assigning in the callback keeps both pointed at the same node without
   * either hook knowing about the other.
   */
  const gridRef = useRef<HTMLUListElement | null>(null)
  useFlipGrid(gridRef, sift ?? '')

  return (
    <ul
      ref={(node) => {
        gridRef.current = node
        ref.current = node
      }}
      className={cn(s.grid, className)}
      // Read by the stylesheet: the editorial offsets are a catalogue
      // composition and must not touch the home page's curated selection,
      // which composes with `span` instead.
      data-layout={layout}
      {...(epic && { 'data-epic': epic })}
    >
      {projects.map((project, index) => {
        const span = LAYOUT_SPAN[layout] ?? project.span ?? 6
        const constellation = layout === 'catalogue'
        /*
         * The catalogue is two equal columns, so the column a card lands in
         * is its index's parity. Derived rather than measured: reading the
         * real column back from the DOM would need layout, and this runs
         * during render.
         */
        const drift = COLUMN_DRIFT[index % COLUMN_DRIFT.length] ?? undefined

        return (
          <li
            key={project._id}
            data-reveal-item
            // The identity `catalogue-sift` follows across a filter change.
            // The document id, not the index: an index is the *position*,
            // which is precisely what the FLIP is measuring the change in.
            {...{ [FLIP_ID]: project._id }}
            className={s.item}
            data-span={span}
            {...(constellation && { 'data-offset': index % OFFSET_CYCLE })}
          >
            <ProjectCard
              project={project}
              span={span}
              preload={index < preloadCount}
              material={material}
              {...(constellation && drift !== undefined && { drift })}
            />
          </li>
        )
      })}
    </ul>
  )
}
