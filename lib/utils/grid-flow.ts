/**
 * Twelve-column row flow, shared by the two grids that lay out halves and
 * fulls — Tahap 86.
 *
 * Moved out of `vault/blocks/project-gallery`, where Tahap 66 wrote it, when
 * the home page's project grid turned out to strand a half-width card in
 * exactly the way the note below describes for the gallery: `6, 12, 6, 6`
 * left 787px of empty ground beside the first card at 1600×900. A pure module
 * so that grid can use it without importing the gallery.
 *
 * The measurement in the note is the gallery's, and it stays as written —
 * it is the record of why the flow is simulated.
 */

/** The twelve-column desktop grid, in the units the spans are written in. */
export const GRID_COLUMNS = 12

/**
 * Which half-width plates end up alone in their row.
 *
 * ## The hole this exists to close, and why the last rule did not close it
 *
 * `isFullWidth` in `vault/blocks/project-gallery` fixed a real defect in
 * Tahap 44 — the box and its track
 * disagreed, so a picture ignored the column it was given. Its own note
 * records what that looked like: *"A portrait sat with 836px of empty page
 * beside it."*
 *
 * Measured on the production build at 1440×900, `/en/work/arus-balik`,
 * 2026-09-13 — after that fix:
 *
 * ```
 * span=half   x=16  w= 572  top= 404   h=715
 * span=full   x=16  w=1161  top=1234   h=675
 * span=half   x=16  w= 572  top=1957   h=786
 * ```
 *
 * The spans run `half, full, half`, so **neither half ever meets another**:
 * each one opens a row, the full cannot join it, and 572px of ground sits
 * beside each picture. Roughly 860 thousand square pixels of empty page, on
 * the one route that exists to sell a piece of work.
 *
 * So the rule fixed the *track* and left the *row*. 836px became 572px, and
 * stayed.
 *
 * ## Why the flow is simulated rather than guessed from neighbours
 *
 * "A half pairs when the next item is a half" is wrong on three halves in a
 * row: the first two fill a row and the third opens its own. The only answer
 * that is right for every sequence is the one the browser computes — walk the
 * items, fill rows to twelve columns, and report any row that holds exactly
 * one half.
 *
 * @param spans `true` for a full-width plate, `false` for a half.
 * @returns One boolean per plate: `true` where a half stands alone in its row.
 */
export function loneHalves(spans: readonly boolean[]): boolean[] {
  const lone = spans.map(() => false)

  let row: number[] = []
  let used = 0

  const close = () => {
    const only = row.length === 1 ? row[0] : undefined
    if (only !== undefined && spans[only] === false) lone[only] = true
    row = []
    used = 0
  }

  for (const [index, full] of spans.entries()) {
    const width = full ? GRID_COLUMNS : GRID_COLUMNS / 2
    if (used + width > GRID_COLUMNS) close()
    row.push(index)
    used += width
  }
  close()

  return lone
}

/**
 * The span each editorial card actually takes — Tahap 86.
 *
 * `editorial` takes widths from the CMS, and a width chosen per project knows
 * nothing about rows. The home page's featured works run `6, 12, 6, 6`, so the
 * first half opened a row the full card could not join and stood alone with
 * **787px of empty ground beside it at 1600×900** — reported by the repo owner
 * as "a missing grid". The gallery had the same hole and closed it in
 * Tahap 66 with `loneHalves`, which simulates the twelve-column flow; this is
 * that flow, pointed at this grid.
 *
 * A lone half is promoted to the card's own full form (12 columns, the 16:9
 * crop `project-card` already defines). The gallery fills its row with the
 * plate's note instead, but a card carries only its title and one line of
 * facts — already shown under the picture — and filling the half with anything
 * else would mean writing copy nobody wrote. `docs/stages/TAHAP-86.md` §2.
 *
 * The order is never changed. Pulling the next half up would overrule the
 * editor's sequence and split visual order from reading order.
 *
 * One pass is a fixed point: a half is alone only because the next card does
 * not fit its row or there is no next card, so its full form fills exactly
 * that row and moves nothing else. The tests feed the result back in.
 *
 * @param spans The authored span per card; a missing span is a half, as the
 *   schema's `initialValue` is.
 */
export function settledSpans(spans: readonly (6 | 12 | null)[]): (6 | 12)[] {
  const authored = spans.map((span) => span ?? 6)
  const lone = loneHalves(authored.map((span) => span === 12))
  return authored.map((span, index) => (lone[index] ? 12 : span))
}
