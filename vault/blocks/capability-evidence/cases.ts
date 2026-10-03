/**
 * The work each practice's claim rests on: its listed works, in the
 * catalogue's order.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Pure, so the grouping is testable without a page. Read from what the studio
 * page already holds — the catalogue's own query, unfiltered — so nothing is
 * fetched twice. Nothing is ranked or picked: every work that can be shown and
 * reached is kept, in the order the catalogue curates. A work that names no
 * practice backs no claim, and one with no title or slug cannot be shown or
 * reached, so neither is listed.
 */

export interface CapabilityCase {
  /** Stable, for the key. */
  id: string
  title: string
  /** Locale-free, for `components/ui/link` to localize. */
  href: string
  /** The year the work gives, or null when it gives none. */
  year: number | null
}

/** The fields of a listed work this reads — `workIndexQuery`'s, by shape. */
interface ListedWork {
  _id: string
  slug: { current?: string | undefined } | null
  title: string | null
  year: number | null
  practice: string | null
}

export function casesByPractice(
  works: readonly ListedWork[]
): Map<string, CapabilityCase[]> {
  const cases = new Map<string, CapabilityCase[]>()

  for (const work of works) {
    const slug = work.slug?.current
    if (!work.practice || !slug || !work.title) continue

    const shown: CapabilityCase = {
      id: work._id,
      title: work.title,
      href: `/work/${slug}`,
      year: work.year,
    }
    const listed = cases.get(work.practice)
    if (listed) listed.push(shown)
    else cases.set(work.practice, [shown])
  }

  return cases
}
