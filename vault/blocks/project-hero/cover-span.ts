import { aspectRatioFor } from '@/lib/integrations/sanity/utils/image'
import { isFullWidth } from '@/lib/utils/grid-flow'

/** How many of the twelve columns a project's cover takes. */
export type CoverSpan = 'full' | 'half' | 'none'

/**
 * The cover's span, decided once for both sides that need it — the fork.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * `ProjectHero` lays the cover out by it, and the project page decides by it
 * whether the case study's notes go in the empty column beside a half-width
 * cover or below the hero. Two copies of this rule would be one drift away
 * from rendering the notes twice, or not at all.
 *
 * A module of its own, with no `'use client'`: the hero is a client
 * component and the page a server one, and a function exported from a client
 * module reaches a server component only as a reference it cannot call —
 * the same reason `isFullWidth` and `loneHalves` live in `lib/utils`.
 *
 * `none` for no cover. A cover whose ratio cannot be read takes the full
 * track, as `isFullWidth(null)` has always decided.
 */
export function coverSpanOf(
  cover: Parameters<typeof aspectRatioFor>[0] | null | undefined
): CoverSpan {
  if (!cover) return 'none'
  return isFullWidth(aspectRatioFor(cover)) ? 'full' : 'half'
}
