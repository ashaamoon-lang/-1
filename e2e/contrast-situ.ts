/**
 * What contrast a piece of text **actually has**, against what is actually
 * painted behind it.
 *
 * ## The blindness this exists to end
 *
 * Three things claim to guard contrast here, and none of them can see this:
 *
 * - `lib/styles/scripts/contrast.test.ts` measures **token pairs in
 *   isolation**. `--text-muted` on `--surface` passes, and that is true — but
 *   it says nothing about whether the text is on `--surface` at all.
 * - axe's `color-contrast` rule returns these nodes as **`incomplete`**, not
 *   as violations, with the reason *"Element's background color could not be
 *   determined due to a pseudo element."* It is being honest: this site paints
 *   grain, a wash and pseudo-element layers, and axe cannot resolve them.
 * - and all **11** `new AxeBuilder` call sites across 10 e2e files read
 *   `results.violations` only. `grep -rn "incomplete" e2e/*.ts` returned
 *   nothing. So axe's honesty was discarded at the door: 185 serious nodes
 *   across seven routes, judged by nobody, on seven pages reported green.
 *
 * Inside that hole was a defect visible to the eye — `vault/blocks/
 * project-spine` is `position: sticky` with no background of its own, so below
 * 800px the gallery artwork scrolls under the page index and "Images" measured
 * **1.48:1** against a floor of 4.5. See `docs/stages/TAHAP-72.md` §1.
 *
 * ## Why the maths lives here and not in the browser
 *
 * `loneHalves()` (Tahap 66) and `trackFaults()` (Tahap 71) set the pattern:
 * lift the judgement out of `page.evaluate`, let the browser supply only
 * measurements, and test the decision against cases the fixtures cannot
 * produce. WCAG's *large text* rule in particular — 24px at any weight, or
 * 18.66px at 700 — is one of the most frequently mis-transcribed lines in the
 * whole standard, and here it becomes testable without a single pixel.
 *
 * The browser still needs a luminance function to **search** for the worst
 * pixel under a run. That copy is deliberately not the verdict: it returns its
 * worst few candidates, `worstContrast()` re-derives the answer here, and the
 * gate asserts the two agree. A transcription drift in the in-page copy fails
 * loudly instead of quietly under-reporting.
 */

/** 8-bit sRGB, as the compositor paints it. */
export interface Rgb {
  readonly r: number
  readonly g: number
  readonly b: number
}

/** One measured piece of text, already reduced to its worst pixel. */
export interface TextRun {
  /** The text itself, trimmed, for naming the fault. */
  readonly label: string
  /** Where it was found — route, viewport and scroll position. */
  readonly where: string
  /** Used tag name, so a fault points at something findable. */
  readonly tag: string
  /** Computed `font-size` in CSS pixels. */
  readonly sizePx: number
  /** Computed `font-weight` as a number. */
  readonly weight: number
  /** The measured worst contrast ratio under this run's glyph boxes. */
  readonly ratio: number
}

/**
 * sRGB channel to linear light. WCAG 2.x, and the 0.04045 knee is part of the
 * definition rather than an approximation.
 */
function toLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance. */
export function relativeLuminance(colour: Rgb): number {
  return (
    0.2126 * toLinear(colour.r) +
    0.7152 * toLinear(colour.g) +
    0.0722 * toLinear(colour.b)
  )
}

/**
 * WCAG contrast ratio. Symmetric — the lighter of the two is always the
 * numerator, so the caller does not have to know which is text.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Semi-transparent text over its backdrop.
 *
 * This is not a refinement, it is required: the page index measured here is
 * `oklab(0.964 … / 0.75)`, and judging it at full opacity would report a
 * contrast no reader ever gets. `alpha` is 0..1; 1 returns `fg` unchanged.
 */
export function compositeOver(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  const mix = (f: number, b: number) => alpha * f + (1 - alpha) * b
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b) }
}

/**
 * The AA floor for text of this size and weight.
 *
 * WCAG 2.1 §1.4.3: large-scale text is 18pt, or 14pt bold. In CSS pixels at
 * the standard 96dpi that is **24px**, or **18.66px** at weight >= 700 —
 * the same two constants axe-core uses, so the two agree about which nodes
 * they are talking about.
 */
export function wcagFloor(sizePx: number, weight: number): number {
  const large = sizePx >= 24 || (sizePx >= 18.66 && weight >= 700)
  return large ? 3 : 4.5
}

/**
 * The lowest contrast `fg` reaches over any of `backgrounds`, and which one.
 *
 * Returns `undefined` for an empty list rather than a sentinel ratio: the
 * first version of this probe seeded its accumulator with `Infinity`, every
 * candidate was rejected by a colour parser that never matched, and it
 * reported `worst=Infinity:1` on every route while looking like it had run.
 * A gate that cannot distinguish "nothing measured" from "nothing wrong" is
 * the failure this project has now recorded four times.
 */
export function worstContrast(
  fg: Rgb,
  alpha: number,
  backgrounds: readonly Rgb[]
): { ratio: number; bg: Rgb } | undefined {
  let worst: { ratio: number; bg: Rgb } | undefined
  for (const bg of backgrounds) {
    const ratio = contrastRatio(compositeOver(fg, bg, alpha), bg)
    if (!worst || ratio < worst.ratio) worst = { ratio, bg }
  }
  return worst
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Every run that does not clear its own AA floor.
 *
 * Faults rather than a throw, so one run reports all of them and names each
 * one — `media-edge` and `track-contract` return lists for the same reason.
 */
export function contrastFaults(runs: readonly TextRun[]): string[] {
  const faults: string[] = []
  for (const run of runs) {
    const floor = wcagFloor(run.sizePx, run.weight)
    if (run.ratio >= floor) continue
    faults.push(
      `${round(run.ratio)}:1 needs ${floor}:1 — <${run.tag}> ${round(run.sizePx)}px/${run.weight} "${run.label}" at ${run.where}`
    )
  }
  return faults
}
