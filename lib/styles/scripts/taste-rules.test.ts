import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { Glob } from 'bun'

/**
 * Two `taste-skill` rules that live in the source, not in the DOM — Tahap 34.
 *
 * `e2e/taste-preflight.e2e.ts` holds the boxes that need a rendered page.
 * These two need the opposite: they are about code that must never be
 * written, including in files that ship to no route yet. That is the same
 * boundary `motion-rules.test.ts` already draws, and the same reason —
 * a rule about what we write has to check what we write.
 *
 * ## Both went red on the first run
 *
 * I expected this file to be a ratchet over code that was already correct.
 * It was not:
 *
 * | rule | found |
 * | ---- | ----- |
 * | no bare `vh` | `lib/styles/css/global.css:177` — `min-height: 100vh` on `body`, site-wide, since the fork |
 * | no scroll listener | `lib/webgl/hooks/use-webgl-rect.ts:143` — `window.addEventListener('scroll', handleUpdate, false)` |
 *
 * Both survived 33 stages of gates because neither is visible from a rendered
 * page: the `vh` defect only shows on a phone whose chrome is sliding, and
 * the listener only attaches when a route mounts WebGL without Lenis, which
 * no shipped route does. That is the argument for scanning sources, made by
 * the sources.
 *
 * The instrument was wrong twice too, and both times in the direction that
 * invents defects rather than hiding them: splitting a line at `/*` reads the
 * continuation lines of a block comment as code, so it reported a sentence
 * explaining why `100vh` was rejected as a `100vh` violation, and then
 * reported the doc comment describing the listener's removal as the listener.
 * `stripBlockComments` is the fix, and it is why the failure messages below
 * still print real line numbers.
 */

const CSS_GLOBS = [
  'components/**/*.css',
  'vault/**/*.css',
  'app/**/*.css',
  'lib/styles/**/*.css',
]

const TS_GLOBS = [
  'components/**/*.ts',
  'components/**/*.tsx',
  'vault/**/*.ts',
  'vault/**/*.tsx',
  'app/**/*.ts',
  'app/**/*.tsx',
  'lib/**/*.ts',
  'lib/**/*.tsx',
]

/**
 * Blank out comments, keeping newlines so line numbers survive.
 *
 * Both `/* … *\/` and `<!-- … -->`: `lib/scripts/seed-fixtures.ts` composes
 * SVG in template literals and annotates it with XML comments, which are as
 * much comment as the TypeScript ones around them. Missing that had the
 * em-dash rule reporting a note about why a gradient was retuned.
 */
function stripBlockComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (match) => match.replace(/[^\n]/g, ' '))
}

/**
 * A locale message file: nested namespaces bottoming out in strings.
 *
 * next-intl generates `messages/en.d.json.ts` for the *app*, which types the
 * keys the app reads. This test reads the file as data rather than as an
 * import, so it needs its own shape, and it validates it at the read boundary
 * rather than walking `unknown` — a message file that had grown a number or a
 * null would otherwise be skipped in silence, and silence is how a rule that
 * checks nothing reports success.
 */
type MessageNode = string | { [key: string]: MessageNode }

function parseMessageTree(raw: string, origin: string): MessageNode {
  /*
   * `unknown` is correct here and nowhere else in this file: this function
   * *is* the parser the `no-unknown-parameters` rule asks callers to run at
   * the boundary. Everything downstream takes `MessageNode`.
   */
  // oxlint-disable-next-line anti-slop/no-unknown-parameters
  const parse = (value: unknown, path: string): MessageNode => {
    if (typeof value === 'string') return value
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const node: { [key: string]: MessageNode } = {}
      for (const [key, child] of Object.entries(value)) {
        node[key] = parse(child, path ? `${path}.${key}` : key)
      }
      return node
    }
    throw new Error(
      `${origin}: ${path || '<root>'} is neither string nor object`
    )
  }

  return parse(JSON.parse(raw), '')
}

