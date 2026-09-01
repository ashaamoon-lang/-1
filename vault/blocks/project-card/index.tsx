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
import { ViewTransition } from 'react'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { transitionName } from '@/lib/motion/transition-name'

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
  /**
   * The cover, straight off the query. Narrowed with `toImageSource` at the
   * render below rather than in the caller: the un-localized `alt` on a CMS
   * image object is not the alt this card renders (`coverAlt` is), and
   * passing the raw object hands `SanityImage` a field it would misread.
   */
  cover:
    | (ImageSource & { alt?: unknown; media?: unknown; _type?: string })
    | null
}

interface ProjectCardProps {
  project: Project
  /**
   * Overrides the project's own `span`.
   *
   * A work's `span` is a *composition* choice — it says how this piece should
   * sit among a handful of curated neighbours on the home page. That is the
   * wrong authority for a catalogue, which lists everything and wants one
   * rhythm; see `ProjectGrid`'s `layout` prop for the measurement that forced
   * the split. Passing it here rather than reading `project.span` directly
   * keeps the image request width, the `sizes` attribute and the crop all
   * agreeing with the column the card is actually placed in.
   */
  span?: 6 | 12 | undefined
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
  span: spanOverride,
  preload = false,
  className,
}: ProjectCardProps) {
  const span = spanOverride ?? project.span ?? 6
  const slug = project.slug?.current
  // A project without a slug has no page to link to. The schema requires one,
  // so this only happens on an unpublished draft — rendering a dead link
  // would be worse than rendering nothing.
  if (!slug) return null

  /*
   * A template, not a localized path. `components/ui/link` adds the locale
   * prefix itself; handing it `/en/work/…` would produce `/en/en/work/…`.
   * `localizedPath` is for places that need a finished URL string — the
   * sitemap, a canonical — not for a component that already localizes.
   */
  const href = `/work/${slug}`

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
  const maxWidth = span === 12 ? 1440 : 704

  // Client and year read as one line of metadata, and either may be absent.
  const meta = [project.medium, project.client, project.year]
    .filter((part) => part !== null && part !== '')
    .join(' · ')

  return (
    <article className={cn(s.card, className)} data-span={span}>
      <Link
        href={href}
        className={s.link}
        data-cursor="view"
        // The interaction grammar, `docs/MOTION-SPEC.md` §9. `data-press`
        // names the noun so the gate can say which control went silent
        // rather than "an element"; `data-intent` below marks what actually
        // acknowledges hover, which is the image and not this link.
        data-press="card"
        // Stands the route-change overlay down for this navigation so the
        // cover below can morph into the project page's hero instead.
        transition="morph"
      >
        <ViewTransition
          name={transitionName(slug)}
          share="morph"
          default="none"
        >
          <div className={s.media}>
            {project.cover && (
              <SanityImage
                image={toImageSource(project.cover)}
                alt={project.coverAlt ?? ''}
                maxWidth={maxWidth}
                sizes={
                  span === 12
                    ? '(max-width: 800px) 100vw, 96vw'
                    : '(max-width: 800px) 100vw, 48vw'
                }
                className={s.image}
                data-intent=""
                preload={preload}
              />
            )}
          </div>
        </ViewTransition>
        <div className={s.caption}>
          <h3 className={cn('p-big', s.title)}>{project.title}</h3>
          {meta && <p className={cn('caption', s.meta)}>{meta}</p>}
        </div>
      </Link>
    </article>
  )
}
