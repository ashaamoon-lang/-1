import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { Glob } from 'bun'

/**
 * The motion rules, enforced.
 *
 * `CLAUDE.md` #1–#4 and #8 are this project's hard rules for animation, and
 * until this test **nothing checked any of them**. `bun run check` runs
 * oxlint, oxfmt, tsc, unit tests and manifests; none of those parse CSS.
 * Roadmap §1.5 lists the token rule as "(enforced at review)", which is
 * another way of saying it was enforced by whoever remembered.
 *
 * Nobody remembered. The first run of this file found violations in 14 files:
 * a bare `ease` on the 404 call-to-action, `150ms`/`200ms` literals across
 * ten Base UI wrappers, and three transitions animating layout properties.
 * `docs/AUDIT-2026-08.md` §Tier 3 had spotted two of them by reading the
 * shipped stylesheet; most of the rest ship to no route *yet*, which is
 * exactly why a rule about what we write has to check what we write.
 *
 * ## Sources, not build output
 *
 * Scanning `.next/static/chunks/*.css` was the first shape of this test and it
 * does not work: Sanity Studio's stylesheet is interleaved there, ~170KB of
 * third-party CSS with its own conventions, and policing it is neither
 * possible nor ours to do. Authored files have a clean boundary.
 *
 * ## The exemption
 *
 * A declaration preceded by `/* motion-exempt: <reason> *\/` is allowed
 * through — the same shape as the `// cache-exempt:` comments in
 * `lib/integrations/cache-invariant.test.ts`. An opt-out needs a reason, and
 * the reason is visible at the line it applies to rather than in a config
 * file nobody opens.
 */

const CSS_GLOBS = [
  'components/**/*.css',
  'vault/**/*.css',
  'app/**/*.css',
  'lib/styles/**/*.css',
]

interface Declaration {
  file: string
  line: number
  text: string
  exempt: boolean
}

/**
 * True when the text immediately preceding a declaration is a
 * `motion-exempt:` comment and nothing else.
 */
function isExempt(before: string): boolean {
  const closed = before.lastIndexOf('*/')
  if (closed === -1) return false

  // Anything but whitespace between the comment and the declaration means the
  // comment belongs to something else.
  if (before.slice(closed + 2).trim() !== '') return false

  const opened = before.lastIndexOf('/*', closed)
  if (opened === -1) return false

  return before.slice(opened, closed).includes('motion-exempt:')
}

/** Every `transition`/`animation` declaration we author, with its context. */
async function declarations(): Promise<Declaration[]> {
  const found: Declaration[] = []

  for (const pattern of CSS_GLOBS) {
    for await (const file of new Glob(pattern).scan('.')) {
      const source = await readFile(file, 'utf8')

      for (const match of source.matchAll(
        /(transition(?:-property|-timing-function|-duration)?|animation)\s*:\s*([^;}]*)/g
      )) {
        const index = match.index ?? 0
        const before = source.slice(0, index)

        found.push({
          file,
          line: before.split('\n').length,
          text: match[0].replace(/\s+/g, ' ').trim(),
          // The exemption has to be the comment *immediately* above the
          // declaration, with only whitespace between, so it cannot drift away
          // from what it excuses. Measured by position rather than by a
          // fixed-length lookback: the first version used `slice(-400)` and
          // silently stopped matching the moment a reason ran long enough to
          // be worth writing.
          exempt: isExempt(before),
        })
      }
    }
  }

  return found
}

function report(offenders: Declaration[]): string {
  return offenders
    .map((d) => `${d.file}:${d.line}  ${d.text.slice(0, 90)}`)
    .join('\n')
}

describe('motion rules (CLAUDE.md #1-#4, #8)', () => {
  it('finds CSS to check at all', async () => {
    // A gate that examined nothing must not report success — the failure mode
    // this whole stage exists to remove.
    expect((await declarations()).length).toBeGreaterThan(10)
  })

  it('#2: no bare `ease`, `ease-in`, `ease-out` or `ease-in-out`', async () => {
    const offenders = (await declarations()).filter(
      (d) =>
        !d.exempt &&
        !d.text.includes('var(--tw') &&
        /(?:^|[\s,:])(ease|ease-in|ease-out|ease-in-out)(?:$|[\s,;])/.test(
          d.text
        )
    )

    expect(offenders, report(offenders)).toEqual([])
  })

  it('#4: animates only compositable properties', async () => {
    const layout =
      /\b(width|height|top|left|right|bottom|margin|padding|box-shadow|inset)\b/
    const offenders = (await declarations()).filter(
      (d) => !d.exempt && d.text.startsWith('transition') && layout.test(d.text)
    )

    expect(offenders, report(offenders)).toEqual([])
  })

  it('#8: durations come from tokens, not literals', async () => {
    const offenders = (await declarations()).filter(
      (d) =>
        !d.exempt &&
        !d.text.includes('var(--tw') &&
        /\b\d+(?:\.\d+)?m?s\b/.test(d.text)
    )

    expect(offenders, report(offenders)).toEqual([])
  })
})