async function collect(globs: string[]): Promise<[string, string][]> {
  const files: [string, string][] = []
  for (const pattern of globs) {
    for await (const file of new Glob(pattern).scan('.')) {
      if (file.includes('.test.') || file.includes('.stories.')) continue
      files.push([file, await readFile(file, 'utf8')])
    }
  }
  return files
}

describe('viewport units are stable ones', () => {
  /*
   * `taste-skill` SKILL.md section 14: "Viewport stability: `min-h-[100dvh]`,
   * never `h-screen`". The rule behind the Tailwind spelling is that `vh` is
   * the unit that jumps when a mobile browser's chrome slides away, which is
   * exactly when a reader is scrolling.
   *
   * This project already reached a stricter answer than the skill's — it uses
   * `svh` for full-height boxes, with the reason written at
   * `vault/blocks/hero/hero.module.css:19` — so the assertion is against bare
   * `vh`, not in favour of `dvh`. `route-loading.module.css` uses `100dvh`;
   * both are fine. What must never appear is `100vh`.
   */
  it('no authored stylesheet uses a bare vh length', async () => {
    const files = await collect(CSS_GLOBS)
    expect(files.length).toBeGreaterThan(20)

    const hits: string[] = []
    let declarations = 0

    for (const [file, source] of files) {
      /*
       * Block comments are blanked before the scan, not split at the opening
       * token. The first shape of this used `line.split('/*')[0]`, which
       * reads the *continuation* lines of a block comment as code — and it
       * duly reported `hero.module.css:15`, a line of prose explaining why
       * `100vh` was rejected, as a `100vh` violation. Newlines are preserved
       * so the line numbers a failure prints still land on the real line.
       */
      const code = stripBlockComments(source)
      code.split('\n').forEach((line, index) => {
        if (!/\d/.test(line)) return
        declarations += 1
        if (/\b\d+(\.\d+)?vh\b/.test(line)) {
          hits.push(`${file}:${index + 1}  ${line.trim()}`)
        }
      })
    }

    // Anti-vacuum: a scan that read nothing must not report success.
    expect(declarations).toBeGreaterThan(200)
    expect(
      hits,
      'use svh or dvh; vh jumps when browser chrome slides away'
    ).toEqual([])
  })
})

