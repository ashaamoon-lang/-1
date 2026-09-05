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
import type { CSSProperties } from 'react'
import { useRef, useState, ViewTransition } from 'react'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { transitionName } from '@/lib/motion/transition-name'
import { useParallax } from '@/vault/motion/parallax'
import { MaterialImage } from '@/vault/webgl/material-image'

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
  engagement: string | null
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

/**
 * What each column is worth, in pixels and in `sizes`.
 *
 * A table rather than a chain of ternaries: three branches was the point at
 * which the expression stopped being readable, and a record keeps the request
 * width and the `sizes` string for one column *on the same line*, where a
 * mismatch between them is visible.
 *
 * The numbers are the 12-column grid at the 1440 desktop anchor in
 * `lib/styles/layout.mjs`, rounded up — a third, a half, the whole width.
 */
const COLUMN = {
  4: { maxWidth: 480, sizes: '(max-width: 800px) 100vw, 32vw' },
  6: { maxWidth: 704, sizes: '(max-width: 800px) 100vw, 48vw' },
  12: { maxWidth: 1440, sizes: '(max-width: 800px) 100vw, 96vw' },
} as const

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
  span?: 4 | 6 | 12 | undefined
  /**
   * Preload this card's image. Set it on the cards above the fold only —
   * marking every card is the same as marking none. `preload`, not the
   * deprecated `priority`: `components/ui/image` documents the rename.
   */
  preload?: boolean | undefined
  /**
   * Give this card's cover a material surface — `vault/webgl/material-image`.
   *
   * Off by default, and the default is the important half. Opting in pulls
   * three.js into the route that renders it, and `e2e/route-budget.e2e.ts`
   * allows that on exactly one route. The home page's curated selection opts
   * in; `/en/work`'s catalogue and the detail page's `next-project` do not,
   * which is the Tahap 7 decision this must not quietly undo.
   */
  material?: boolean | undefined
  /**
   * How far this card's cover travels across its own scroll pass, as a
   * percentage of its height — `useParallax`'s `distance`.
   *
   * Given per card rather than fixed inside it because `work-constellation`
   * (Tahap 43) gives the catalogue's two columns *different* values. What a
   * reader registers is not the size of either travel but the difference
   * between them: two columns moving at unequal rates keep changing their
   * relationship to each other, so the page never shows the same composition
   * twice. Omitted, the hook's own quiet default applies.
   */
  drift?: number | undefined
  className?: string | undefined
}

