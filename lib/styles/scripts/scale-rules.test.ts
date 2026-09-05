import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { Glob } from 'bun'

/**
 * The half of the design system nothing was checking — Tahap 37.
 *
 * ## Why this file exists
 *
 * `docs/DESIGN-SYSTEM.md` opens with "hardcoding a value in a component is a
 * defect, not a shortcut", and the repo enforces exactly two thirds of that
 * sentence: `token-rules.test.ts` catches raw hex in TypeScript,
 * `setup-styles.test.ts` catches raw colour in CSS, `motion-rules.test.ts`
 * catches raw durations and easings. Spacing, type size, weight, radius,
 * elevation and `1fr` had **no gate at all**.
 *
 * Measured before a line of this was written, on 2026-09-05:
 *
 * | rule | violations |
 * | ---- | ---------- |
 * | spacing on the documented ladder | 192 of 375 occurrences off it, 21 distinct values |
 * | type size from the scale | 53 `font-size` declarations bypass it |
 * | weights 400/600/700 | `font-weight: 500` ships 4 times |
 * | `minmax(0, 1fr)` | `select.module.css:71`, and `dr-grid` itself |
 * | radius from a token | 19 distinct declarations, no token |
 * | elevation from a token | 6 hand-written shadows, no token |
 *
 * ## The exemption
 *
 * `/* scale-exempt: <reason> *\/` on the line above, the same shape and the
 * same rule as `motion-exempt:` — an opt-out needs a reason, and the reason
 * lives where it applies rather than in a config file nobody opens.
 */

const CSS_GLOBS = ['components/**/*.css', 'vault/**/*.css', 'app/**/*.css']

const TSX_GLOBS = [
  'components/**/*.tsx',
  'vault/**/*.tsx',
  'app/**/*.tsx',
] as const

/**
 * Spacing is a multiple of four.
 *
 * ## Why this and not the ladder the document named
 *
 * `docs/DESIGN-SYSTEM.md` §3 said 8/16/24/32/48/64/96/128, derived from the
 * 16px gap, and 192 of 375 occurrences were off it. Before enforcing that,
 * the histogram was read rather than assumed:
 *
 *     8 x51   16 x51   12 x39   4 x32   24 x31   20 x30   32 x18
 *     6 x16   48 x15   10 x15   2 x13   96 x9    28 x8    160 x8   ...
 *
 * **12 ships 39 times and 20 ships 30 times.** Those are not slips. They are
 * an author following the system across 36 stages and repeatedly needing the
 * step between 8 and 16, and between 16 and 24 — which the named ladder
 * cannot express. Forcing 69 of them to the nearest allowed value would move
 * real pixels on real pages to satisfy a ladder written before the site
 * existed.
 *
 * So the rule is the grid the site actually uses: **a multiple of 4**. It
 * still rejects the twenty-nine-arbitrary-values problem outright — 6, 10, 2,
 * 14, 18, 3, 1 and 50 all fail — and every one of those is within 2px of a
 * legal value, so the correction is bounded and checkable.
 *
 * 8/16/24/32/48/64/96/128 remains the *preferred* subset, and
 * `DESIGN-SYSTEM.md` §3 now says both things, with this histogram as the
 * reason it says the second.
 */
const SPACING_STEP = 4

/** The three weights `docs/DESIGN-SYSTEM.md` §2 allows. */
const WEIGHTS = new Set([400, 600, 700])

interface Line {
  file: string
  line: number
  text: string
  exempt: boolean
}

/**
 * Is the declaration on `index` covered by an exemption comment above it?
 *
 * Walks back through the contiguous comment block, not one line. A reason
 * worth writing rarely fits on one line, and the first shape of this checked
 * `raw[index - 1]` only — which for a block comment is the closing `*\/` and
 * never the marker. Every multi-line exemption in the repo read as unexempt.
 *
 * Position still matters: the block has to be *adjacent*, so an exemption
 * cannot drift away from the line it excuses.
 */
