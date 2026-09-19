import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  DOC,
  declaresPin,
  importsParallax,
  momentNames,
  readDocBlock,
  renderScoreboard,
  scan,
} from './design-scoreboard'

/**
 * The block in `DIREKSI.md` §3.2b cannot go stale.
 *
 * `HANDOFF.md` §4 counted the motion budget by hand, and a number nobody can
 * regenerate drifts — this repository has watched that happen to
 * `ROADMAP.md`'s status line three times and to `DESIGN-SYSTEM.md` §7 for
 * twenty-six stages. The instrument exists so the drift fails here instead of
 * surviving into a report.
 *
 * Same shape as `rule-coverage.test.ts`, deliberately, including the
 * anti-vacuum assertion: a scanner that matched nothing would otherwise report
 * a tidy `0` and agree with a block that also said `0`.
 */

const ROOT = join(import.meta.dir, '..', '..')

describe('the design scoreboard', () => {
  const board = scan()

  it('finds moments at all, so a broken scanner cannot pass silently', () => {
    // The failure mode of every source-reading rule in this repo: the pattern
    // stops matching and the tool reports a clean sweep.
    expect(
      board.moments.length,
      'scanned zero moment names — the scanner, not the repo, is wrong'
    ).toBeGreaterThan(5)
  })

  it('the committed block matches what the scanner produces now', () => {
    const doc = readFileSync(join(ROOT, DOC), 'utf8')
    const committed = readDocBlock(doc)

    expect(
      committed,
      `${DOC} has lost its design-scoreboard markers`
    ).toBeDefined()
    expect(
      committed,
      `${DOC} §3.2b has drifted from the source. ` +
        'Run `bun lib/scripts/design-scoreboard.ts --write`.'
    ).toBe(renderScoreboard(board).trim())
  })

  it('states what it cannot see, inside the block itself', () => {
    // The whole point, and the reason this assertion exists rather than being
    // trusted to whoever edits the renderer next: an instrument that hides the
    // edge of its own vision is the defect `DESIGN-SYSTEM.md` §7 cost
    // twenty-six stages to find.
    const body = renderScoreboard(board)
    expect(body).toContain('TIDAK bisa lihat')
    expect(body).toContain('epic-sequence')
    expect(body).toContain('kualitas')
  })
})

describe('the scanner itself', () => {
  it('reads a moment name from the attribute the gates read', () => {
    expect(momentNames('<section data-epic="hero-arrival">')).toEqual([
      'hero-arrival',
    ])
  })

  it('reads several names from one file', () => {
    expect(momentNames('data-epic="one" ... data-epic="two"').sort()).toEqual([
      'one',
      'two',
    ])
  })

  /**
   * The false positive this scan was nearly built with.
   *
   * Matching the *word* `useParallax` returned six files on the first attempt.
   * Three were not consumers — two stylesheets, and `vault/motion/flip` which
   * discusses parallax in a comment:
   *
   *     ScrollTrigger measures positions, and every card's cover is
   *     parallaxed (`vault/motion/parallax`).
   *
   * `TAHAP-78.md` §1.3 records the same class of error twice. So the rule is an
   * import, and this is the test that keeps it one.
   */
  it('counts an import, not a mention in prose', () => {
    const consumer = "import { useParallax } from '@/vault/motion/parallax'"
    const prose = '/* every card cover is parallaxed — see useParallax */'

    expect(importsParallax(consumer)).toBe(true)
    expect(importsParallax(prose)).toBe(false)
  })

  it('reads an import that arrives beside another binding', () => {
    expect(
      importsParallax(
        "import { PARALLAX_PRESET, useParallax } from '@/vault/motion/parallax'"
      )
    ).toBe(true)
  })

  it('counts a pinned ScrollTrigger, and not the word pin', () => {
    expect(declaresPin('scrollTrigger: { pin: true }')).toBe(true)
    expect(declaresPin('// the pin holds while four statements pass')).toBe(
      false
    )
    expect(declaresPin('pin: false')).toBe(false)
  })
})
