import sharp from 'sharp'

/**
 * Measuring what a page actually renders.
 *
 * ## Why this exists
 *
 * Every gate in this repository reads the DOM, the network, or the source.
 * None of them had ever looked at a pixel, and that is exactly how Tahap 17's
 * defect survived sixteen stages: the hero's WebGL wash rendered *darker* than
 * the page behind it — mean luminance 4.0/255 against the ground's 15.5 — and
 * nothing could see it, because "is there a canvas" and "does the canvas draw
 * something worth drawing" are different questions.
 *
 * A DOM assertion cannot answer the second one. A composited WebGL surface is
 * not readable from inside the page either: `readPixels` outside a render
 * callback returns zeros once the drawing buffer has been cleared, which is a
 * trap Tahap 17 fell into and recorded. The only honest instrument is a
 * screenshot, decoded outside the browser.
 *
 * `sharp` is already a declared dependency (`package.json`), so this adds
 * nothing to the tree.
 */

/** Rec. 709 relative luminance, 0–255, from an 8-bit sRGB triple. */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export interface Tone {
  /** Darkest and brightest sampled values. */
  min: number
  max: number
  /** Percentiles, which ignore the handful of outliers text always creates. */
  p05: number
  p95: number
  mean: number
  /**
   * `p95 - p05`: how much tonal modulation the region actually carries.
   *
   * The number that matters. A flat rectangle and a rich gradient can share a
   * mean; only the spread tells them apart. Measured on the hero band: **2.0
   * before the colour-space fix, 13.9 after**.
   */
  range: number
}

/**
 * Tone of a PNG buffer, sampled on a downscaled copy.
 *
 * Downscaling first is deliberate: it averages film grain away so `range`
 * reports the *gradient*, not the noise sitting on top of it. Grain has its
 * own measurement below.
 */
export async function tone(png: Buffer | string): Promise<Tone> {
  const { data, info } = await sharp(png)
    .resize(64, 40, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const values: number[] = []
  for (let i = 0; i < data.length; i += info.channels) {
    values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
  }
  values.sort((a, b) => a - b)

  const at = (q: number) => values[Math.floor(q * (values.length - 1))] ?? 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length

  return {
    min: at(0),
    p05: at(0.05),
    mean,
    p95: at(0.95),
    max: at(1),
    range: at(0.95) - at(0.05),
  }
}

/**
 * Standard deviation inside a small full-resolution patch — the grain proxy.
 *
 * At full resolution and over a small area the gradient contributes almost
 * nothing, so the spread is the noise. This is what caught the second defect
 * in Tahap 17: the hero's grain had been tuned against a broken colour
 * pipeline, and once the pipeline was right it measured **21.0/255**, 77% of
 * the band's own mean. Retuned to 6.45.
 */
export async function grain(
  png: Buffer | string,
  patch = { left: 200, top: 60, width: 96, height: 96 }
): Promise<number> {
  const { data, info } = await sharp(png)
    .extract(patch)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const values: number[] = []
  for (let i = 0; i < data.length; i += info.channels) {
    values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}