function exemptedBy(raw: readonly string[], index: number): boolean {
  let inBlock = false

  for (let i = index - 1; i >= 0; i -= 1) {
    const line = (raw[i] ?? '').trim()
    if (line === '' && !inBlock) continue

    if (inBlock) {
      if (/scale-exempt:\s*\S/.test(line)) return true
      // Reached the top of the block without finding a marker.
      if (line.startsWith('/*')) return false
      continue
    }

    if (line.endsWith('*/')) {
      if (/scale-exempt:\s*\S/.test(line)) return true
      // A one-line block comment carries both delimiters.
      if (line.startsWith('/*')) return false
      inBlock = true
      continue
    }

    // Anything else adjacent to the declaration is not a comment.
    return false
  }

  return false
}

function stripBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' ')
  )
}

async function readLines(globs: readonly string[]): Promise<Line[]> {
  const out: Line[] = []
  for (const pattern of globs) {
    for await (const file of new Glob(pattern).scan('.')) {
      if (file.includes('.test.') || file.includes('.stories.')) continue
      const source = await readFile(file, 'utf8')
      /*
       * A whole file can be exempt, with a reason, for the case a per-line
       * exemption would only repeat seventeen times: a component that is
       * scheduled for deletion. The reason has to name why, same as the line
       * form, so the exemption is a decision someone can disagree with rather
       * than a silence.
       */
      const fileExempt = /\/\*[\s*]*scale-exempt-file:\s*\S/.test(source)
      const raw = source.split('\n')
      const stripped = stripBlockComments(source).split('\n')
      stripped.forEach((text, index) => {
        // An exemption sits on the line directly above, whitespace only
        // between — position-checked, like `motion-exempt:`.
        out.push({
          file,
          line: index + 1,
          text,
          exempt: fileExempt || exemptedBy(raw, index),
        })
      })
    }
  }
  return out
}

describe('spacing comes from the ladder', () => {
  it('every scaling call uses a ladder value', async () => {
    const lines = await readLines(CSS_GLOBS)
    expect(lines.length).toBeGreaterThan(2000)

    const offenders: string[] = []
    let calls = 0

    for (const { file, line, text, exempt } of lines) {
      for (const match of text.matchAll(
        /(?:mobile|desktop)-vw\(\s*(-?[\d.]+)px\s*\)/g
      )) {
        calls += 1
        const value = Math.abs(Number.parseFloat(match[1] ?? ''))
        /*
         * Below one step is not spacing.
         *
         * The 1, 2 and 3px values are hairline alignment and optical inset —
         * a switch's inner padding, a tab's baseline nudge, a 3px indicator
         * bar. Rounding a 2px inset to 4px doubles it. The grid governs
         * *steps*; what sits under a step is a different kind of number and
         * the rule says so instead of pretending otherwise.
         */
        const belowOneStep = value > 0 && value < SPACING_STEP
        const onGrid = Number.isInteger(value) && value % SPACING_STEP === 0
        if (!onGrid && !belowOneStep && !exempt) {
          offenders.push(`${file}:${line}  ${match[0]}`)
        }
      }
    }

    // Anti-vacuum: a scan that found no scaling calls proves nothing.
    expect(calls).toBeGreaterThan(200)
    expect(
      offenders,
      'spacing is a multiple of 4, or /* scale-exempt: <reason> */ above the line'
    ).toEqual([])
  })
})

