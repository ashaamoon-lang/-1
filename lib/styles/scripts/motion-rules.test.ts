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
/**
 * Every authored stylesheet, whole, for the two rules that need the file
 * rather than one declaration out of it.
 *
 * `declarations()` below yields matched `transition`/`animation` bodies; the
 * reduced-motion rule asks whether a *file* that animates also stands down,
 * and the reveal-knob rule reads custom properties, which are neither.
 */
async function collectDeclarationFiles(): Promise<[string, string][]> {
  const files: [string, string][] = []
  for (const pattern of CSS_GLOBS) {
    for await (const file of new Glob(pattern).scan('.')) {
      files.push([file, await readFile(file, 'utf8')])
    }
  }
  return files
}

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

describe('the reduced-motion contract reaches every stylesheet', () => {
  /*
   * `global.css` states the problem in its own words: the `*` kill switch
   * sits at specificity 0,0,0 and **loses to any component class**, which is
   * why every component was given its own `@media (--reduced-motion)` block.
   *
   * Fourteen never got one, and two of those ship —
   * `app/[locale]/journal/[slug]/page.module.css` and
   * `components/ui/not-found-view/`. Nothing could see it: the rule lived in
   * a doc comment, and a stylesheet that silently ignores a reader's setting
   * looks identical to one that honours it until you set the preference.
   */
  it('every stylesheet that animates also stands down', async () => {
    const files = await collectDeclarationFiles()
    expect(files.length).toBeGreaterThan(20)

    const offenders: string[] = []
    for (const [file, source] of files) {
      const animates = /(^|\s)(transition|animation)(-[a-z-]+)?:/m.test(source)
      if (!animates) continue
      if (/@media\s*\(--reduced-motion\)/.test(source)) continue
      if (/\/\*\s*motion-exempt:/.test(source)) continue
      offenders.push(file)
    }

    expect(
      offenders,
      'add @media (--reduced-motion) — the global * rule loses to a component class'
    ).toEqual([])
  })
})

describe('reveal knobs carry tokens, not literals', () => {
  /*
   * `motion-rules` #8 rejects a millisecond literal inside a `transition` or
   * `animation` declaration, and these are neither: they are custom
   * properties the reveal contract reads. So `--reveal-stagger: 120ms` in the
   * hero, `90ms` on the project hero and `70ms` twice went unseen — and
   * three of those are not token values at all. `global.css` records having
   * caught `--reveal-duration: 700ms` by hand, which is the same blind spot
   * noticed and not closed.
   */
  it('no --reveal-* or --stagger-* property holds a raw duration', async () => {
    const files = await collectDeclarationFiles()

    const offenders: string[] = []
    let properties = 0

    for (const [file, source] of files) {
      /*
       * `lib/styles/css/` is where a value is allowed to be a value.
       *
       * `--stagger-words: 50ms` and its siblings are the definitions the rest
       * of the repo points at; forbidding a literal there would leave nothing
       * for a consumer to reference. The rule is about consumers, and this is
       * the same boundary `motion-rules` #8 already draws by scanning
       * declarations rather than the `:root` block that feeds them.
       */
      if (file.startsWith('lib/styles/css/')) continue

      source.split('\n').forEach((line, index) => {
        const code = line.split('/*')[0] ?? line
        const match = code.match(/--(reveal|stagger)[a-z-]*:\s*([^;]+)/)
        if (!match) return
        properties += 1
        if (/\b\d+(\.\d+)?m?s\b/.test(match[2] ?? '')) {
          offenders.push(`${file}:${index + 1}  ${code.trim()}`)
        }
      })
    }

    expect(properties).toBeGreaterThan(3)
    expect(
      offenders,
      'use var(--stagger-words|cards) or var(--duration-*)'
    ).toEqual([])
  })
})
