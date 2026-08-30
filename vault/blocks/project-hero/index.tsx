import cn from 'clsx'

import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'

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
 * Client, year, medium and dimensions are label/value pairs about one subject,
 * which is exactly what `<dl>` describes. A table would claim a relationship
 * between rows that does not exist. Any pair whose value is missing is dropped
 * rather than rendered blank — an editor who has not filled in dimensions
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
  className?: string | undefined
}

export function ProjectHero({
  title,
  cover,
  coverAlt,
  meta,
  className,
}: ProjectHeroProps) {
  const facts = meta.filter(
    (item) =>
      item.value !== null && item.value !== undefined && item.value !== ''
  )

  return (
    <header className={cn(s.hero, className)}>
      <h1 className={cn('h1', s.title)}>{title}</h1>

      {cover && (
        <div className={s.media}>
          <SanityImage
            image={toImageSource(cover)}
            alt={coverAlt}
            maxWidth={1440}
            className={s.image}
          />
        </div>
      )}

      {facts.length > 0 && (
        <dl className={s.meta}>
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
