import type { CSSProperties } from 'react'

/**
 * `sizes` for an image whose height is capped.
 *
 * A `sizes` attribute normally describes how wide an image renders as a share
 * of the viewport. That breaks for the pattern this site uses on artwork: the
 * container caps height (`max-height: 78svh`) and lets width follow the
 * aspect ratio, so a landscape piece fills its grid track while a portrait one
 * renders far narrower — from the same rule, at the same breakpoint.
 *
 * Measured on the project page before this existed: a gallery image rendering
 * 562px wide requested a 1440px asset, because `sizes` could only say "92vw".
 * Roughly three times the pixels, on the images that are already the heaviest
 * thing on the page.
 *
 * The ratio is known at render time (Sanity encodes the dimensions in the
 * asset reference), so the real width can be stated exactly: it is whichever
 * is smaller of the grid track and `capVh × ratio`.
 */
export function cappedImageSizes(options: {
  /** Width ÷ height of the asset, or `null` when it could not be read. */
  ratio: number | null
  /** Share of the viewport the grid track occupies at desktop, e.g. `48`. */
  trackVw: number
  /** The container's `max-height`, in vh. Defaults to the 78svh used by the
   * artwork blocks. */
  capVh?: number
}): string {
  const { ratio, trackVw, capVh = 78 } = options
  const desktop =
    ratio === null
      ? `${trackVw}vw`
      : // `min()` in `sizes` is a CSS math function, which the attribute
        // accepts. Without a ratio there is nothing to compute, so the track
        // width stands — slightly wide, never blurry.
        `min(${trackVw}vw, ${(capVh * ratio).toFixed(1)}vh)`

  // Below the desktop breakpoint every one of these blocks is single-column.
  return `(max-width: 800px) 100vw, ${desktop}`
}

/**
 * The inline style that hands an asset's aspect ratio to CSS.
 *
 * A custom property rather than `aspectRatio` directly, because the CSS needs
 * the number twice: once as the ratio and once inside the `max-width` that
 * turns a height cap into a width cap. React accepts custom properties in a
 * style object; its `CSSProperties` type does not describe them, which is what
 * the assertion below is for.
 */
export function ratioStyle(ratio: number | null): CSSProperties {
  // SAFETY: CSS custom properties are valid in a React style object at
  // runtime; `CSSProperties` has no index signature to express one.
  return ratio === null ? {} : ({ '--ratio': ratio } as CSSProperties)
}
