/**
 * Which project follows the one being read.
 *
 * Pure, and separate from the component that renders it, because every way of
 * getting this wrong is silent:
 *
 *  - alphabetical order looks fine and quietly discards the studio's curation;
 *  - not wrapping leaves the last project with no forward path, which is where
 *    readers stop;
 *  - wrapping without a length check points a single-project site at itself,
 *    a dead end wearing a "next" label.
 *
 * The list is expected in the same order the grid uses (`order asc,
 * publishedAt desc`), which is what the queries already return — so "next"
 * means the next work the studio chose to show, not the next one alphabetically
 * or by date.
 */

export interface OrderedProject {
  slug: { current?: string | undefined } | null
}

/**
 * The project after `currentSlug`, wrapping at the end.
 *
 * Returns `null` when there is nothing meaningful to point at: a list of one,
 * an empty list, or a slug that is not in the list at all (which happens on a
 * draft being previewed before it is published).
 */
export function nextProject<T extends OrderedProject>(
  projects: readonly T[],
  currentSlug: string
): T | null {
  // One project has no "next" but itself. A link back to the page you are
  // already reading is a dead end that looks like a way forward.
  if (projects.length < 2) return null

  const index = projects.findIndex(
    (project) => project.slug?.current === currentSlug
  )
  if (index === -1) return null

  // Wraps: the last project leads to the first, so the sequence is a loop
  // rather than a corridor with a wall at the end.
  return projects[(index + 1) % projects.length] ?? null
}
