import { getImageDimensions } from '@sanity/asset-utils'
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'

import { dataset, projectId } from '../env'
import type { SanityImageCrop, SanityImageHotspot } from '../sanity.types'

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null

export const urlForImage = (source: SanityImageSource) => {
  if (!builder) {
    throw new Error(
      'Sanity image builder not configured — missing NEXT_PUBLIC_SANITY_PROJECT_ID'
    )
  }
  return builder.image(source)
}

/**
 * The three fields `components/ui/sanity-image` actually renders from.
 *
 * Everything else on a CMS image object is noise to it — and one field is
 * worse than noise. A localized image carries `alt` as an
 * `internationalizedArray*` value (`[{ _key, value }]`), while `SanityImage`
 * types its `alt` fallback as a plain string; handing it the raw object makes
 * the two disagree, and the honest fix is not to widen `SanityImage` but to
 * stop passing a field this codebase never reads from there.
 *
 * Localized alt text comes out of GROQ already resolved (`coverAlt`,
 * `portraitAlt` in `queries.ts`) and is passed explicitly at the call site,
 * which is also the only way alt text can be correct per language.
 */
export interface ImageSource {
  asset?: { _ref: string; _type: 'reference' }
  hotspot?: SanityImageHotspot
  crop?: SanityImageCrop
}

/**
 * Narrows a CMS image object to what `SanityImage` needs.
 *
 * Conditional spreads rather than direct assignment: `exactOptionalPropertyTypes`
 * distinguishes "absent" from "present and undefined", and an image with no
 * crop must be the former.
 */
export function toImageSource(image: {
  asset?: { _ref: string; _type: 'reference' } | undefined
  hotspot?: SanityImageHotspot | undefined
  crop?: SanityImageCrop | undefined
}): ImageSource {
  return {
    ...(image.asset && { asset: image.asset }),
    ...(image.hotspot && { hotspot: image.hotspot }),
    ...(image.crop && { crop: image.crop }),
  }
}

/**
 * The asset's own width ÷ height, or `null` when it cannot be determined.
 *
 * Sanity encodes the dimensions in the asset reference itself
 * (`image-<hash>-1600x2000-jpg`), so this is a string parse — no network, no
 * await, available during render.
 *
 * ## Why a container needs this
 *
 * `next/image` writes `width`/`height` onto the `<img>`, which is enough for a
 * box that is only width-constrained. It is **not** enough for one that is
 * *height*-capped: with `max-height` and `width: auto`, a browser reserves the
 * full intrinsic height first and only shrinks the width once the file has
 * loaded, so everything below jumps up. Measured on the project page before
 * this existed: **CLS 0.236**, one shift at 127ms moving the meta list, the
 * body, the gallery and the next-project block at once.
 *
 * Giving the container an explicit `aspect-ratio` alongside its `max-height`
 * makes the box fully determined before the first byte of the image arrives.
 */
export function aspectRatioFor(image: {
  asset?: { _ref: string } | undefined
}): number | null {
  if (!image.asset?._ref) return null

  try {
    const { width, height } = getImageDimensions(image.asset._ref)
    return height > 0 ? width / height : null
  } catch {
    // A malformed or non-image reference. A missing ratio costs a reserved
    // box, not a crash.
    return null
  }
}
