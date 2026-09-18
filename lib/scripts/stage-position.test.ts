import { describe, expect, it } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The stage number lives in three places, and it has drifted three times.
 *
 * `docs/ROADMAP.md`'s own header is the witness: it read "belum dieksekusi"
 * until Tahap 45, then froze at 45 until Tahap 61 — *"enam belas tahap terlalu
 * lama"* — then Tahap 64 wrote no entry at all and left it at 63. Its
 * conclusion is the reason this file exists:
 *
 *   > **Dokumen yang berbohong tentang kodenya sendiri lebih buruk daripada
 *   > tidak ada dokumen.**
 *
 * Three copies of one fact, kept in step by memory, is a promise nobody can
 * keep across dozens of stages. So it is kept by a test instead.
 *
 * ## What this deliberately does NOT check
 *
 * Commit hash and CI run number. Those were in `HANDOFF.md` and were wrong on
 * arrival — structurally, because a document that writes the hash of the commit
 * containing it is written before that commit exists. They are not pinned here;
 * they were **removed from the prose**, and replaced with the commands that
 * answer them. A fact that cannot be true when written does not get a gate, it
 * gets deleted.
 *
 * `join(import.meta.dir, …)`, never a file URL's `pathname` — that hazard cost
 * this repo nine silently unregistered tests; see `design-debt.ts`.
 */

const ROOT = join(import.meta.dir, '..', '..')
const STAGES_DIR = join(ROOT, 'docs', 'stages')

/** The highest stage that has a spec, ignoring letter suffixes (`12a`). */
export function highestStageSpec(filenames: readonly string[]): number {
  const numbers = filenames
    .map((name) => /^TAHAP-(\d+)[a-z]?\.md$/.exec(name)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)

  return numbers.length === 0 ? 0 : Math.max(...numbers)
}

/** The stage a document claims, from its own `**Tahap N**` / `**N**` marker. */
export function claimedStage(markdown: string, pattern: RegExp): number | null {
  const found = pattern.exec(markdown)?.[1]
  return found === undefined ? null : Number(found)
}

describe('the stage number agrees with itself', () => {
  const filenames = readdirSync(STAGES_DIR)
  const highest = highestStageSpec(filenames)

  it('finds stage specs at all, so a broken parser cannot pass silently', () => {
    // Anti-vacuum. A regex that stops matching would otherwise report
    // agreement between three values it never read.
    expect(
      filenames.filter((name) => name.startsWith('TAHAP-')).length,
      'no stage specs found in docs/stages/ — the parser, not the repo, is wrong'
    ).toBeGreaterThan(70)
    expect(highest).toBeGreaterThan(70)
  })

  it('ROADMAP.md names the highest stage that has a spec', () => {
    const roadmap = readFileSync(join(ROOT, 'docs', 'ROADMAP.md'), 'utf8')
    const claimed = claimedStage(
      roadmap,
      /dieksekusi sampai \*\*Tahap (\d+)\*\*/
    )

    expect(
      claimed,
      'ROADMAP.md lost its "dieksekusi sampai **Tahap N**" marker'
    ).not.toBeNull()
    expect(
      claimed,
      `ROADMAP.md says Tahap ${claimed}, but docs/stages/ goes up to ${highest}. ` +
        'Update the status line in the stage that adds the entry, not later.'
    ).toBe(highest)
  })

  it('HANDOFF.md names the same stage as ROADMAP.md', () => {
    const handoff = readFileSync(join(ROOT, 'docs', 'HANDOFF.md'), 'utf8')
    const claimed = claimedStage(
      handoff,
      /Tahap terakhir yang dikerjakan: \*\*(\d+)\*\*/
    )

    expect(
      claimed,
      'HANDOFF.md lost its "Tahap terakhir yang dikerjakan" marker'
    ).not.toBeNull()
    expect(
      claimed,
      `HANDOFF.md says Tahap ${claimed}, but docs/stages/ goes up to ${highest}.`
    ).toBe(highest)
  })
})

describe('the parser itself', () => {
  it('reads a plain stage number', () => {
    expect(highestStageSpec(['TAHAP-7.md', 'TAHAP-78.md'])).toBe(78)
  })

  it('reads a lettered sub-stage as its base number', () => {
    expect(highestStageSpec(['TAHAP-12a.md', 'TAHAP-11c.md'])).toBe(12)
  })

  it('ignores files that are not stage specs', () => {
    expect(highestStageSpec(['README.md', 'notes.txt'])).toBe(0)
  })

  it('returns null when a document has lost its marker', () => {
    expect(claimedStage('no marker here', /Tahap (\d+)/)).toBeNull()
  })
})
