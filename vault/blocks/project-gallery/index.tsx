import cn from 'clsx'

import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'

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
 * ## Alternating widths
 *
 * A column of identical full-width images reads as a contact sheet. The widths
 * are derived from position (see `isFullWidth`), so reordering the gallery in
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
 * Whether the image at `index` spans the full grid.
 *
 * Every third image is full width, which gives the sequence a rhythm without
 * asking an editor to choose a layout per image. The second clause covers a
 * trailing half that has nobody to pair with: without it a two-image gallery
 * renders one full image and one half-width image beside six empty columns,
 * which reads as a picture that failed to load. The same happens at 5, 8, 11.
 */
export function isFullWidth(index: number, count: number) {
  return index % 3 === 0 || (index === count - 1 && index % 3 === 1)
}

interface ProjectGalleryProps {
  images: readonly GalleryImage[]
  className?: string | undefined
}

export function ProjectGallery({ images, className }: ProjectGalleryProps) {
  if (images.length === 0) return null

  return (
    <ul className={cn(s.gallery, className)}>
      {images.map((image, index) => (
        <li
          key={image._key}
          className={s.item}
          data-span={isFullWidth(index, images.length) ? 'full' : 'half'}
        >
          <figure className={s.figure}>
            <div className={s.media}>
              <SanityImage
                image={toImageSource(image)}
                alt={image.alt ?? ''}
                maxWidth={isFullWidth(index, images.length) ? 1440 : 704}
                className={s.image}
              />
            </div>
          </figure>
        </li>
      ))}
    </ul>
  )
}
