import { getImageDimensions } from '@sanity/asset-utils'

import { Image, type ImageProps } from '@/components/ui/image'
import type {
  SanityImageCrop,
  SanityImageHotspot,
} from '@/integrations/sanity/sanity.types'
import { urlForImage } from '@/integrations/sanity/utils/image'

// Sizing is fully owned by this component (it always derives aspectRatio
// from the Sanity asset and always sets `sizes` itself below), so
// fill/width/height and mobileSize/desktopSize/sizes are all omitted —
// Omit over ImageProps' discriminated unions collapses each union to a
// single flattened object type, so leaving any of these in would let a
// caller pass a combination that no longer matches any single ImageProps
// branch.
interface SanityImageProps extends Omit<
  ImageProps,
  | 'src'
  | 'aspectRatio'
  | 'fill'
  | 'width'
  | 'height'
  | 'alt'
  | 'mobileSize'
  | 'desktopSize'
  | 'sizes'
> {
  image: {
    asset?: {
      _ref: string
      _type: 'reference'
    }
    alt?: string
    hotspot?: SanityImageHotspot
    crop?: SanityImageCrop
  }
  /**
   * The widest CSS pixel width this image is ever laid out at.
   *
   * A **layout** measurement, not a file size. The source fetched from Sanity
   * is this multiplied by {@link MAX_PIXEL_RATIO}, because a 1440px-wide
   * figure on a retina screen needs 2880 real pixels to look sharp.
   */
  maxWidth?: number
  /** Alt text override. Falls back to the CMS-provided `image.alt`, then `''`. */
  alt?: string
  /**
   * Override the derived `sizes`.
   *
   * By default this component derives `sizes` from `maxWidth` alone, which is
   * right for an image that fills its container and wrong for one the layout
   * constrains. Measured on the project page: a gallery image rendering at
   * 562px wide requested `w=1440`, roughly three times the pixels it needed,
   * because the default said `(max-width: 1440px) 100vw, 1440px`.
   *
   * Pass this when the layout knows the real rendered width — a half-width
   * grid track, a height-capped figure. Err slightly wide: under-fetching
   * shows as a blurry image, over-fetching only as wasted bytes.
   */
  sizes?: string
}

/**
 * How many device pixels per CSS pixel the source has to cover.
 *
 * 2, not 3. A phone at dpr 3 is the common worst case, but tripling every
 * source triples the bytes for a difference few eyes resolve at that density;
 * 2 keeps laptops and tablets exact and leaves dpr-3 phones marginally soft
 * rather than half-resolution. Raise it only with a measurement.
 */
const MAX_PIXEL_RATIO = 2

export function SanityImage({
  image,
  maxWidth = 1920,
  alt,
  sizes,
  ...props
}: SanityImageProps) {
  if (!image?.asset) return null

  const { width, height } = getImageDimensions(image.asset)
  const aspectRatio = width / height

  /*
   * Two numbers, because `maxWidth` was doing two incompatible jobs.
   *
   * It was passed to `.width()` — capping the pixels Sanity returns — and to
   * `sizes` — telling the browser how wide the image lays out. Those are the
   * same figure only at dpr 1. Everywhere else the browser correctly asked
   * for `w=1920` or `w=2560` and the source had already run out: measured at
   * dpr 2, a 691px-wide figure received 704 real pixels where it needed 1382,
   * and the cover received 1440 where it needed 2246. 0.51x to 0.66x.
   *
   * On a site whose whole proposition is reproducing paintings, that does not
   * read as a bug. It reads as a soft painting. See
   * `docs/AUDIT-2026-08.md` §1.2 — including why the Tahap 5 check could not
   * see it, and what `e2e/image-resolution.e2e.ts` measures instead.
   */
  const sourceWidth = Math.round(maxWidth * MAX_PIXEL_RATIO)

  return (
    <Image
      src={urlForImage(image)
        .width(sourceWidth)
        .auto('format')
        .quality(80)
        .url()}
      alt={alt ?? image.alt ?? ''}
      aspectRatio={aspectRatio}
      sizes={sizes ?? `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`}
      {...props}
    />
  )
}
