/**
 * What each practice carries: its journal entries and its listed work.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the counting is testable without a page. Counted from what the
 * journal index already holds — its entries, and the work it reads covers
 * from — so nothing is fetched twice and nothing is estimated. Every practice
 * the site names gets a row, in the site's own order, including one that has
 * carried nothing yet: an absent row would hide exactly the imbalance the
 * table exists to show. Entries filed under no practice are counted nowhere.
 */

export interface PracticeCount<P extends string> {
  practice: P
  entries: number
  works: number
}

export function countByPractice<P extends string>(
  order: readonly P[],
  entries: readonly { practice: string | null }[],
  works: ReadonlyMap<string, readonly unknown[] | null>
): PracticeCount<P>[] {
  return order.map((practice) => ({
    practice,
    entries: entries.filter((entry) => entry.practice === practice).length,
    works: works.get(practice)?.length ?? 0,
  }))
}
