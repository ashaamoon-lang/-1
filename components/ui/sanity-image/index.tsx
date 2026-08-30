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

  return (
    <Image
      src={urlForImage(image).width(maxWidth).auto('format').quality(80).url()}
      alt={alt ?? image.alt ?? ''}
      aspectRatio={aspectRatio}
      sizes={sizes ?? `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`}
      {...props}
    />
  )
}
