import type { Browser } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * What each route costs on its own, and which heavy libraries it is allowed.
 *
 * ## Why the assertion is a library list, not only a number
 *
 * A byte ceiling drifts and gets raised. The decision worth protecting is
 * *which* routes pay for three.js, GSAP and the Sanity client — and that
 * decision had quietly stopped holding: `lib/features/index.tsx` documents
 * that "a site that never animates should not pay for it" while
 * `<Wrapper>` passed `syncScrollTrigger` unconditionally, and `<SanityLive>`
 * mounted on every route including the one whose own comment claims it is
 * "server-only end to end" (`docs/AUDIT-2026-08.md` §Tier 4).
 *
 * ## Why prefetch is blocked
 *
 * Next warms linked routes, so `/en/work` legitimately downloads the home
 * page's chunks — including three.js — because the wordmark links there.
 * Counting those would make every route look like the heaviest one it links
 * to. Blocking prefetch isolates the route's own graph, which is what the
 * budget is about. Verified: `/en/work` measures 914KB with prefetch on and
 * 737KB with it blocked, and the difference is entirely the home route.
 *
 * ## Why post-idle, not from the markup
 *
 * Tahap 5 budgeted by counting `<script src>` tags in the HTML. Two libraries
 * arrived *after* hydration through `import()` and were invisible to that
 * method. This waits for the network to settle and weighs what arrived.
 *
 * ## Tahap 7's "exactly one route" rule is revoked here, on purpose
 *
 * This file used to carry a stronger claim than a budget: that the material
 * layer lives on **one** route and a second would undo a Tahap 7 decision.
 * The owner of the project has directed that WebGL be extended (scaffold
 * Fase 6, `docs/ROADMAP.md`), so that rule is lifted **explicitly and here**,
 * rather than quietly violated by the stage that needs it.
 *
 * What replaces it is not "anything goes". Every route still declares what it
 * carries, and a stage that adds a library to a route must add it to that
 * route's `allow` list with its reason. The list is the decision; the number
 * is only the ceiling.
 *
 * ## Baseline, measured against the production build in Tahap 22
 *
 * | route                     | measured | budget | headroom |
 * | ------------------------- | -------- | ------ | -------- |
 * | `/en`                     | 1899 KB  | 2100   | 201      |
 * | `/id`                     | 1899 KB  | 2100   | 201      |
 * | `/en/work`                |  751 KB  |  900   | 149      |
 * | `/en/work/arus-balik`     |  746 KB  |  900   | 154      |
 * | `/en/practice/consulting` |  874 KB  |  900   | **26**   |
 * | `/en/ai`                  |  706 KB  |  850   | 144      |
 *
 * **No ceiling was raised in Tahap 22.** Raising a budget for weight that
 * does not exist yet is how a budget stops meaning anything; Fase 6 raises
 * the routes it actually loads, with the measurement that justifies it.
 *
 * The practice route's 26KB is the one to watch: the scaffold's Fase 1 adds
 * motion primitives, and that is where they will land first. A red gate there
 * is this file working, not this file being in the way.
 */

/** Byte totals are uncompressed response bodies, not transfer size. */
const ROUTES: { path: string; allow: string[]; maxKb: number }[] = [
  // The page with a scene, and the one that animates.
  { path: '/en', allow: ['three', 'gsap'], maxKb: 2100 },
  /*
   * The Indonesian home page, which was **not measured at all** until Tahap
   * 22 added it.
   *
   * It is the same page and carries the same 1899KB and the same two
   * libraries, so a regression there would have been invisible: every route
   * in this list was an `/en` one, and a bilingual site whose gate only reads
   * one language is checking half of what it ships.
   */
  { path: '/id', allow: ['three', 'gsap'], maxKb: 2100 },
  { path: '/en/work', allow: [], maxKb: 900 },
  { path: '/en/work/arus-balik', allow: [], maxKb: 900 },
  /*
   * A practice page opts into `gsap` and nothing else.
   *
   * `components/effects/progress-text` scrubs word opacity against scroll,
   * which needs ScrollTrigger. It does **not** get three.js — not because a
   * second WebGL route is forbidden (that rule is revoked above) but because
   * nothing on this route has asked for one yet. When a stage wants it, it
   * adds `three` here and says why.
   */
  { path: '/en/practice/consulting', allow: ['gsap'], maxKb: 900 },
  // The machine view. Its layout comment promises zero client components.
  { path: '/en/ai', allow: [], maxKb: 850 },
]

/** Identify a library by something only that library contains. */
const MARKERS = {
  three: /WebGLRenderer/,
  gsap: /GreenSock/,
  sanity: /sanityFetch|SanityClient/,
} satisfies Record<string, RegExp>

/** Below this a chunk is too small to be a library; scanning it is waste. */
const SCAN_FLOOR_BYTES = 3000

async function measure(browser: Browser, path: string) {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.route('**/*', (route) => {
    const request = route.request()
    const headers = request.headers()
    const isPrefetch =
      Boolean(headers['next-router-prefetch']) ||
      headers.rsc === '1' ||
      request.url().includes('_rsc=')

    return isPrefetch ? route.abort() : route.continue()
  })

  let bytes = 0
  const libraries = new Set<string>()

  page.on('response', async (response) => {
    const url = response.url()
    if (!url.includes('/_next/static') || !url.endsWith('.js')) return

    try {
      const body = await response.body()
      bytes += body.length
      if (body.length < SCAN_FLOOR_BYTES) return

      const text = body.toString('latin1')
      for (const [name, marker] of Object.entries(MARKERS)) {
        if (marker.test(text)) libraries.add(name)
      }
    } catch {
      // Served from cache with no retrievable body; nothing to weigh.
    }
  })

  await page.goto(path, { waitUntil: 'networkidle' })
  // Give post-hydration import() time to fire, so a library that should not
  // have loaded still shows up here.
  await page.waitForTimeout(1500)

  await context.close()
  return { kb: Math.round(bytes / 1024), libraries: [...libraries].sort() }
}

test.describe('per-route budget', () => {
  for (const route of ROUTES) {
    test(`${route.path} ships only what it opted into`, async ({ browser }) => {
      const { kb, libraries } = await measure(browser, route.path)

      const unexpected = libraries.filter((name) => !route.allow.includes(name))
      expect(
        unexpected,
        `${route.path} loaded ${unexpected.join(', ')} without opting in`
      ).toEqual([])

      expect(
        kb,
        `${route.path} is ${kb}KB, budget ${route.maxKb}KB`
      ).toBeLessThan(route.maxKb)
    })
  }
})