export function ProjectCard({
  project,
  span: spanOverride,
  preload = false,
  material = false,
  drift,
  className,
}: ProjectCardProps) {
  /*
   * COMMIT stands the material down — `docs/MOTION-SPEC.md` §11.
   *
   * While a mesh is drawing this card's cover, the DOM image is at
   * `opacity: 0`. A `<ViewTransition>` photographs real DOM, so a morph that
   * started in that state would carry an empty box to the project page and
   * the whole moment would read as a fade to nothing. Raising this at
   * COMMIT — the press, before the navigation — hands the surface back so
   * TRANSPORT morphs real pixels.
   *
   * Declared before the `!slug` return below because hooks cannot be
   * conditional.
   */
  const [released, setRelease] = useState(false)

  /*
   * Depth on the plate, which is what stops a grid of them being a still
   * photograph of a grid. `docs/stages/TAHAP-33.md` §1 has the measurement
   * that made this necessary: the catalogue had one distinct frame across
   * four and a half screens.
   */
  const parallaxRef = useRef<HTMLDivElement>(null)
  /*
   * `drift` is spread rather than passed as `distance: drift` because the
   * hook's options are `exactOptionalPropertyTypes`-strict: handing it an
   * explicit `undefined` is not the same as omitting the key, and only
   * omitting it falls through to the hook's own default.
   */
  useParallax(parallaxRef, { ...(drift !== undefined && { distance: drift }) })
  /*
   * The same number, handed to the stylesheet so the layer's overshoot
   * matches the travel. See `.parallax` in the module: sizing the layer
   * against a hardcoded default while the hook moved it further is what
   * exposed the plate's own frame on the column with the larger distance.
   */
  // SAFETY: CSS custom properties are valid in a React style object at
  // runtime; `CSSProperties` has no index signature to express one. Same
  // shape as `lib/utils/image-sizes.ts`'s `ratioStyle`.
  const parallaxStyle: CSSProperties =
    drift === undefined ? {} : ({ '--card-drift': drift } as CSSProperties)

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
  /*
   * Three column widths, because the card is placed in three of them.
   *
   * `SanityImage` derives its own `sizes` from `maxWidth`, so a card in a
   * ~469px box asking for 704 is the exact failure `components/ui/image`
   * warns about: it never errors, it just downloads roughly twice the bytes.
   * The numbers are the 12-column grid at the 1440 desktop anchor in
   * `lib/styles/layout.mjs`, rounded up — a third, a half, the whole width.
   *
   * `span 4` arrived with Tahap 44's studio strip. It is a **layout**
   * decision rather than a schema value: `project.span` is still `6 | 12`,
   * and this is the same kind of override `layout="catalogue"` already makes
   * when it forces every card to 6.
   */
  const { maxWidth, sizes } = COLUMN[span]

  // Client and year read as one line of metadata, and either may be absent.
  const meta = [project.engagement, project.client, project.year]
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
        // The second of the page's two choreographed moments (§9.5): pressing
        // this is what carries the cover to the project page. It spends
        // nothing at load — the budget gate measures what moves, and this
        // moves on navigation.
        data-epic="work-transport"
        // Stands the route-change overlay down for this navigation so the
        // cover below can morph into the project page's hero instead.
        transition="morph"
        /*
         * Both COMMIT paths, because a keyboard user reaches TRANSPORT
         * without ever producing a pointer event. `onKeyDown` fires before
         * the click the browser synthesises from Enter, which is what makes
         * it early enough.
         */
        onPointerDown={material ? () => setRelease(true) : undefined}
        onKeyDown={
          material
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setRelease(true)
                }
              }
            : undefined
        }
        /*
         * Restore on leave, not on pointerup. A press that does not navigate
         * — a right-click, a drag that ends elsewhere, a cancelled tap —
         * would otherwise leave the plate inert for the rest of the visit.
         */
        onPointerLeave={material ? () => setRelease(false) : undefined}
        onBlur={material ? () => setRelease(false) : undefined}
      >
        <ViewTransition
          name={transitionName(slug)}
          share="morph"
          default="none"
        >
          <div className={s.media}>
            {/*
              The parallax lives on an inner wrapper, not on `.media`.
              `.media` is the element `<ViewTransition>` photographs for the
              card-to-project morph, and a transform on a morphing element is
              the same class of defect as splitting the text a morph is about
              to capture: the browser measures one box and animates another.
              An inner box moves freely inside a frame that holds still.
            */}
            <div
              ref={parallaxRef}
              className={s.parallax}
              // SAFETY: a CSS custom property is not in React's CSSProperties
              // map, so the object is widened rather than the value coerced.
              // The value is a number this component received and passes
              // straight through; nothing is parsed or trusted.
              style={parallaxStyle}
            >
              {project.cover &&
                (material ? (
                  <MaterialImage
                    image={toImageSource(project.cover)}
                    alt={project.coverAlt ?? ''}
                    maxWidth={maxWidth}
                    sizes={sizes}
                    className={s.image}
                    data-intent=""
                    preload={preload}
                    released={released}
                  />
                ) : (
                  <SanityImage
                    image={toImageSource(project.cover)}
                    alt={project.coverAlt ?? ''}
                    maxWidth={maxWidth}
                    sizes={sizes}
                    className={s.image}
                    data-intent=""
                    preload={preload}
                  />
                ))}
            </div>
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
