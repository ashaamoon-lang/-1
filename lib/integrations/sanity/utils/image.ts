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
