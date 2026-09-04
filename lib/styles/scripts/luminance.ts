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

export interface Contribution {
  /** Mean of the accent's own per-pixel contribution. */
  mean: number
  /** `p95 - p05` of that contribution: is it a gradient or a flat lift? */
  range: number
  /** Fraction of sampled pixels the accent changed at all. */
  coverage: number
}

/**
 * What one layer contributed, isolated from everything drawn beside it.
 *
 * `tone()` answers "how much modulation is in this band", which is the right
 * question only when the band holds nothing but the layer being measured.
 * Tahap 34 broke that assumption honestly: the hero gave up 12svh so the next
 * section would peek, the headline moved 96px up, and 91px of white-on-black
 * type crossed into the band `visual-substance.e2e.ts` samples. The band's
 * `range` went from reporting a wash to reporting a typeface — 92.7 with the
 * accent, 94.8 without, on a wash that had not changed at all.
 *
 * Subtracting the two frames removes everything identical in both. What is
 * left is exactly the layer that was hidden between them, whatever else the
 * band happens to contain. `range` then means what §5's rule always meant:
 * the accent has to *do* something, not lift the band evenly.
 *
 * Both images must be the same size; they come from the same clip.
 */
export async function contribution(
  withLayer: Buffer | string,
  withoutLayer: Buffer | string
): Promise<Contribution> {
  const read = (png: Buffer | string) =>
    sharp(png).resize(64, 40, { fit: 'fill' }).raw().toBuffer({
      resolveWithObject: true,
    })

  const [lit, bare] = await Promise.all([read(withLayer), read(withoutLayer)])

  const deltas: number[] = []
  let changed = 0

  for (let i = 0; i < lit.data.length; i += lit.info.channels) {
    const a = luminance(
      lit.data[i] ?? 0,
      lit.data[i + 1] ?? 0,
      lit.data[i + 2] ?? 0
    )
    const b = luminance(
      bare.data[i] ?? 0,
      bare.data[i + 1] ?? 0,
      bare.data[i + 2] ?? 0
    )
    const delta = a - b
    deltas.push(delta)
    // 0.5/255 is below what any display resolves; anything above it is a
    // pixel the layer actually touched.
    if (Math.abs(delta) > 0.5) changed += 1
  }

  deltas.sort((a, b) => a - b)
  const at = (q: number) => deltas[Math.floor(q * (deltas.length - 1))] ?? 0

  return {
    mean: deltas.reduce((a, b) => a + b, 0) / deltas.length,
    range: at(0.95) - at(0.05),
    coverage: changed / deltas.length,
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

export interface Legibility {
  /** 1st percentile — the ground the text sits on. */
  p01: number
  /** 99th percentile — how bright the brightest glyph pixels actually get. */
  p99: number
  /** `p99 - p01`: the range a reader's eye has to work with. */
  spread: number
  mean: number
}

/**
 * Whether text in a band is still readable — measured at **full resolution**.
 *
 * ## Why this is not `tone()`
 *
 * `tone()` downscales to 64×40 on purpose, so grain averages away and `range`
 * reports the gradient. That is exactly wrong for text: at 64×40 a hairline
 * glyph is blended into its background before it is ever measured, and the
 * signal this function exists to read is gone. So this one samples the band as
 * rendered, and uses 1st/99th percentiles rather than min/max so a single
 * stray pixel cannot speak for the band.
 *
 * ## Why the mean is not the answer
 *
 * Tahap 22 found the home page's footer painting *underneath* the fixed WebGL
 * wrapper — `<footer>` was `position: static`, so it sat in the non-positioned
 * block layer, which CSS paints below every positioned sibling. The four
 * columns became unreadable.
 *
 * Mean luminance **rose** across that defect, 16.90 → 23.82, because the wash
 * genuinely adds light. Reading the mean would have concluded the canvas was
 * helping. What it destroyed was the distance between the glyphs and their
 * ground: p99 fell from **98 to 39**. The spread is the honest number, and it
 * is the second time in this project that picking the wrong statistic hid the
 * very defect being looked for (Tahap 17 was the first).
 */
export async function legibility(
  png: Buffer | string,
  band: { left: number; top: number; width: number; height: number }
): Promise<Legibility> {
  const { data, info } = await sharp(png).extract(band).raw().toBuffer({
    resolveWithObject: true,
  })

  const values: number[] = []
  for (let i = 0; i < data.length; i += info.channels) {
    values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
  }
  values.sort((a, b) => a - b)

  const at = (q: number) => values[Math.floor(q * (values.length - 1))] ?? 0
  const p01 = at(0.01)
  const p99 = at(0.99)

  return {
    p01,
    p99,
    spread: p99 - p01,
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  }
}
