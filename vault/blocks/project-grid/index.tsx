'use client'

/**
 * ProjectGrid — the core block of a commissioned-artwork portfolio.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Composes Satūs's `useReveal` (MIT, darkroom.engineering) with this
 * project's own tokens and cursor primitive.
 *
 * ## Why this uses CSS reveals rather than GSAP
 *
 * The entrance here is a staggered fade-and-rise — exactly what
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
 * - Each card is a single link wrapping the whole tile, so the target is
 *   large and there is exactly one tab stop per project — not one for the
 *   image and another for the title.
 * - Uses the house `components/ui/link`, not `next/link` directly: it handles
 *   external-href detection, new-tab rel attributes, and active state in one
 *   place, and accepts a plain string under `typedRoutes`.
 * - Images carry real `alt` text from the data, and reserve space via
 *   `width`/`height`, so the grid never shifts as they load.
 * - `data-cursor="view"` is decoration for the custom cursor; it conveys
 *   nothing that is not already in the link text.
 */

import cn from 'clsx'
import Image from 'next/image'

import { Link } from '@/components/ui/link'
import { useReveal } from '@/lib/hooks/use-reveal'

import s from './project-grid.module.css'

export interface Project {
  id: string
  title: string
  /** Client, medium, or year — the small mono line under the title. */
  meta: string
  href: string
  image: {
    src: string
    /**
     * Describe the artwork, not the layout. "Mural, three figures in ochre"
     * beats "project image" — for screen readers and for search.
     */
    alt: string
    width: number
    height: number
  }
  /**
   * Span 6 (half) or 12 (full) of the 12 desktop columns. Mixing widths is
   * what stops a portfolio grid reading as a spreadsheet; a uniform grid is
   * the single most common reason competent work looks templated.
   */
  span?: 6 | 12 | undefined
}

interface ProjectGridProps {
  projects: Project[]
  className?: string | undefined
}

export function ProjectGrid({ projects, className }: ProjectGridProps) {
  // Flips [data-reveal] on the container; CSS animates [data-reveal-item]
  // children with a staggered transition-delay. Reduced motion is handled
  // inside the hook — it reveals immediately and never observes.
  const ref = useReveal<HTMLUListElement>()

  return (
    <ul ref={ref} className={cn(s.grid, className)}>
      {projects.map((project) => (
        <li
          key={project.id}
          data-reveal-item
          className={s.item}
          data-span={project.span ?? 6}
        >
          <Link href={project.href} className={s.link} data-cursor="view">
            <div className={s.media}>
              <Image
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                className={s.image}
                // Two columns on desktop, one on mobile — tells the browser
                // which candidate to fetch instead of over-downloading.
                sizes="(max-width: 800px) 100vw, 50vw"
              />
            </div>
            <div className={s.caption}>
              <h3 className={s.title}>{project.title}</h3>
              <p className={s.meta}>{project.meta}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
