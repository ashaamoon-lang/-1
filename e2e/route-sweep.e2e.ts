import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'
import { axeTags } from './axe-tags'

/**
 * Route sweep — auto-discovered smoke coverage for every static page.
 *
 * Why generated beats instructed: a hand-maintained checklist ("add a smoke
 * test when you add a route") rots the moment someone forgets it — and
 * nothing enforces "someone" remembering. This file discovers routes from the
 * filesystem at collection time (below, before any `test()` calls run) and
 * emits one smoke test per route. A new `app/**\/page.tsx` gets coverage the
 * instant the file exists; no instruction to follow, nothing to forget.
 *
 * Prune-safety: discovery is filesystem-derived, so a fork that deletes a
 * route shrinks this sweep automatically — there's no stale entry to clean
 * up, because there's no hardcoded list.
 *
 * What's excluded, and why:
 *  - Dynamic segments (any path segment containing `[`) are skipped. They
 *    need fixture data to render meaningfully (a real slug, a real product
 *    id) and are bespoke by definition — write a dedicated `*.e2e.ts` for
 *    those, the same way `not-found.e2e.ts` covers the `[...unmatched]`
 *    catch-all with real assertions instead of a generic smoke.
 *  - Route groups (`(site)`, `(examples)`) are stripped from the URL — they
 *    don't affect routing, only file organization.
 *  - `OPT_OUT` (below) is an escape hatch for a static route that genuinely
 *    cannot be visited by this smoke (needs auth, needs a running external
 *    service, etc.) — not a knob for "this test is slow" or "this is
 *    flaky." Same spirit as the `// cache-exempt:` comments in
 *    `lib/integrations/cache-invariant.test.ts`: an opt-out requires a
 *    reason, and the reason is visible (here, in the test name).
 *
 * Scaling this past the starter's 3 routes: `fullyParallel` is already on in
 * `playwright.config.ts`, so this sweep is fine well into the dozens of
 * routes at ~1-2s each. Past that, in order:
 *   1. Turn up `--workers` in the CI invocation.
 *   2. Shard with Playwright's `--shard=i/n` across a matrix of CI jobs.
 *   3. Split the axe (a11y) scan out into a nightly full-suite run and keep
 *      the per-PR sweep to the render + console-error assertions — a11y
 *      scans are the slowest part of each iteration.
 *   4. `OPT_OUT` is never the answer to "this got slow." It exists for
 *      routes that genuinely can't be visited, not for pruning a sweep that
 *      takes too long — that means invest in 1-3 above.
 * None of 1-3 are implemented here: the starter has 3 routes, and machinery
 * nothing exercises is the disease this sweep is curing, not a pattern to
 * repeat preemptively.
 */

/** Path (as it will be requested, e.g. `/pricing`) -> reason it's excluded. */
const OPT_OUT: Record<string, string> = {}

const APP_DIR = join(process.cwd(), 'app')

/** Recursively collect every `page.tsx` under `dir`, relative to `dir`. */
function findPageFiles(dir: string, base = dir): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const pages: string[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      pages.push(...findPageFiles(fullPath, base))
    } else if (entry.isFile() && entry.name === 'page.tsx') {
      pages.push(fullPath.slice(base.length))
    }
  }

  return pages
}

/**
 * `/[locale]/ai/page.tsx` -> `['/en/ai', '/id/ai']`; returns `[]` for a route
 * with any other dynamic segment.
 *
 * `[locale]` is expanded rather than skipped. Every page in this app now lives
 * under it, so skipping dynamic segments wholesale — as this did before
 * bilingual routing — would discover nothing at all and silently delete the
 * entire sweep. Expanding instead means each page is smoke-tested in BOTH
 * languages, automatically, with no list to maintain.
 *
 * Other dynamic segments (`[slug]`, `[...slug]`) are still skipped: they need
 * fixture data to render meaningfully and belong in a dedicated spec.
 */
