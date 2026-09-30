/**
 * Guards the generated stylesheets against drift.
 *
 * `lib/styles/css/tailwind.css` and `root.css` are produced from the palette in
 * `colors.ts` and the rest of `lib/styles/config.ts`. Editing a color without
 * re-running `setup:styles` leaves the CSS stale, and nothing else in the
 * pipeline notices: the app keeps compiling and every theme keeps rendering the
 * previous palette. These tests rebuild in memory and compare against what is
 * committed, so the drift fails here instead of shipping.
 *
 * On failure: run `bun run setup:styles` and commit the regenerated files.
 *
 * Run with: bun test lib/styles/scripts/setup-styles.test.ts
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'

import { colors, themes } from '../config'
import { buildStyleSheets, OUTPUTS } from './setup-styles'

const repoRoot = join(import.meta.dir, '..', '..', '..')
const built = buildStyleSheets()

const readCommitted = (path: string) => Bun.file(join(repoRoot, path)).text()

describe('generated stylesheets', () => {
  it('tailwind.css matches a fresh build of the current config', async () => {
    expect(await readCommitted(OUTPUTS.tailwind)).toBe(built.tailwind)
  })

  it('root.css matches a fresh build of the current config', async () => {
    expect(await readCommitted(OUTPUTS.root)).toBe(built.root)
  })

  it('emits every palette entry and theme as a custom property', () => {
    for (const name of Object.keys(colors)) {
      expect(built.tailwind).toContain(`--color-${name}:`)
    }

    for (const [name, theme] of Object.entries(themes)) {
      expect(built.tailwind).toContain(`[data-theme=${name}]`)

      for (const value of Object.values(theme)) {
        expect(built.tailwind).toContain(value)
      }
    }
  })
})
