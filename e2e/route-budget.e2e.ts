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
 */

/** Byte totals are uncompressed response bodies, not transfer size. */
const ROUTES: { path: string; allow: string[]; maxKb: number }[] = [
  // The only page with a scene, and the only one that animates.
  { path: '/en', allow: ['three', 'gsap'], maxKb: 2100 },
  { path: '/en/work', allow: [], maxKb: 900 },
  { path: '/en/work/arus-balik', allow: [], maxKb: 900 },
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