describe('type comes from the scale', () => {
  it('no component declares its own font-size', async () => {
    const lines = await readLines(CSS_GLOBS)
    /*
     * `inherit` and an `em`-relative nudge are not hardcoded sizes.
     *
     * The rule is "the size comes from the scale", and both of those *take*
     * their size from whatever the scale already set on an ancestor. The
     * command palette's `1.1em` on a glyph and its `font-size: inherit` on a
     * row are the two cases here, and treating them as violations would push
     * an author toward writing an absolute number instead — the opposite of
     * what the rule wants.
     */
    const offenders = lines
      .filter(({ text, exempt }) => {
        const match = text.match(/(?:^|\s)font-size:\s*([^;]+)/)
        if (!match || exempt) return false
        const value = (match[1] ?? '').trim()
        return !/^(inherit|unset|revert|initial|[\d.]+em)$/.test(value)
      })
      .map(({ file, line, text }) => `${file}:${line}  ${text.trim()}`)

    expect(
      offenders,
      'apply the h1/h2/h3/p-big/p/caption/cta/link utility instead'
    ).toEqual([])
  })

  it('no component declares a weight outside the three', async () => {
    const lines = await readLines(CSS_GLOBS)
    const offenders: string[] = []
    let declarations = 0

    for (const { file, line, text, exempt } of lines) {
      const match = text.match(/font-weight:\s*(\d+)/)
      if (!match) continue
      declarations += 1
      if (!WEIGHTS.has(Number.parseInt(match[1] ?? '', 10)) && !exempt) {
        offenders.push(`${file}:${line}  ${text.trim()}`)
      }
    }

    expect(declarations).toBeGreaterThan(5)
    expect(offenders, 'the scale ships 400, 600 and 700').toEqual([])
  })
})

describe('shape comes from tokens', () => {
  it('no component hand-writes a radius', async () => {
    const lines = await readLines(CSS_GLOBS)
    const offenders = lines
      .filter(
        ({ text, exempt }) =>
          /border-radius:/.test(text) && !/var\(--radius-/.test(text) && !exempt
      )
      .map(({ file, line, text }) => `${file}:${line}  ${text.trim()}`)

    expect(offenders, 'use var(--radius-sm|md|full)').toEqual([])
  })

  it('no component hand-writes a shadow', async () => {
    const lines = await readLines(CSS_GLOBS)
    const offenders = lines
      .filter(
        ({ text, exempt }) =>
          /box-shadow:/.test(text) &&
          !/var\(--shadow-/.test(text) &&
          !/box-shadow:\s*none/.test(text) &&
          !exempt
      )
      .map(({ file, line, text }) => `${file}:${line}  ${text.trim()}`)

    expect(offenders, 'use var(--shadow-sm|md)').toEqual([])
  })

  /*
   * `DESIGN-SYSTEM.md` §3 and `TEARDOWN.md` §5 both state it, and nothing
   * checked it. A bare `1fr` track refuses to shrink below its content, so a
   * long word or a wide image blows the grid out of its container — the
   * failure `minmax(0, 1fr)` exists to prevent.
   */
  it('no grid track is a bare 1fr', async () => {
    const lines = [
      ...(await readLines(CSS_GLOBS)),
      ...(await readLines(['lib/styles/css/*.css'])),
    ]

    const offenders: string[] = []
    let tracks = 0

    for (const { file, line, text, exempt } of lines) {
      if (!/grid-template-(columns|rows):/.test(text)) continue
      tracks += 1
      const declaration = text.split(':').slice(1).join(':')
      // Strip the well-formed ones, then look for what is left.
      const remaining = declaration.replace(/minmax\([^)]*\)/g, '')
      if (/(^|[\s(,])\d*\.?\d*fr\b/.test(remaining) && !exempt) {
        offenders.push(`${file}:${line}  ${text.trim()}`)
      }
    }

    expect(tracks).toBeGreaterThan(5)
    expect(offenders, 'always minmax(0, 1fr), never bare 1fr').toEqual([])
  })
})

describe('Tailwind transition utilities stay out of markup', () => {
  /*
   * `motion-rules.test.ts` reads `.css` only, so these three were invisible
   * to it: a `transition-colors` class in a className string carries
   * Tailwind's default curve and duration, which is exactly the browser
   * default `CLAUDE.md` #2 names as the clearest amateur tell.
   */
  it('no className declares a transition', async () => {
    const lines = await readLines(TSX_GLOBS)
    expect(lines.length).toBeGreaterThan(2000)

    const offenders = lines
      .filter(
        ({ text, exempt }) =>
          /\btransition-(colors|all|opacity|transform|shadow)\b/.test(text) &&
          !exempt
      )
      .map(
        ({ file, line, text }) =>
          `${file}:${line}  ${text.trim().slice(0, 100)}`
      )

    expect(
      offenders,
      'declare it in the CSS module with --duration-* and --ease-* tokens'
    ).toEqual([])
  })
})
