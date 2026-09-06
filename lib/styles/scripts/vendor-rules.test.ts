import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { Glob } from 'bun'

/**
 * The rules that govern vendored third-party UI — Tahap 47.
 *
 * ## Why a gate exists before a single component is used
 *
 * This repo already learned what happens when a category of value arrives
 * with no gate watching it. `lib/styles/scripts/scale-rules.test.ts` records
 * the bill: **192 of 375 spacing occurrences off the ladder, 53 `font-size`
 * declarations bypassing the scale, two complete parallel type scales**, all
 * of it accumulated across 36 stages of careful work by an author who was
 * trying to follow the system.
 *
 * Third-party code leaks faster than that, because it arrives already
 * finished. A component that renders correctly is a component nobody reads.
 *
 * ## What `vault/magic/` is
 *
 * The single door for anything derived from Magic UI (MIT, Copyright (c)
 * Magic UI — see `docs/PROVENANCE.md` §Magic UI, verified by reading that
 * repository's own `LICENSE.md`). Nothing from that source enters the site
 * except through a file in this directory, and every such file has been put
 * through five transformations first. This test is four of the five; the
 * fifth (animate only `transform`/`opacity`) is already held for CSS by
 * `motion-rules.test.ts`, which scans `vault/**` too.
 *
 * ## Sources, not build output
 *
 * The same boundary `motion-rules.test.ts` and `taste-rules.test.ts` draw,
 * for the same reason: a rule about what we write has to check what we write.
 * A component that ships to no route yet still has to be correct, because
 * "it renders nowhere" is precisely how `vault/motion/page-transition` sat
 * for ten stages with two bugs in it (`docs/stages/TAHAP-11.md` §2.4).
 *
 * ## The exemption
 *
 * A line preceded by a `vendor-exempt: <reason>` comment is allowed through —
 * the same shape as `motion-exempt:` and `scale-exempt:`. An opt-out needs a
 * reason, and the reason sits where it applies rather than in a config file
 * nobody opens.
 */

const VENDOR_GLOBS = ['vault/magic/**/*.ts', 'vault/magic/**/*.tsx']
const VENDOR_STYLE_GLOB = 'vault/magic/**/*.css'

interface Finding {
  file: string
  line: number
  text: string
}

/**
 * Blank out comments, keeping newlines so line numbers survive.
 *
 * Copied in shape from `taste-rules.test.ts`, and for the reason that file
 * records: splitting a line at `/*` reads the continuation lines of a block
 * comment as code, so a provenance header explaining *why* a colour was
 * replaced would be reported as the colour.
 *
 * Line comments go too. A `// #ffffff was the upstream default` is a record,
 * not a value.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (match) => match.replace(/[^\n]/g, ' '))
}

/**
 * Is the line, or the contiguous comment block above it, an exemption?
 *
 * Walks back through the whole comment block rather than one line —
 * `scale-rules.test.ts` records why: for a block comment, `raw[index - 1]` is
 * the closing `*\/`, so a one-line lookback can only ever find single-line
 * reasons, and a reason worth writing rarely fits on one line.
 */
function isExempt(lines: string[], index: number): boolean {
  if ((lines[index] ?? '').includes('vendor-exempt:')) return true

  for (let cursor = index - 1; cursor >= 0; cursor--) {
    const line = (lines[cursor] ?? '').trim()
    if (line === '') continue
    const isComment =
      line.startsWith('*') ||
      line.startsWith('/*') ||
      line.startsWith('//') ||
      line.endsWith('*/')
    if (!isComment) return false
    if (line.includes('vendor-exempt:')) return true
  }

  return false
}

async function collect(pattern: string): Promise<[string, string][]> {
  const files: [string, string][] = []
  for await (const file of new Glob(pattern).scan('.')) {
    if (file.includes('.test.') || file.includes('.stories.')) continue
    files.push([file, await readFile(file, 'utf8')])
  }
  return files
}

