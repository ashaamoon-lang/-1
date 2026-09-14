import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'

import {
  DOC,
  STORY_EXEMPT,
  readDocBlock,
  realExemptions,
  renderDesignDebt,
  scanDesignDebt,
} from './design-debt'

/**
 * `DESIGN-SYSTEM.md` §7 exists so the design document cannot describe a system
 * nobody built. For twenty-six stages it did exactly that, because no test,
 * gate or script ever read it again after the audit that wrote it.
 *
 * These tests are the instrument that was missing — plus the counting rules,
 * which had never been written down at all.
 */

const debt = scanDesignDebt()
const source = readFileSync(
  new URL(`../../${DOC}`, import.meta.url).pathname,
  'utf-8'
)

describe('the design-debt block in DESIGN-SYSTEM.md', () => {
  it('is still delimited by its markers', () => {
    expect(
      readDocBlock(source),
      `${DOC} has lost its design-debt markers, so nothing can check §7 any more`
    ).toBeDefined()
  })

  it('matches what the repository actually contains', () => {
    // The whole point. A number that drifts fails here instead of surviving
    // twenty-six stages.
    expect(
      readDocBlock(source),
      `§7 is stale. Run \`bun lib/scripts/design-debt.ts --write\``
    ).toBe(renderDesignDebt(debt))
  })
})

describe('the story rule', () => {
  it('names a reason for every exemption', () => {
    // An exemption without a reason is a number going up quietly.
    const silent = STORY_EXEMPT.filter(
      (entry) => entry.because.trim().length < 12
    )
    expect(silent.map((entry) => entry.dir)).toEqual([])
  })

  it('lists each directory once', () => {
    expect(new Set(STORY_EXEMPT.map((entry) => entry.dir)).size).toBe(
      STORY_EXEMPT.length
    )
  })

  it('holds no exemption that has stopped being true', () => {
    /*
     * The exemption list is the next thing that would rot: a directory gains a
     * story, or moves, and its entry sits there forever excusing nothing. This
     * is the same failure as §7 itself, one level down.
     */
    expect(
      debt.staleExemptions,
      'these directories are exempt but no longer need to be — they have a story, or no longer exist'
    ).toEqual([])
  })

  it('finds every component directory it claims to cover', () => {
    // Anti-vacuum: a glob that silently matched nothing would make every count
    // above zero and every assertion pass.
    expect(debt.componentDirs.length).toBeGreaterThan(40)
    expect(debt.componentDirs).toContain('vault/blocks/hero')
    expect(debt.componentDirs).toContain('components/layout/header')
  })
})

describe('the counting rules, which did not exist before', () => {
  it('separates a marker from prose that merely mentions one', () => {
    /*
     * `vault/motion/horizontal` discusses the escape hatch mid-sentence, in
     * backticks — "Taking the documented `scale-exempt:` escape hatch would
     * have worked". A naive grep counts that file as carrying an exemption it
     * does not have, which is one of the three ways "six" could not be checked.
     */
    const files = new Set(debt.exemptSites.map((site) => site.file))
    expect(
      [...files].filter((file) => file.includes('motion/horizontal'))
    ).toEqual([])
  })

  it('counts a cross-reference as a site but not as an exemption', () => {
    /*
     * Two markers read "see the note on the mobile size above": they are the
     * mobile half of a pair, not a second decision. Counting them as
     * exemptions is the second way "six" was unverifiable.
     */
    expect(debt.exemptSites.length).toBeGreaterThan(realExemptions(debt).length)
    for (const site of debt.exemptSites.filter((s) => s.crossReference)) {
      const partner = realExemptions(debt).some((own) => own.file === site.file)
      expect(
        partner,
        `${site.file}:${site.line} refers to a note that is not in its own file`
      ).toBe(true)
    }
  })

  it('never counts a whole-file marker as a per-line one', () => {
    for (const site of debt.exemptSites) {
      expect(debt.exemptFiles).not.toContain(site.file)
    }
  })
})
