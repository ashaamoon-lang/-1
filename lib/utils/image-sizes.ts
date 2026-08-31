import type { CSSProperties } from 'react'

/**
 * How tall a piece of artwork may be, as a multiple of its own width.
 *
 * A gallery holds pictures of different shapes and the layout has no business
 * re-cropping them, so the ratio a box uses is the asset's own. This is the
 * one exception: a portrait taller than about 1.4 screens-widths turns the
 * page into a tunnel, and the reader pans through the piece instead of taking
 * it in. Above the limit the box stops getting taller and `object-fit: cover`
 * trims the extremes.
 *
 * Nothing in the seeded catalogue reaches it — the tallest asset is 0.8 — so
 * it is a guard against a future upload, not a crop applied to today's work.
 */
const MIN_RATIO = 0.7

/**
 * The asset's ratio, bounded so no single image can run away with the page.
 *
 * Returns `null` unchanged: a missing ratio means the box cannot be reserved
 * from the ratio at all, which the CSS handles separately.
 */
export function boundedRatio(ratio: number | null): number | null {
  return ratio === null ? null : Math.max(ratio, MIN_RATIO)
}

/**
 * `sizes` for an artwork image that fills its grid track.
 *
 * ## Why this is now simply the track
 *
 * It used to compute `min(trackVw, capVh × ratio)`, because the container
 * capped *height* and let width follow the ratio. That made the rendered
 * width a function of each photo's proportions, and it is what produced this,
 * measured on `/en/work/panas-sore` at 1440×900:
 *
 *   ratio 0.80   ->  562px wide   in a 1398px track
 *   ratio 1.33   ->  936px wide   in a 1398px track
 *   ratio 1.60   -> 1123px wide   in a 1398px track
 *
 * Every box exactly 702px tall (78svh) and no two the same width, so a
 * portrait sat with 836px of dead space beside it and the page had no left or
 * right edge a reader could follow (`docs/stages/TAHAP-11.md` §2.2).
 *
 * The box fills its track now and the height follows from the ratio, so the
 * real rendered width *is* the track width and `sizes` can just say so. The
 * bytes argument that justified the old form still holds — it is simply the
 * track that answers it now, not a computed cap.
 */
export function trackImageSizes(trackVw: number): string {
  // Below the desktop breakpoint every one of these blocks is single-column.
  return `(max-width: 800px) 100vw, ${trackVw}vw`
}

/**
 * The inline style that hands an asset's aspect ratio to CSS.
 *
 * A custom property rather than `aspectRatio` directly, so the value stays
 * available to any rule that needs it and so a missing ratio is expressible
 * as "the property is absent" rather than as a magic number.
 */
export function ratioStyle(ratio: number | null): CSSProperties {
  const bounded = boundedRatio(ratio)
  // SAFETY: CSS custom properties are valid in a React style object at
  // runtime; `CSSProperties` has no index signature to express one.
  return bounded === null ? {} : ({ '--ratio': bounded } as CSSProperties)
}