/** Every source file under `vault/magic/`, TypeScript and CSS alike. */
async function collectAll(): Promise<[string, string][]> {
  const files: [string, string][] = []
  for (const pattern of [...VENDOR_GLOBS, VENDOR_STYLE_GLOB]) {
    files.push(...(await collect(pattern)))
  }
  return files
}

/**
 * Run one pattern over every vendored source, honouring exemptions.
 */
async function scan(pattern: RegExp): Promise<Finding[]> {
  const found: Finding[] = []

  for (const [file, source] of await collectAll()) {
    const lines = stripComments(source).split('\n')

    for (const [index, raw] of lines.entries()) {
      const line = raw ?? ''
      // `lastIndex` is not reset between lines for a /g pattern, so build a
      // fresh matcher per line rather than sharing state across the file.
      if (
        !new RegExp(pattern.source, pattern.flags.replace('g', '')).test(line)
      )
        continue
      if (isExempt(lines, index)) continue

      found.push({ file, line: index + 1, text: line.trim().slice(0, 100) })
    }
  }

  return found
}

function report(findings: Finding[]): string {
  return findings.map((f) => `${f.file}:${f.line}  ${f.text}`).join('\n')
}

/*
 * The patterns.
 *
 * Each one is written to catch the shape Magic UI actually ships, measured
 * against `registry/magicui/shimmer-button.tsx` — the component installed
 * unmodified in Tahap 47 to prove this file red, then removed.
 */

/** `#abc`, `#aabbcc`, `#ffffff1f` — the eight-digit form is what upstream uses inside `shadow-[…]`. */
const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

/** `rgba(0, 0, 0, 1)` and friends. `CLAUDE.md` #10 wants `oklch()` and `color-mix()`. */
const LEGACY_COLOR = /\b(?:rgba?|hsla?)\s*\(/

/**
 * `3s`, `300ms`, `0.5s` — `CLAUDE.md` #3 and #8.
 *
 * Deliberately not matched: a bare number. `numOctaves={6}` and
 * `baseFrequency={0.4}` are filter parameters, not time.
 */
const RAW_DURATION = /\b\d+(?:\.\d+)?m?s\b/

/**
 * A bare curve — `CLAUDE.md` #2.
 *
 * The lookbehind is what keeps `var(--ease-out-quart)` legal: inside a token
 * name, `ease` is preceded by `-`. `easeInOut` (the `motion` spelling) is
 * caught by the trailing guard rejecting a word character.
 */
const BARE_EASE = /(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-])/

/** `CLAUDE.md` #1 — curves come from `lib/styles/css/easings.css`, never authored here. */
const RAW_BEZIER = /cubic-bezier\s*\(/

/** `CLAUDE.md` #6 — one RAF loop. Vendored canvas work is rewired to `useTempus`. */
const OWN_RAF = /requestAnimationFrame/

/** The owner's decision, and `CLAUDE.md` #6: `motion` runs a scheduler of its own. */
const MOTION_IMPORT = /from\s+['"](?:motion|framer-motion)(?:\/[\w-]+)?['"]/

/**
 * Tailwind arbitrary values — `blur-[2px]`, `[background:var(--bg)]`.
 *
 * Two shapes, because upstream ships both. The value half forbids whitespace
 * on purpose: Tailwind writes spaces as `_`, so `[key: string]: unknown` — a
 * TypeScript index signature, which several of these files carry — has a
 * space after its colon and is not an arbitrary utility.
 */
const ARBITRARY_PROPERTY = /\[[a-z-]+:[^\s\]]+\]/
const ARBITRARY_VALUE = /[a-z0-9]-\[[^\s\]]+\]/

