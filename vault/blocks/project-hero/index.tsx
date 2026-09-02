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
  className?: string | undefined
}

export function ProjectHero({
  title,
  cover,
  coverAlt,
  meta,
  transitionName,
  className,
}: ProjectHeroProps) {
  const facts = meta.filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== ''
  )

  const ref = useReveal<HTMLElement>()
  const coverRatio = cover ? aspectRatioFor(cover) : undefined
  const coverIsFull = isFullWidth(coverRatio ?? null)

  return (
    <header ref={ref} className={cn(s.hero, className)}>
      <h1 data-reveal-item className={cn('h1', s.title)}>
        {title}
      </h1>

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
            <SanityImage
              image={toImageSource(cover)}
              alt={coverAlt}
              maxWidth={coverIsFull ? 1440 : 704}
              className={s.image}
              /*
               * The cover is this page's largest contentful paint. It shipped
               * as `loading="lazy"` with no fetch priority, which is the one
               * image on the page that must never wait its turn.
               */
              preload
              sizes={trackImageSizes(coverIsFull ? 92 : 48)}
            />
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
