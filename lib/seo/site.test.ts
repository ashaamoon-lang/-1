import { describe, expect, it } from 'bun:test'

import { formatList } from './site'

/**
 * `formatList` joins in the language of the page — Tahap 84.
 *
 * ## Why this moved here from `e2e/promises.e2e.ts`
 *
 * The rule used to be held end to end: "the Indonesian machine view uses an
 * Indonesian conjunction" loaded `/id/ai`, read its site-facts list, and
 * failed on `, and ` inside Indonesian copy. It caught a real defect — its
 * own note records the first shape staying red after the fix landed — and
 * the fix lives here, in `CONJUNCTION`.
 *
 * Tahap 84 removed `/ai`, and with it the only page that ever called this
 * with `'id'`. `/llms.txt` calls it with no locale, so English. The e2e test
 * had nothing left to load, but the function it protected is still exported,
 * still locale-aware, and will be what the next Indonesian list reaches for.
 * A guard on a fix does not end because the page that exercised it did.
 */
describe('formatList', () => {
  it('joins the last item with "and" by default', () => {
    expect(formatList(['a', 'b', 'c'])).toBe('a, b, and c')
  })

  it('joins the last item with "dan" in Indonesian', () => {
    const joined = formatList(['a', 'b', 'c'], 'id')
    expect(joined).toBe('a, b, dan c')
    // The defect this exists for, stated as its own assertion.
    expect(joined).not.toMatch(/,\s+and\s+\S/)
  })

  it('returns one item unjoined, and nothing for none', () => {
    expect(formatList(['a'], 'id')).toBe('a')
    expect(formatList([])).toBe('')
  })
})
