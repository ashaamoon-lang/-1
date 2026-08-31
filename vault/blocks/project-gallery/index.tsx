import cn from 'clsx'

import { SanityImage } from '@/components/ui/sanity-image'
import {
  aspectRatioFor,
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { ratioStyle, trackImageSizes } from '@/lib/utils/image-sizes'

import s from './project-gallery.module.css'

/**
 * ProjectGallery — the images of one commissioned work.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## No lightbox, deliberately
 *
 * A lightbox is a modal dialog: focus trap, escape handling, scroll lock,
 * restore-focus-on-close, and a keyboard story for the previous/next controls.
 * That is a component in its own right, not a detail of a gallery — and a
 * gallery without one is not degraded. The images render at the width the
 * layout gives them, and a reader who wants a closer look has the browser's
 * own zoom. If a lightbox is added later it belongs in `components/ui/`
 * beside the other Base UI dialogs, not here.
 *
 * ## Two widths, chosen by the picture's own shape
 *
 * A column of identical full-width images reads as a contact sheet, so there
 * are two spans — and which one an image gets is derived from the asset (see
 * `isFullWidth`), never from an editor's choice, so reordering the gallery in
 * the Studio reflows it rather than breaking it.
 *
 * ## Accessibility
 *
 * Each image carries its own localized `alt` from the CMS, which the schema
 * marks required. The list is a `<ul>` so a screen reader announces how many
 * images there are before walking them.
 */
export interface GalleryImage extends ImageSource {
  _key: string
  /** Localized by GROQ (`gallery[].alt`), required by the schema. */
  alt?: string | null | undefined
}

/**
 * Whether an image of this shape spans the full grid.
 *
 * Landscape and square take the full width; portrait takes half. That is the
 * only rule, and it replaces a positional one (every third image, plus a
 * clause for a trailing odd half).
 *
 * ## Why position was the wrong authority
 *
 * The old rule chose the *track*, but the box did not fill its track: the
 * container capped height at 78svh and let width follow the ratio, so what a
 * reader actually saw was the asset's proportions, not the grid. Measured on
 * `/en/work/panas-sore` at 1440×900 — three images, three widths, all in
 * tracks that were 1398 or 691 wide:
 *
 *   ratio 0.80  ->  562px    ratio 1.33 -> 936px    ratio 1.60 -> 1123px
 *
 * A portrait sat with 836px of empty page beside it. Position decided a track
 * the picture then ignored.
 *
 * Deriving the span from orientation makes the two agree: a portrait is given
 * the half track it fits, a landscape the full one, and the box fills what it
 * is given. It also lands the two on a similar optical height — at 1440, a
 * 1.6 landscape is 874px tall and a 0.8 portrait 864px — so the sequence has
 * a rhythm without any image being cropped to get one.
 *
 * A missing ratio (`null`) takes the full track: without dimensions there is
 * nothing to reason about, and full width is the safe default for artwork.
 */
export function isFullWidth(ratio: number | null): boolean {
  return ratio === null || ratio >= 1
}

interface ProjectGalleryProps {
  images: readonly GalleryImage[]
  className?: string | undefined
}

export function ProjectGallery({ images, className }: ProjectGalleryProps) {
  if (images.length === 0) return null

  return (
    <ul className={cn(s.gallery, className)}>
      {images.map((image) => {
        const ratio = aspectRatioFor(image)
        const full = isFullWidth(ratio)

        return (
          <li
            key={image._key}
            className={s.item}
            data-span={full ? 'full' : 'half'}
          >
            <figure className={s.figure}>
              <div className={s.media} style={ratioStyle(ratio)}>
                <SanityImage
                  image={toImageSource(image)}
                  alt={image.alt ?? ''}
                  className={s.image}
                  maxWidth={full ? 1440 : 704}
                  /*
                   * Matched to the grid track, which the box now actually
                   * fills. The derived default assumes an image fills the
                   * viewport, so a half-width figure asked for 1440px to
                   * render 691 — twice the pixels on the heaviest thing on
                   * the page.
                   */
                  sizes={trackImageSizes(full ? 92 : 48)}
                />
              </div>
            </figure>
          </li>
        )
      })}
    </ul>
  )
}
