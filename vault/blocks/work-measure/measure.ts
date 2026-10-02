/**
 * The measure of a body of work: how many engagements, for how many clients,
 * over which years.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the counting is testable without a page. Two of its answers can be
 * wrong without looking wrong: a client counted twice reads as a broader
 * client list than the studio has, and a mark placed at an end draws a year
 * the span already shows.
 *
 * Nothing is estimated. Undated work counts as an engagement but stretches no
 * span, and work with no named client counts as an engagement but not as a
 * client.
 */

export interface MeasuredWork {
  year: number | null
  client: string | null
}

export interface Measure {
  engagements: number
  /** Distinct named clients. */
  clients: number
  /** The first and last dated year; both `null` when nothing is dated. */
  from: number | null
  to: number | null
  /**
   * Every year with work strictly between `from` and `to`, as a place along
   * the span — 0 at `from`, 1 at `to`. The ends are the span's own and are
   * left out.
   */
  marks: number[]
}

export function measureWorks(works: readonly MeasuredWork[]): Measure {
  const years = [
    ...new Set(
      works
        .map((work) => work.year)
        .filter((year): year is number => year !== null)
    ),
  ].sort((a, b) => a - b)
  const from = years.at(0) ?? null
  const to = years.at(-1) ?? null
  const clients = new Set(
    works
      .map((work) => work.client?.trim() ?? '')
      .filter((client) => client !== '')
  )

  return {
    engagements: works.length,
    clients: clients.size,
    from,
    to,
    marks:
      from === null || to === null || from === to
        ? []
        : years.slice(1, -1).map((year) => (year - from) / (to - from)),
  }
}