describe('vendored UI carries no value the design system did not choose', () => {
  it('finds vendored source to check at all', async () => {
    /*
     * Anti-vacuum. A gate that examined nothing must not report success —
     * the failure mode every gate in this directory is written against, and
     * the one this file is most exposed to, because `vault/magic/` is new
     * and could be emptied by a bad merge without anything else noticing.
     */
    const files = await collectAll()
    expect(files.length, 'vault/magic/ has no source files').toBeGreaterThan(0)
  })

  it('#8, #10: no raw hex', async () => {
    const found = await scan(HEX)
    expect(found, `raw hex in vendored source:\n${report(found)}`).toEqual([])
  })

  it('#10: no rgb()/hsl() — colour is authored in oklch()', async () => {
    const found = await scan(LEGACY_COLOR)
    expect(found, `legacy colour function:\n${report(found)}`).toEqual([])
  })

  it('#3, #8: no literal durations', async () => {
    const found = await scan(RAW_DURATION)
    expect(found, `duration literal:\n${report(found)}`).toEqual([])
  })

  it('#2: no bare ease/ease-in/ease-out/ease-in-out', async () => {
    const found = await scan(BARE_EASE)
    expect(found, `bare easing keyword:\n${report(found)}`).toEqual([])
  })

  it('#1: no authored cubic-bezier()', async () => {
    const found = await scan(RAW_BEZIER)
    expect(found, `authored curve:\n${report(found)}`).toEqual([])
  })

  it('#6: no second RAF loop', async () => {
    const found = await scan(OWN_RAF)
    expect(
      found,
      `vendored code drives its own frame loop; rewire it to useTempus:\n${report(found)}`
    ).toEqual([])
  })

  it('#6: no motion/framer-motion import', async () => {
    const found = await scan(MOTION_IMPORT)
    expect(
      found,
      `motion is not a dependency of this project:\n${report(found)}`
    ).toEqual([])
  })

  it('#8: no Tailwind arbitrary values', async () => {
    const found = [
      ...(await scan(ARBITRARY_PROPERTY)),
      ...(await scan(ARBITRARY_VALUE)),
    ]
    expect(
      found,
      `arbitrary utility — the value belongs in a CSS module, from a token:\n${report(found)}`
    ).toEqual([])
  })
})

describe('vendored UI states where it came from', () => {
  /*
   * `CLAUDE.md` #17 in machine form.
   *
   * Checked per directory rather than per file, because that is the real
   * requirement: a component's origin is a property of the component, and
   * repeating the header in its stylesheet would be ceremony. The header
   * lives in `index.tsx`, which is what a reader opens first.
   */
  it('every vault/magic component declares its provenance', async () => {
    const entries: [string, string][] = []
    for await (const file of new Glob('vault/magic/*/index.tsx').scan('.')) {
      entries.push([file, await readFile(file, 'utf8')])
    }

    expect(
      entries.length,
      'vault/magic/ has no components — the provenance rule checked nothing'
    ).toBeGreaterThan(0)

    const missing = entries.filter(([, source]) => {
      const header = source.slice(0, source.indexOf('*/') + 2)
      return (
        !header.includes('Provenance') ||
        !/Licence|License/.test(header) ||
        // The one sentence that cannot be skipped. "Adapted from" is not an
        // answer; whether bytes were copied decides what MIT requires.
        !/Code copied:/.test(header)
      )
    })

    expect(
      missing.map(([file]) => file),
      'header must carry Provenance, a Licence line, and an explicit "Code copied:"'
    ).toEqual([])
  })
})

describe('vendored UI stands down under reduced motion', () => {
  /*
   * `CLAUDE.md` #5, and the specific failure `global.css:402` records: the
   * `*` kill switch sits at specificity 0,0,0 and **loses to any component
   * class**, which is why every component that animates carries its own
   * block. Fourteen stylesheets went without one until Tahap 37 counted them.
   *
   * A vendored file is more exposed than an authored one: upstream has no
   * reduced-motion story at all, so the block is never inherited — it is
   * always something we add, and therefore always something we can forget.
   */
  it('every vendored stylesheet that animates also stands down', async () => {
    const offenders: string[] = []

    for (const [file, source] of await collect(VENDOR_STYLE_GLOB)) {
      const code = stripComments(source)
      const animates = /(?:^|[\s;{])(?:transition|animation)\s*:/.test(code)
      if (!animates) continue
      if (code.includes('(--reduced-motion)')) continue
      offenders.push(file)
    }

    expect(
      offenders,
      'add @media (--reduced-motion) — the global * rule loses to a component class'
    ).toEqual([])
  })
})
