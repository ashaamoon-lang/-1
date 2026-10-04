/**
 * The catalogue's frame, as data: every work placed by the practice that
 * carried it and the year it is dated.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the placement is testable without a page — the one decision in
 * `CatalogueFrame` that can be wrong without looking wrong. A work dropped
 * from its bay, or a bay that shuffles the catalogue's own order, would
 * still render a tidy table.
 *
 * Nothing is invented to fill the frame. A practice with no work gets no row,
 * a year with no work gets no column, and a bay with nothing in it stays
 * empty: the frame shows where the load is, and where it is not.
 */

import type { ImageSource } from '@/lib/integrations/sanity/utils/image'

export interface FrameWork {
  id: string
  title: string
  /** Locale-free, for `components/ui/link` to localize. */
  href: string
  client: string | null
  practice: string | null
  year: number | null
  /**
   * The cover the catalogue grid already shows, for the plate that follows
   * the work in hand. Carried through placement untouched.
   */
  cover?: ImageSource | null
}

export interface FrameRow<P extends string> {
  /** `null` for works whose practice is missing or not one the site names. */
  practice: P | null
  /** One bay per column of `Frame.years`, in the same order. */
  bays: FrameWork[][]
}

export interface Frame<P extends string> {
  /** Ascending, so time runs left to right; `null` last, for undated work. */
  years: (number | null)[]
  rows: FrameRow<P>[]
}

/**
 * Place every work in its bay.
 *
 * Rows follow `order` — the site's own sequence of practices — and keep only
 * the practices that carry work, followed by one row for works the order does
 * not name. Within a bay, works keep the order they arrived in, which is the
 * catalogue's.
 */
export function buildFrame<P extends string>(
  works: readonly FrameWork[],
  order: readonly P[]
): Frame<P> {
  const named = new Set<string>(order)
  const rowOf = (work: FrameWork): P | null =>
    work.practice !== null && named.has(work.practice)
      ? (order.find((value) => value === work.practice) ?? null)
      : null

  const dated = [
    ...new Set(
      works
        .map((work) => work.year)
        .filter((year): year is number => year !== null)
    ),
  ].sort((a, b) => a - b)
  const years: (number | null)[] = works.some((work) => work.year === null)
    ? [...dated, null]
    : dated

  const rowKeys: (P | null)[] = [
    ...order.filter((value) => works.some((work) => rowOf(work) === value)),
    ...(works.some((work) => rowOf(work) === null) ? [null] : []),
  ]

  return {
    years,
    rows: rowKeys.map((practice) => ({
      practice,
      bays: years.map((year) =>
        works.filter((work) => rowOf(work) === practice && work.year === year)
      ),
    })),
  }
}
