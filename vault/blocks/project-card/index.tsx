'use client'

/**
 * ProjectCard — one commissioned work in the grid.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Extracted from `vault/blocks/project-grid`, which previously carried this
 * markup inline.
 *
 * ## Why it was extracted
 *
 * Two reasons, and the second is the real one:
 *
 * 1. A project detail page and a "next project" footer both need one card
 *    without the grid around it.
 * 2. The inline version carried raw design values — `font-size: 20px`,
 *    `font-size: 12px`, `gap: 12px` — which is a defect under `CLAUDE.md`
 *    rule 8. Every one of those now has a token, and pulling the card out is
 *    what forced them to be used.
 *
 * ## The data shape is the CMS's, not a private one
 *
 * `Project` mirrors `ProjectsQueryResult` from `sanity.types.ts` rather than
 * inventing a card-shaped struct that every caller has to map into. A private
 * shape means a mapping function, and a mapping function is where a missing
 * `alt` or a dropped locale goes unnoticed.
 *
 * ## Accessibility
 *
 * - One link wraps the whole tile: one tab stop per project, and a target far
 *   larger than 44×44.
 * - The heading is inside the link, so the accessible name is the work's
 *   title rather than the URL.
 * - `alt` comes from the CMS (`coverAlt`, required by the schema) and
 *   describes the artwork, not the layout.
 * - Hover and focus-visible share one treatment, so a keyboard user gets the
 *   same affordance as a pointer user.
 * - `data-cursor` is decoration for the custom cursor and conveys nothing the
 *   link text does not.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/routing'

import s from './project-card.module.css'

/**
 * One row of `projectsQuery` / `featuredProjectsQuery`.
 *
 * Written structurally rather than imported from `sanity.types.ts` so the
 * component can also be driven by a Storybook fixture, and so a query change
 * that drops a field surfaces here as a type error rather than as a blank
 * card.
 */
export interface Project {
  _id: string
  slug: { current?: string | undefined } | null
  title: string | null
  /** Resolved for the active locale by the query; the schema makes it required. */
  coverAlt: string | null
  medium: string | null
  year: number | null
  client: string | null
  /** Half (6) or full (12) of the 12 desktop columns. */
  span: 6 | 12 | null
  cover: Parameters<typeof SanityImage>[0]['image'] | null
}

interface ProjectCardProps {
  project: Project
  /** The locale the card is rendered under — the href needs its prefix. */
  locale: Locale
  /**
   * Preload this card's image. Set it on the cards above the fold only —
   * marking every card is the same as marking none. `preload`, not the
   * deprecated `priority`: `components/ui/image` documents the rename.
   */
  preload?: boolean | undefined
  className?: string | undefined
}

export function ProjectCard({
  project,
  locale,
  preload = false,
  className,
}: ProjectCardProps) {
  const slug = project.slug?.current
  // A project without a slug has no page to link to. The schema requires one,
  // so this only happens on an unpublished draft — rendering a dead link
  // would be worse than rendering nothing.
  if (!slug) return null

  // Built with the shared helper, never string-concatenated: `localizedPath`
  // is the one place that knows `/` becomes `/en` rather than `/en/`.
  const href = localizedPath(locale, `/work/${slug}`)

  /*
   * Cap the requested asset to what the card actually renders at.
   *
   * `SanityImage` derives its own `sizes` from `maxWidth`, so leaving the
   * 1920 default on a half-width card tells the browser to fetch a
   * full-desktop candidate for a ~700px box. That is the exact failure
   * `components/ui/image` warns about: it never errors, it just downloads
   * roughly four times the bytes. 704 is one half of the 12-column grid at
   * the 1440 desktop width in `lib/styles/layout.mjs`, rounded up.
   */
  const maxWidth = project.span === 12 ? 1440 : 704

  // Client and year read as one line of metadata, and either may be absent.
  const meta = [project.medium, project.client, project.year]
    .filter((part) => part !== null && part !== '')
    .join(' · ')

  return (
    <article className={cn(s.card, className)} data-span={project.span ?? 6}>
      <Link href={href} className={s.link} data-cursor="view">
        <div className={s.media}>
          {project.cover && (
            <SanityImage
              image={project.cover}
              alt={project.coverAlt ?? ''}
              maxWidth={maxWidth}
              className={s.image}
              preload={preload}
            />
          )}
        </div>
        <div className={s.caption}>
          <h3 className={cn('p-big', s.title)}>{project.title}</h3>
          {meta && <p className={cn('caption', s.meta)}>{meta}</p>}
        </div>
      </Link>
    </article>
  )
}
