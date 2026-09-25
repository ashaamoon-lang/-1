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
 * ## Corrected on its first real firing — the instrument was wrong
 *
 * The first version compared both documents against the highest **spec file**
 * in `docs/stages/`. It went red the moment `TAHAP-79.md` arrived, and it was
 * wrong to: `ROADMAP.md` §3.0 *requires* the spec before a line of code, so a
 * spec always runs ahead of execution. Equating "has a spec" with "dieksekusi
 * sampai" made a mandated workflow look like drift.
 *
 * What actually has to agree is narrower: the status line matches the highest
 * `## Tahap N` **entry** in ROADMAP itself (an entry is written when a stage
 * ships), `HANDOFF.md` matches that, and the specs never fall **behind** —
 * which would mean a stage shipped without one, the §3.0 violation worth
 * catching. Specs running ahead is correct and is no longer reported.
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

/** The highest stage ROADMAP has written an entry for — i.e. shipped. */
export function highestRoadmapEntry(markdown: string): number {
  const numbers = [...markdown.matchAll(/^## Tahap (\d+)/gm)].map((match) =>
    Number(match[1])
  )
  return numbers.length === 0 ? 0 : Math.max(...numbers)
}

/**
 * The body of a numbered `## N. ...` section, up to the next one.
 *
 * Returns `''` when the section is gone, which the caller must treat as a
 * failure rather than as an empty pass — a renamed heading would otherwise
 * silence every check below it.
 */
export function numberedSection(markdown: string, number: number): string {
  const heading = new RegExp(`^## ${number}\\..*$`, 'm').exec(markdown)
  if (heading === null) return ''
  const rest = markdown.slice(heading.index + heading[0].length)
  const next = /^## \d+\./m.exec(rest)
  return next === null ? rest : rest.slice(0, next.index)
}

/**
 * Gate tallies pinned into prose — a bare number claiming a test result.
 *
 * `565 lulus`, `**579 lulus**`, `2 flaky`. What makes these different from
 * the tallies `HANDOFF.md` §5 keeps is that those name the run or the date
 * they came from, so they stay true; these name nothing and are wrong from
 * the next commit onward.
 *
 * The lookbehind is not decoration. Without it this read "§2 gagal kalau…" —
 * a sentence describing this very rule — as a tally of two failures, and the
 * first thing the rule did was fail its own document. A section reference is
 * a number followed by a verb, and so is a tally; only what precedes it tells
 * them apart.
 */
export function pinnedTallies(section: string): string[] {
  return [
    ...section.matchAll(
      /(?<![§\w])\*{0,2}\d[\d.,]*\*{0,2} (lulus|gagal|dilewati|flaky)/g
    ),
  ].map((match) => match[0])
}

describe('the stage number agrees with itself', () => {
  const filenames = readdirSync(STAGES_DIR)
  const highest = highestStageSpec(filenames)
  const roadmap = readFileSync(join(ROOT, 'docs', 'ROADMAP.md'), 'utf8')
  const shipped = highestRoadmapEntry(roadmap)

  it('finds stage specs at all, so a broken parser cannot pass silently', () => {
    // Anti-vacuum. A regex that stops matching would otherwise report
    // agreement between three values it never read.
    expect(
      filenames.filter((name) => name.startsWith('TAHAP-')).length,
      'no stage specs found in docs/stages/ — the parser, not the repo, is wrong'
    ).toBeGreaterThan(70)
    expect(highest).toBeGreaterThan(70)
  })

  it('ROADMAP.md status line matches its own highest stage entry', () => {
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
      `ROADMAP.md says Tahap ${claimed}, but its own entries go up to ${shipped}. ` +
        'Update the status line in the stage that adds the entry, not later.'
    ).toBe(shipped)
  })

  it('no stage shipped without a spec', () => {
    // Specs may run AHEAD — §3.0 requires spec before code. Falling behind is
    // the violation: an entry with no spec means a stage was written straight
    // from the roadmap.
    expect(
      highest,
      `ROADMAP has an entry for Tahap ${shipped} but docs/stages/ only goes ` +
        `to ${highest} — a stage shipped without the spec §3.0 requires.`
    ).toBeGreaterThanOrEqual(shipped)
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
      `HANDOFF.md says Tahap ${claimed}, but ROADMAP ships up to ${shipped}.`
    ).toBe(shipped)
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

  it('reads the highest shipped entry, not the first', () => {
    expect(
      highestRoadmapEntry('## Tahap 3 — a\n## Tahap 78 — b\n## Tahap 12 — c')
    ).toBe(78)
  })

  it('ignores a stage number that is not a heading', () => {
    // Prose mentions stage numbers constantly — "diperbaiki di Tahap 65" must
    // not read as an entry, or the status line chases whatever was cited last.
    expect(
      highestRoadmapEntry('diperbaiki di Tahap 99, lihat ## Tahap 4')
    ).toBe(0)
  })

  it('returns 0 for a document with no entries at all', () => {
    expect(highestRoadmapEntry('# ROADMAP\n\nno entries yet')).toBe(0)
  })
})

describe('HANDOFF.md states no gate tally it cannot keep true', () => {
  /*
   * Tahap 97.
   *
   * `HANDOFF.md` §1 already carries the rule that would have prevented this:
   * *"Fakta yang tidak bisa benar saat ditulis tidak ditulis; yang ditulis
   * adalah perintah yang menjawabnya."* It was applied to commit hashes and
   * CI run numbers, and not to gate tallies — which have exactly the same
   * shape. Four of them drifted: `check` said 565 and then 579 against an
   * actual 597, and `test:e2e` said 713 / 2 flaky / 15 skipped against a CI
   * run reporting 722 / 0 / 14.
   *
   * Scoped to §1 and §2, the two sections someone reads to know what to
   * expect. §5 keeps its numbers on purpose: every one of them names the run
   * or the date it came from, which is what makes it still true.
   */
  const handoff = readFileSync(join(ROOT, 'docs', 'HANDOFF.md'), 'utf8')

  for (const [number, title] of [
    [1, 'Posisi'],
    [2, 'Menyalakannya kembali'],
  ] as const) {
    it(`§${number} (${title}) pins no tally`, () => {
      const section = numberedSection(handoff, number)

      // Anti-vacuum: a renamed heading must fail loudly, not pass emptily.
      expect(
        section.length,
        `HANDOFF.md has no §${number} section any more — this check read nothing`
      ).toBeGreaterThan(0)

      expect(
        pinnedTallies(section),
        `HANDOFF.md §${number} pins a gate tally. It is true the day it is ` +
          'written and wrong from the next commit: write the command that ' +
          'answers it, as the commit-hash block in §1 already does. A tally ' +
          'that names its run or date belongs in §5.'
      ).toEqual([])
    })
  }

  it('finds tallies when they are there, so the pattern cannot rot silently', () => {
    expect(pinnedTallies('`bun run check` **565 lulus**, 55 berkas')).toEqual([
      '**565 lulus',
    ])
    expect(pinnedTallies('713 lulus / 0 gagal, 2 flaky, 15 dilewati')).toEqual([
      '713 lulus',
      '0 gagal',
      '2 flaky',
      '15 dilewati',
    ])
    expect(pinnedTallies('jalankan `bun run check` dan bandingkan')).toEqual([])
  })

  it('does not read a section reference as a tally', () => {
    // Measured, not hypothetical: this exact sentence was the rule's first
    // false positive, in the paragraph that introduces the rule.
    expect(pinnedTallies('§1 dan §2 gagal kalau sebuah tally dipaku')).toEqual(
      []
    )
    expect(pinnedTallies('lihat §5 dilewati')).toEqual([])
  })

  it('reads a section without swallowing the next one', () => {
    const markdown = `## 1. A

first

## 2. B

second
`
    expect(numberedSection(markdown, 1)).toContain('first')
    expect(numberedSection(markdown, 1)).not.toContain('second')
    expect(numberedSection(markdown, 9)).toBe('')
  })
})
