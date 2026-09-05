'use client'

import cn from 'clsx'
import { ViewTransition } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import { useReveal } from '@/lib/hooks/use-reveal'
import {
  aspectRatioFor,
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { ratioStyle, trackImageSizes } from '@/lib/utils/image-sizes'
import { isFullWidth } from '@/vault/blocks/project-gallery'
import { TextReveal } from '@/vault/motion/text-reveal'
import { MaterialImage } from '@/vault/webgl/material-image'

import s from './project-hero.module.css'

/**
 * ProjectHero — the cover image and the facts, at the top of a work.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## The title comes before the image
 *
 * In the DOM, always. A reader on a slow connection, a screen-reader user, and
 * a crawler all meet the `<h1>` first; the visual order is a CSS decision, and
 * on desktop the cover sits alongside rather than above. Putting the image
 * first in markup to get the layout is how a page ends up announcing itself as
 * "image, image, image" before it says what it is.
 *
 * ## The meta list is a description list, not a table
 *
 * Client, year, engagement and scope are label/value pairs about one subject,
 * which is exactly what `<dl>` describes. A table would claim a relationship
 * between rows that does not exist. Any pair whose value is missing is dropped
 * rather than rendered blank — an editor who has not filled in the scope
 * should not produce a "Dimensions —" row.
 */
export interface ProjectMeta {
  label: string
  value: string | number | null | undefined
}

interface ProjectHeroProps {
  /**
   * Anchor target and spine marker — Tahap 40.
   *
   * Declared rather than spread: this block takes no arbitrary props, and a
   * marker `vault/blocks/project-spine` reads to decide which region is being
   * read is worth naming in the type so it cannot be typo'd into silence.
   */
  id?: string | undefined
  'data-region'?: string | undefined
  title: string
  cover?: (ImageSource & { alt?: unknown }) | null | undefined
  /** Localized by GROQ (`coverAlt`); the schema marks it required. */
  coverAlt: string
  meta: readonly ProjectMeta[]
  /**
   * Pairs this cover with the catalogue card the reader arrived from, so the
   * browser morphs one into the other instead of swapping them.
   *
   * A name, not a slug: the block has no business knowing about routing, and
   * `lib/motion/transition-name.ts` owns the string both ends must agree on.
   * Omit it and the cover simply does not morph — which is the right
   * behaviour for a hero with no card to come from, and the reason it is
   * optional rather than required.
   */
  transitionName?: string | undefined
  /**
   * Give the cover a material surface — `vault/webgl/material-image`.
   *
   * Off by default, and the default is the important half: opting in pulls
   * three.js into the route that renders it, and `e2e/route-budget.e2e.ts`
   * lists per route which engines are allowed. Passing this without adding
   * `three` to that route's `allow` is a red gate, which is the point.
   */
  material?: boolean | undefined
  className?: string | undefined
}

export function ProjectHero({
  title,
  cover,
  coverAlt,
  meta,
  transitionName,
  id,
  'data-region': region,
  material = false,
  className,
}: ProjectHeroProps) {
  const facts = meta.filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== ''
  )

  const ref = useReveal<HTMLElement>()
  const coverRatio = cover ? aspectRatioFor(cover) : undefined
  const coverIsFull = isFullWidth(coverRatio ?? null)

  /*
   * How many columns the cover takes, as one value rather than a nested
   * ternary. `span` is the word this component already uses for the same idea
   * on the media element itself (`data-span`).
   *
   * `none` is a real case, not a fallback: a work may ship without a cover, or
   * with one whose ratio cannot be read, and the stylesheet must not then
   * reserve an empty column beside nothing.
   */
  const hasCover = Boolean(cover) && coverRatio !== undefined
  let coverSpan: 'full' | 'half' | 'none' = 'none'
  if (hasCover) coverSpan = coverIsFull ? 'full' : 'half'

  return (
    <header
      ref={ref}
      className={cn(s.hero, className)}
      {...(id && { id })}
      {...(region !== undefined && { 'data-region': region })}
      /*
       * `MOTION-SPEC.md` §9.5 has called this "the project's arrival" since
       * Tahap 11d and it was never marked in the DOM — so when Tahap 40
       * widened the epic sampler from `/en` to all seven pages §9.5 names,
       * this block's 800ms reveal reported as "movement past the standard
       * band that belongs to no named moment". The name existed; only the
       * attribute was missing.
       */
      data-epic="project-arrival"
      /*
       * Which shape the cover took, stated rather than inferred.
       *
       * The component already computes `coverIsFull`; the stylesheet needs the
       * same fact to decide whether there is an empty column beside the cover
       * to put the facts in. An explicit attribute beats `:has()` guessing
       * from the children, and it is what `e2e/project-detail.e2e.ts` holds.
       */
      data-cover={coverSpan}
    >
      {/*
        Line-by-line behind a mask, the same entrance the home hero uses.
        Safe here specifically because this `h1` sits *outside* the
        `ViewTransition` below — the practice page's heading, which is inside
        one, deliberately keeps its plain form (`docs/stages/TAHAP-23.md` §3.2).
      */}
      <TextReveal
        as="h1"
        split="lines"
        // One of exactly two places that spend the choreographed band on a
        // heading, and the only two §9.5 names for it. See the `pace` prop.
        pace="epic"
        className={cn('h1', s.title)}
      >
        {title}
      </TextReveal>

      {coverRatio !== undefined && cover && (
        /*
         * The ratio is set inline because it belongs to this asset, not to
         * the component; without it the box cannot be reserved before the
         * file arrives and the page shifts — see `aspectRatioFor`.
         *
         * The span comes from the picture's shape, exactly as it does in the
         * gallery, and for the same reason: a portrait cover given the full
         * twelve columns stands 1748px tall at desktop, which is close to two
         * screens of one image before the reader reaches a single fact about
         * the work. Half the grid shows the same picture uncropped at a size
         * a reader can take in — and it keeps every piece of media on this
         * page on one of two widths.
         */
        <ViewTransition
          {...(transitionName && {
            name: transitionName,
            share: 'morph' as const,
            default: 'none' as const,
          })}
        >
          <div
            data-reveal-item
            className={s.media}
            data-span={coverIsFull ? 'full' : 'half'}
            style={ratioStyle(coverRatio)}
          >
            {/*
              The material layer reaches its third route — Tahap 45.

              `/en` shows a selection of the work with plates that answer the
              pointer, and `/en/work` shows all of it through the same
              surface. The page that shows **one** work at its largest had the
              flattest version of it, which is the wrong way round: this is
              where a reader looks longest.

              ## Why the arrival morph is safe without new wiring

              `vault/blocks/project-card` raises `released` at COMMIT so the
              departing card hands its pixels back before `<ViewTransition>`
              photographs them. The arriving end needs no equivalent, and that
              is a property of `MaterialImage` rather than luck: it hides the
              DOM image only once `drew` is true — the mesh's own report that
              it has actually painted. At the instant the view transition
              captures this page, the scene chunk has not been fetched, so
              `drew` is false, the plain plate is visible, and the morph lands
              on real pixels. The material takes over after.
            */}
            {material ? (
              <MaterialImage
                image={toImageSource(cover)}
                alt={coverAlt}
                maxWidth={coverIsFull ? 1440 : 704}
                className={s.image}
                preload
                sizes={trackImageSizes(coverIsFull ? 92 : 48)}
              />
            ) : (
              <SanityImage
                image={toImageSource(cover)}
                alt={coverAlt}
                maxWidth={coverIsFull ? 1440 : 704}
                className={s.image}
                /*
                 * The cover is this page's largest contentful paint. It
                 * shipped as `loading="lazy"` with no fetch priority, which is
                 * the one image on the page that must never wait its turn.
                 */
                preload
                sizes={trackImageSizes(coverIsFull ? 92 : 48)}
              />
            )}
          </div>
        </ViewTransition>
      )}

      {facts.length > 0 && (
        <dl data-reveal-item className={s.meta}>
          {facts.map((item) => (
            <div key={item.label} className={s.fact}>
              <dt className={cn('caption', s.label)}>{item.label}</dt>
              <dd className={cn('caption', s.value)}>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}
