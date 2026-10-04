/**
 * How long an essay takes to read, and how long is left — pure, so the
 * counting is testable without a page.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The rate is the one a reading study settles on for non-fiction read
 * silently by adults — about 238 words a minute (Brysbaert, 2019) — rounded
 * down to 230, because these essays argue rather than narrate and a reader
 * who is weighing a claim reads it more slowly than a story. A minute is the
 * least an essay is ever said to take: "0 min" would read as a mistake.
 */

/** Words a minute, for argued prose read silently. */
export const WORDS_PER_MINUTE = 230

/** The words in one paragraph: runs of non-space characters. */
export function countWords(paragraph: string): number {
  const trimmed = paragraph.trim()
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length
}

/** Whole minutes for a number of words, never less than one. */
export function minutesFor(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/**
 * Minutes left once the first `read` paragraphs are behind the reader, or 0
 * when none are left — the essay is finished, not "1 min" from it.
 */
export function minutesLeft(words: readonly number[], read: number): number {
  const remaining = words.slice(read).reduce((sum, count) => sum + count, 0)
  return remaining === 0 ? 0 : minutesFor(remaining)
}
