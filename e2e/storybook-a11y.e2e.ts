/**
 * axe over every Storybook story.
 *
 * `docs/ROADMAP.md` sets "axe clean in Storybook" as a Tahap 2 exit
 * criterion, and until now there was **no mechanism behind it** — no
 * `@storybook/addon-a11y`, no test runner. Claiming an accessibility result
 * with nothing measuring it violates this project's own rule 20, so the gate
 * is built rather than the criterion assumed.
 *
 * Storybook is a static build, not a served app, so this spec serves
 * `storybook-static/` itself on a free port for the duration of the run. The
 * repo's single Playwright `webServer` stays pointed at the Next app.
 *
 * If `storybook-static/` is absent the spec **skips with a message** rather
 * than failing: `bun run test:e2e` has to stay runnable on its own, without
 * waiting on a Storybook build. CI runs `bun run build-storybook` first, so
 * the gate is real there.
 */

import type { Dirent } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import type { Server } from 'node:http'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'
import {
  readStories,
  serveStorybook,
  STORYBOOK_ROOT,
  storyUrl,
} from './storybook-server'

const ROOT = STORYBOOK_ROOT
const INDEX = join(ROOT, 'index.json')

/**
 * The most recently modified file among the sources Storybook renders.
 *
 * Deliberately narrow: the component source and the style layer Storybook
 * actually renders — not the whole repo, and not the build tooling beside it.
 * A change to an `app/` route, to a doc, or to `lib/styles/scripts/` (which
 * generates tokens rather than being rendered) cannot alter a story. Making
 * those invalidate the build would train everyone to ignore the check, which
 * is the failure mode this check exists to end.
 */
const GENERATED = new Set(['root.css', 'tailwind.css'])

function newestSourceChange(): { path: string; mtimeMs: number } {
  const roots = ['components', 'vault', 'lib/styles']
  let newest = { path: 'none', mtimeMs: 0 }

  const walk = (dir: string) => {
    let entries: Dirent[]
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        // Build tooling, not rendered output.
        if (entry.name === 'scripts') continue
        walk(full)
        continue
      }
      // Tests describe the components; they do not change what renders.
      if (entry.name.includes('.test.')) continue
      /*
       * Generated, not authored — and regenerated *during* the Storybook
       * build, so their mtime is always newer than the build output that
       * consumed them. Comparing against them makes the check fail forever,
       * which is how a staleness check becomes noise and then gets deleted.
       * The inputs that produce them (`lib/styles/layout.mjs`,
       * `colors.ts`, `typography.ts`) are scanned, and those are what a
       * person actually edits.
       */
      if (GENERATED.has(entry.name)) continue
      if (!/\.(tsx?|css|mjs)$/.test(entry.name)) continue
      const { mtimeMs } = statSync(full)
      if (mtimeMs > newest.mtimeMs) newest = { path: full, mtimeMs }
    }
  }

  for (const root of roots) walk(join(import.meta.dirname, '..', root))
  return newest
}

const stories = readStories()

test.describe('Storybook a11y', () => {
  let server: Server | undefined
  let origin = ''

  test.beforeAll(async () => {
    if (stories.length === 0) return
    const started = await serveStorybook()
    server = started.server
    origin = started.origin
  })

  test.afterAll(async () => {
    server?.close()
  })

  test('finds a built Storybook to check', () => {
    test.skip(
      stories.length === 0,
      'storybook-static/index.json not found — run `bun run build-storybook` first'
    )
    expect(stories.length).toBeGreaterThan(0)
  })

  test('the built Storybook is not older than the components it checks', () => {
    /*
     * `bun run test:e2e` does not build Storybook, so this spec happily
     * checks whatever `storybook-static/` last contained.
     *
     * That is not hypothetical. A contrast defect in `ProjectHero`'s metadata
     * labels — muted text at 4.07:1 on the light theme, below AA — sat green
     * across several stages because every run measured a build made before
     * the components changed. It surfaced only when the directory happened to
     * be rebuilt (`docs/stages/TAHAP-11.md` §3c). A gate that checks a stale
     * artefact is worse than no gate: it reports on code that is not shipping.
     */
    test.skip(stories.length === 0, 'no built Storybook')

    const builtAt = statSync(INDEX).mtimeMs
    const newest = newestSourceChange()

    expect(
      builtAt >= newest.mtimeMs,
      `storybook-static is older than ${newest.path} — run \`bun run build-storybook\``
    ).toBe(true)
  })

  for (const story of stories) {
    test(`${story.title} › ${story.name}`, async ({ page }) => {
      test.skip(
        stories.length === 0,
        'storybook-static/index.json not found — run `bun run build-storybook` first'
      )

      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))

      await page.goto(storyUrl(origin, story.id), { waitUntil: 'networkidle' })

      expect(errors, `${story.id} threw while rendering`).toEqual([])

      /*
       * Critical and serious only, matching `route-sweep.e2e.ts`.
       *
       * Storybook renders components out of a document — a story is a bare
       * `<div>` with no landmarks and often no `<h1>` — so the landmark and
       * heading-order rules fire on almost every story and would say nothing
       * about the component. Those rules are checked where they mean
       * something: on real pages, in `route-sweep.e2e.ts`.
       */
      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === 'critical' || violation.impact === 'serious'
      )

      expect(
        blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        `${story.id} has blocking a11y violations`
      ).toEqual([])
    })
  }
})
