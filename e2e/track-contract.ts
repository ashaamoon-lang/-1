/**
 * What width a piece of artwork is allowed to be, per layout.
 *
 * ## Why this is a function and not four lines inside `page.evaluate`
 *
 * `media-edge.e2e.ts` judged **every** image on a project page by the grid's
 * contract, because the grid was the only layout that had ever existed there.
 * Tahap 70 found that a horizontal run would turn that gate red — not because
 * the run is wrong, but because the rule does not describe it:
 *
 * ```
 * media-edge.e2e.ts:218   expect(half).toBeLessThan(full - TOLERANCE)
 * ```
 *
 * A portrait must be narrower than a landscape. True of a grid, and impossible
 * in a run, where every plate takes the same `34vw` whatever its shape.
 *
 * Fixing that inline would leave the run branch **unreachable on today's
 * dataset** — every seeded project carries two images against a `RUN_MINIMUM`
 * of four, so no route draws a run. A gate whose new branch never executes is
 * the failure this project has now recorded three times: Tahap 68 wrote a gate
 * that could not fail, Tahap 69 shipped two that were green over a real defect,
 * and Tahap 70 wrote an assertion that contradicted the mechanism.
 *
 * So the decision is a pure function over measured plates, and
 * `track-contract.test.ts` exercises **both** layouts — including the one no
 * page renders yet. That is the shape Tahap 66 used for `loneHalves()`: lift
 * the judgement out, test it against synthetic cases the fixtures cannot
 * produce, and let the browser supply only the measurements.
 *
 * ## The two contracts
 *
 * | layout | rule                                                             |
 * | ------ | ---------------------------------------------------------------- |
 * | grid   | two widths — one full track, one half; a portrait is narrower     |
 * | run    | **one** width, shared by every plate, whatever its ratio          |
 *
 * The run's rule is the stricter of the two, which is worth saying plainly:
 * excluding run plates from this file — the first fix that came to mind —
 * would have left nothing asserting their widths at all.
 */

/** One measured piece of artwork on a project page. */
export interface Plate {
  /** The served derivative's width ÷ height. `>= 1` is a full track. */
  readonly ratio: number
  /** Rendered CSS width, in pixels. */
  readonly width: number
  /** Whether this plate is inside `[data-epic="project-run"]`. */
  readonly inRun: boolean
}

/** The widest minus the narrowest, or 0 for fewer than two. */
function spread(plates: readonly Plate[]): number {
  if (plates.length === 0) return 0
  const widths = plates.map((plate) => plate.width)
  return Math.max(...widths) - Math.min(...widths)
}

const px = (value: number) => `${Math.round(value)}px`

/**
 * Every way this page's artwork breaks the contract for the layout it is in.
 *
 * Returns human-readable faults rather than throwing, so the caller can name
 * the page and the test reports all of them at once instead of the first.
 *
 * `tolerance` is the caller's sub-pixel slack, not a design decision: widths
 * are fractional and two boxes on the same track differ in the last decimal.
 */
export function trackFaults(
  plates: readonly Plate[],
  tolerance: number
): string[] {
  const faults: string[] = []

  const run = plates.filter((plate) => plate.inRun)
  const grid = plates.filter((plate) => !plate.inRun)

  /*
   * The run: one width, and ratio is deliberately not consulted.
   *
   * A run lays its plates on a single track and lets each picture sit inside
   * it, so a portrait and a landscape are the same width **by design**. That
   * is the opposite of the grid's rule, which is exactly why one function
   * cannot apply one rule to both.
   */
  if (run.length > 0) {
    const runSpread = spread(run)
    if (runSpread > tolerance) {
      faults.push(
        `the run spreads its plates across ${px(runSpread)} of width (${run
          .map((plate) => px(plate.width))
          .join(', ')}) — a run is one track, and every plate takes it whole`
      )
    }
  }

  /*
   * The grid: the contract Tahap 11b measured and this file was written for.
   * Unchanged in substance — only the set it applies to got smaller.
   */
  const fulls = grid.filter((plate) => plate.ratio >= 1)
  const halves = grid.filter((plate) => plate.ratio < 1)

  const fullSpread = spread(fulls)
  if (fullSpread > tolerance) {
    faults.push(
      `landscape and square works land on different widths (${fulls
        .map((plate) => px(plate.width))
        .join(', ')})`
    )
  }

  const halfSpread = spread(halves)
  if (halfSpread > tolerance) {
    faults.push(
      `portrait works land on different widths (${halves
        .map((plate) => px(plate.width))
        .join(', ')})`
    )
  }

  if (fulls.length > 0 && halves.length > 0) {
    const narrowestFull = Math.min(...fulls.map((plate) => plate.width))
    const widestHalf = Math.max(...halves.map((plate) => plate.width))
    if (!(widestHalf < narrowestFull - tolerance)) {
      faults.push(
        `a portrait work is not narrower than a landscape one (${px(widestHalf)} vs ${px(narrowestFull)})`
      )
    }
  }

  return faults
}
