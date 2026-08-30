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
 * ## Accessibility
 *
 * The grid is a `<ul>` of `<li>`, so a screen reader announces how many works
 * there are before the reader commits to walking them. Each card contributes
 * exactly one tab stop.
 */

import cn from 'clsx'

import { useReveal } from '@/lib/hooks/use-reveal'
import type { Locale } from '@/lib/i18n/routing'
import { type Project, ProjectCard } from '@/vault/blocks/project-card'

import s from './project-grid.module.css'

export type { Project }

interface ProjectGridProps {
  projects: Project[]
  /** The locale the grid is rendered under — each card href needs its prefix. */
  locale: Locale
  /**
   * How many leading cards are preloaded. Two is what fits above the fold at
   * desktop width; raising it to cover the whole grid defeats the point.
   */
  preloadCount?: number | undefined
  className?: string | undefined
}

export function ProjectGrid({
  projects,
  locale,
  preloadCount = 2,
  className,
}: ProjectGridProps) {
  // Flips [data-reveal] on the container; CSS animates [data-reveal-item]
  // children with a staggered transition-delay. Reduced motion is handled
  // inside the hook — it reveals immediately and never observes.
  const ref = useReveal<HTMLUListElement>()

  return (
    <ul ref={ref} className={cn(s.grid, className)}>
      {projects.map((project, index) => (
        <li
          key={project._id}
          data-reveal-item
          className={s.item}
          data-span={project.span ?? 6}
        >
          <ProjectCard
            project={project}
            locale={locale}
            preload={index < preloadCount}
          />
        </li>
      ))}
    </ul>
  )
}