describe('scroll is read through a scheduler, never a listener', () => {
  /*
   * `taste-skill` SKILL.md section 5.D bans `window.addEventListener('scroll')`
   * outright: it fires on every scroll frame with no batching. It also bans
   * custom scroll-progress maths held in React state, for the same reason.
   *
   * This repo was compliant everywhere a reader could see and non-compliant
   * in the one place nobody looked — see the table above. The sanctioned path
   * is stricter than the skill asks for: `CLAUDE.md` #6 permits exactly one
   * RAF loop, so scroll is read inside the Tempus callback Lenis already runs
   * (`components/layout/lenis`, order 5) and published once as
   * `--scroll-velocity`. ScrollTrigger and IntersectionObserver do the rest,
   * and `use-webgl-rect` now falls back to Tempus rather than to a listener.
   *
   * `vault/webgl/material-image/scene.tsx` reads `window.scrollY` every frame
   * on purpose — `docs/MOTION-SPEC.md` section 11 requires a DOM-anchored mesh
   * to recompute from the real scroll position rather than Lenis' eased one —
   * but it does so inside R3F's existing frame loop and writes a shader
   * uniform, never React state. That is the distinction the skill draws, so
   * it is allowed here and named rather than exempted silently.
   */
  it('nothing listens to the scroll event', async () => {
    const files = await collect(TS_GLOBS)
    expect(files.length).toBeGreaterThan(80)

    const hits: string[] = []
    for (const [file, source] of files) {
      /*
       * Block comments are blanked here too. The first run of this rule
       * flagged the doc comment that explains why the listener was removed —
       * an instrument reporting its own fix as the defect.
       */
      stripBlockComments(source)
        .split('\n')
        .forEach((line, index) => {
          const code = line.split('//')[0] ?? line
          if (/addEventListener\(\s*['"`]scroll['"`]/.test(code)) {
            hits.push(`${file}:${index + 1}  ${code.trim()}`)
          }
        })
    }

    expect(
      hits,
      'use the Tempus callback, ScrollTrigger, or IntersectionObserver'
    ).toEqual([])
  })

  it('no second requestAnimationFrame loop is opened', async () => {
    const files = await collect(TS_GLOBS)

    const hits: string[] = []
    for (const [file, source] of files) {
      /*
       * `lib/dev/` and `lib/scripts/` are tooling, not the site: the rule is
       * about the frame loop a visitor's browser runs. `bench-rerender.ts`
       * awaits one frame to measure a render and never ships.
       */
      if (file.startsWith('lib/dev/') || file.startsWith('lib/scripts/')) {
        continue
      }
      stripBlockComments(source)
        .split('\n')
        .forEach((line, index) => {
          const code = line.split('//')[0] ?? line
          if (/\brequestAnimationFrame\s*\(/.test(code)) {
            hits.push(`${file}:${index + 1}  ${code.trim()}`)
          }
        })
    }

    expect(
      hits,
      'CLAUDE.md #6: Lenis, GSAP and Tempus share one loop; a second one desynchronises'
    ).toEqual([])
  })
})

describe('shipped copy carries no em-dash', () => {
  /*
   * `taste-skill` SKILL.md section 9.G: the em-dash is "the single
   * most-violated Tell" and the ban is absolute for anything a visitor reads.
   *
   * ## Scope, narrowed on purpose
   *
   * Adopted for **copy that reaches the page**, not for `docs/` or code
   * comments. Section 9.G's argument is about an AI tell in a user interface;
   * this repository's own prose is not a user interface, and rewriting 200
   * doc comments would be obedience without a reason.
   * `docs/stages/TAHAP-34.md` §5.1 states the distinction so it stays a
   * decision rather than an oversight.
   *
   * ## Why here and not in the e2e suite
   *
   * It started as `e2e/taste-preflight.e2e.ts` and found eighteen, then stuck
   * on one it could not own: the home page's subline is served from Sanity.
   * A gate that reddens because someone wrote an em-dash in the CMS makes the
   * build depend on mutable external content. Reading sources is both
   * narrower in responsibility and wider in reach — it sees strings that
   * ship to no route yet, and needs no server.
   */
  const COPY_GLOBS = [
    'lib/content/*.ts',
    'lib/seo/*.ts',
    'lib/scripts/seed-fixtures.ts',
  ]

  it('no shipped TypeScript string uses an em-dash', async () => {
    const files = await collect(COPY_GLOBS)
    expect(files.length).toBeGreaterThan(5)

    const hits: string[] = []
    for (const [file, source] of files) {
      stripBlockComments(source)
        .split('\n')
        .forEach((line, index) => {
          const code = line.split('//')[0] ?? line
          if (code.includes('\u2014')) {
            hits.push(`${file}:${index + 1}  ${code.trim().slice(0, 100)}`)
          }
        })
    }

    expect(
      hits,
      'replace with a full stop, a comma, or brackets; never a dangling hyphen'
    ).toEqual([])
  })

  it('neither locale file uses an em-dash', async () => {
    const locales = ['en', 'id'] as const
    let strings = 0
    const hits: string[] = []

    for (const locale of locales) {
      const raw = await readFile(`messages/${locale}.json`, 'utf8')
      const messages = parseMessageTree(raw, `messages/${locale}.json`)

      const walk = (node: MessageNode, path: string) => {
        if (typeof node === 'string') {
          strings += 1
          if (node.includes('\u2014')) hits.push(`${locale}:${path}  ${node}`)
          return
        }
        for (const [key, value] of Object.entries(node)) {
          walk(value, path ? `${path}.${key}` : key)
        }
      }

      walk(messages, '')
    }

    // Anti-vacuum: both locale files must actually have been read.
    expect(strings).toBeGreaterThan(200)
    expect(hits).toEqual([])
  })
})
