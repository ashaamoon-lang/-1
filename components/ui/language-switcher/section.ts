/**
 * Which section of the page the reader is in — the one a change of language
 * should carry across. Pure, so it is testable without a page.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Both languages render the same sections under the same ids, so a section
 * named here exists on the other side too. "In" means the last section, in
 * document order, whose top has risen above the reading line: the one being
 * read, not the one merely peeking in at the bottom of the screen.
 */

export interface SectionTop {
  id: string
  /** Its top edge, from the top of the viewport (negative once scrolled past). */
  top: number
}

/** Where the eye reads: this far down the viewport, as a share of its height. */
export const READING_LINE = 0.35

export function sectionInView(
  sections: readonly SectionTop[],
  viewport: number
): string | null {
  let current: string | null = null
  for (const section of sections) {
    if (section.top <= viewport * READING_LINE) current = section.id
  }
  return current
}
