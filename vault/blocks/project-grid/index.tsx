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

import { useReveal } from '@/lib/hooks/use-reveal'
import { type Project, ProjectCard } from '@/vault/blocks/project-card'

import s from './project-grid.module.css'

export type { Project }

interface ProjectGridProps {
  projects: Project[]
  /**
   * `editorial` (default) honours each work's `span`; `catalogue` gives every
   * work the same column. See the layout note above for the measurement.
   */
  layout?: 'editorial' | 'catalogue' | undefined
  /**
   * How many leading cards are preloaded. Two is what fits above the fold at
   * desktop width; raising it to cover the whole grid defeats the point.
   */
  preloadCount?: number | undefined
  className?: string | undefined
}

export function ProjectGrid({
  projects,
  layout = 'editorial',
  preloadCount = 2,
  className,
}: ProjectGridProps) {
  // Flips [data-reveal] on the container; CSS animates [data-reveal-item]
  // children with a staggered transition-delay. Reduced motion is handled
  // inside the hook — it reveals immediately and never observes.
  const ref = useReveal<HTMLUListElement>()

  return (
    <ul ref={ref} className={cn(s.grid, className)}>
      {projects.map((project, index) => {
        const span = layout === 'catalogue' ? 6 : (project.span ?? 6)

        return (
          <li
            key={project._id}
            data-reveal-item
            className={s.item}
            data-span={span}
          >
            <ProjectCard
              project={project}
              span={span}
              preload={index < preloadCount}
            />
          </li>
        )
      })}
    </ul>
  )
}