function toRoutes(relativePagePath: string): string[] {
  // path.join produces `\` separators on Windows; split on both so the
  // sweep derives the same routes on every contributor's machine.
  const segments = relativePagePath
    .split(/[\\/]/)
    .filter((segment) => segment.length > 0 && segment !== 'page.tsx')

  const isLocaleSegment = (segment: string) => segment === '[locale]'

  if (
    segments.some(
      (segment) => segment.includes('[') && !isLocaleSegment(segment)
    )
  ) {
    return []
  }

  const staticSegments = segments.filter(
    (segment) => !(segment.startsWith('(') && segment.endsWith(')'))
  )

  if (!staticSegments.some(isLocaleSegment)) {
    return [staticSegments.length === 0 ? '/' : `/${staticSegments.join('/')}`]
  }

  return routing.locales.map(
    (locale) =>
      `/${staticSegments.map((segment) => (isLocaleSegment(segment) ? locale : segment)).join('/')}`
  )
}

function discoverRoutes(): string[] {
  if (!existsSync(APP_DIR) || !statSync(APP_DIR).isDirectory()) return []

  const routes = findPageFiles(APP_DIR).flatMap(toRoutes)

  return [...new Set(routes)].sort()
}

const discoveredRoutes = discoverRoutes()

/**
 * Runs every scroll-triggered reveal to completion, so axe scans a settled page.
 *
 * Two reasons, and the second one only appeared in Tahap 9.
 *
 * `use-reveal` fades items in via IntersectionObserver, so anything below the
 * fold sits at `opacity: 0` until it is scrolled to — and an element at zero
 * opacity fails `color-contrast`, because axe cannot tell "will fade in" from
 * "unreadable". Scrolling through first means the sweep covers content that
 * was otherwise never scanned at all.
 *
 * It also removes a race. `page.goto` resolves on `load`, which can land
 * mid-fade, and a half-faded element genuinely has low contrast for that
 * instant. This did not surface before because the home page's content was
 * inside a `<div hidden>` — the Suspense fallback described in
 * `docs/stages/TAHAP-9.md` §1 — so axe had almost nothing to look at. Fixing
 * that made the sweep meaningful and flaky in the same commit.
 */
async function settleReveals(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
    window.scrollTo(0, 0)
  })

  // Longer than the slowest reveal (`--reveal-duration`, 700ms) plus the
  // largest stagger, so nothing is still interpolating when axe reads it.
  await page.waitForTimeout(1200)
}

test.describe('route sweep', () => {
  // A broken glob (wrong base dir, renamed `page.tsx` convention, etc.) must
  // fail loudly, not silently pass an empty suite — same paranoia as
  // `cache-invariant.test.ts`'s "scans at least one source file" check.
  test('discovers at least one route', () => {
    expect(discoveredRoutes.length).toBeGreaterThan(0)
  })

  for (const route of discoveredRoutes) {
    const optOutReason = OPT_OUT[route]

    test(`${route}: renders, has no console errors, passes a11y${
      optOutReason ? ` (opted out: ${optOutReason})` : ''
    }`, async ({ page }) => {
      test.skip(Boolean(optOutReason), optOutReason)

      const consoleErrors: string[] = []
      const pageErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      page.on('pageerror', (error) => {
        pageErrors.push(error.message)
      })

      await page.goto(route)

      // `networkidle` never settles here — the WebGL scene and the dev HMR
      // socket keep the connection busy — so anchor on web assertions instead.
      // Page renders: assert a non-empty document title (auto-waits).
      await expect(page).toHaveTitle(/.+/)
      await expect(page.locator('body')).toBeVisible()

      // No console errors or uncaught exceptions during load
      expect(consoleErrors).toEqual([])
      expect(pageErrors).toEqual([])

      /*
       * Every violation, at every impact — no severity filter.
       *
       * The starter filtered to critical + serious "until the starter is
       * confirmed clean at the full severity level". It now is: Tahap 2
       * removed the nested `<main>` (three moderate landmark violations) and
       * marked the WebGL canvas decorative (one `region` violation on every
       * page), and these routes measure clean at every impact.
       *
       * The filter was not harmless while it lasted. It is exactly what let
       * four real defects sit in the suite while it reported green.
       */
      await settleReveals(page)

      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()
      expect(
        results.violations.map(
          (v) => `${v.impact}: ${v.id} (${v.nodes.length} node(s))`
        )
      ).toEqual([])
    })
  }
})
