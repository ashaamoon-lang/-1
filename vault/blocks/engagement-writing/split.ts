/**
 * Which side of an engagement's year a piece of writing falls on.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the split is testable without a page. Its one judgement can be
 * wrong without looking wrong: writing from the engagement's own year belongs
 * with what came before it, not after — the datum is the year, and a level is
 * read as "at or below" — and an entry with no date has no side at all, so it
 * goes last rather than being placed by a guess.
 */

/** The year an ISO date falls in, or `null` when there is no usable date. */
function yearOf(date: string): number | null {
  const time = Date.parse(date)
  return Number.isNaN(time) ? null : new Date(time).getUTCFullYear()
}

/** The two sides of a datum, each in the order the entries arrived. */
export interface DatumSides<E> {
  /** Dated after the datum year. */
  above: E[]
  /** Dated in it or before it, then undated. */
  below: E[]
}

/**
 * Splits entries at a datum year. `above` holds those dated after it;
 * `below` those dated in it or before it, then those with no date. Order
 * within each side is the input's.
 */
export function splitAtDatum<E extends { date: string }>(
  entries: readonly E[],
  year: number
): DatumSides<E> {
  const above: E[] = []
  const below: E[] = []
  const undated: E[] = []

  for (const entry of entries) {
    const entryYear = yearOf(entry.date)
    if (entryYear === null) undated.push(entry)
    else if (entryYear > year) above.push(entry)
    else below.push(entry)
  }

  return { above, below: [...below, ...undated] }
}
