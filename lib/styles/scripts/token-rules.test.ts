import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { Glob } from 'bun'

/**
 * `CLAUDE.md` #8 and #10, enforced.
 *
 * > **No hardcoded design values.** No raw hex … in a component.
 * > **Author colour in `oklch()`** and derive variants with `color-mix(…)`.
 *
 * `docs/ROADMAP.md` §1.5 listed this as "(enforced at review)", which is
 * another way of saying it was enforced by whoever remembered — the same
 * sentence `lib/styles/scripts/motion-rules.test.ts` was written to answer for
 * the motion rules. That file scans CSS. **Nothing scanned TypeScript**, and a
 * colour handed to WebGL is a TypeScript value, not a stylesheet declaration.
 *
 * ## What the gap cost
 *
 * Two literals, in one file, for sixteen stages:
 *
 * ```
 * vault/webgl/scene-shell/index.tsx:  colorA = '#0d0d0d'
 *                                     colorB = '#242527'
 * ```
 *
 * They were the hero's gradient — the site's single largest area of colour —
 * and they span 13 to 36 of 255 against a page ground that renders at 15, so
 * half of the gradient was darker than the page behind it. The one place the
 * design system was bypassed was the one place the site looked worst. The
 * audit that found it measured the first screen as a flat black rectangle:
 * mean luminance 4.0/255, gradient range 2.0/255.
 *
 * That is not a coincidence to note in passing. A palette is a system, and a
 * value written outside it is a value nobody tuned, reviewed, or checked for
 * contrast. `docs/stages/TAHAP-17.md` carries the full measurement.
 *
 * ## Scope
 *
 * Authored sources only, and only the ones that ship: `components/`, `vault/`,
 * `app/` and `lib/`. Not `lib/styles/css/`, which is where the palette is
 * *defined* and therefore the one place a colour literal is the point. Not
 * tests, stories or scripts — a fixture colour is data, and a brand asset
 * renderer legitimately writes pixels.
 *
 * ## The exemption
 *
 * A line carrying `token-exempt: <reason>` in a comment is allowed through,
 * the same shape the motion gate uses. An opt-out needs a reason, and the
 * reason sits on the line it applies to rather than in a config nobody opens.
 */

const SOURCE_GLOBS = [
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
 * Files whose job is colour itself, or which never reach a page.
 *
 * `lib/styles/` defines the palette. Brand assets rasterise images. Tests and
 * stories carry fixtures. Each is excluded because a literal there is not a
 * design decision leaking out of the system — it *is* the system, or it is
 * data.
 */
const EXCLUDED = [
  /^lib\/styles\//,
  /^lib\/scripts\//,
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /\.d\.ts$/,
]

/** `#abc`, `#aabbcc`, `#aabbccdd` — but not `#work`, `#main-content`, `#400`. */
const HEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

interface Finding {
  file: string
  line: number
  text: string
}

/**
 * Strips the parts of a line where a `#rrggbb` is not a colour.
 *
 * Comments are the big one: this project documents its contrast decisions in
 * prose, and `0.45 rendered #858585` is a measurement being recorded, not a
 * value being used. An href (`#work`) and a fragment id are not colours
 * either. Removing them before matching is what keeps the gate pointed at
 * code rather than at writing about code.
 */
function strip(line: string): string {
  return line
    .replace(/\/\/.*$/, '')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/^\s*\*.*$/, '')
    .replace(/href=["'`]#[^"'`]*["'`]/g, '')
    .replace(/url\(#[^)]*\)/g, '')
}

async function findings(): Promise<Finding[]> {
  const found: Finding[] = []

  for (const pattern of SOURCE_GLOBS) {
    for await (const file of new Glob(pattern).scan('.')) {
      if (EXCLUDED.some((rule) => rule.test(file))) continue

      const source = await readFile(file, 'utf8')
      const lines = source.split('\n')

      let inBlockComment = false
      for (const [index, raw] of lines.entries()) {
        const line = raw ?? ''

        // Track multi-line comments so a documented hex inside one — which
        // this codebase has several of — is never read as code.
        if (inBlockComment) {
          if (line.includes('*/')) inBlockComment = false
          continue
        }
        if (/\/\*/.test(line) && !/\*\//.test(line)) {
          inBlockComment = true
          continue
        }

        if (line.includes('token-exempt:')) continue

        const stripped = strip(line)
        if (HEX.test(stripped)) {
          found.push({ file, line: index + 1, text: line.trim().slice(0, 100) })
        }
      }
    }
  }

  return found
}

describe('token rules', () => {
  it('no raw hex colour in shipped source', async () => {
    const violations = await findings()

    expect(
      violations,
      `raw hex colour outside the palette:\n${violations
        .map((v) => `  ${v.file}:${v.line}  ${v.text}`)
        .join('\n')}`
    ).toEqual([])
  })
})
