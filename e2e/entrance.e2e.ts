import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The entrance — Tahap 48.
 *
 * ## What this file is defending against
 *
 * A curtain is the one piece of this site that sits **on top of the content
 * the reader came for**. Every other decision here can be wrong and still
 * leave a usable page; this one, wrong, leaves a black rectangle and nothing
 * else. So the assertions are written against the failure, not the feature.
 *
 * The rejection that produced it is on the record: the earlier plan refused a
 * preloader because it *"delays content for the sake of a loading
 * animation"*. That objection is correct and still binding. What this gate
 * holds is the difference between a preloader and a curtain — the content is
 * already rendered behind it, and it leaves on a hard ceiling whether or not
 * anything succeeded.
 *
 * ## The LCP assertion is a measurement, not an estimate
 *
 * `CLAUDE.md` #19 forbids claiming a performance number nobody measured.
 * `PerformanceObserver` inside the Chromium that Playwright drives **is** a
 * measurement — the browser's own largest-contentful-paint entry, in a
 * production build. The baseline in `docs/stages/TAHAP-48.md` §5 was taken
 * the same way on the commit before the curtain existed.
 *
 * The ceiling is generous on purpose. A CI container's absolute timings move
 * with load, so a tight bound would fail for reasons that have nothing to do
 * with the curtain. What it catches is the failure that matters: an entrance
 * that pushes LCP into a different order of magnitude, which is what happens
 * if the overlay ever ends up gating the content's paint rather than sitting
 * over it.
 */

/** The panel must be off the viewport by here — see TAHAP-48 §3. */
const CEILING_MS = 1200

/**
 * Any LCP past this is the failure mode: content that paints only once the
 * curtain is gone. The baseline medians are 156-272ms on this machine, so
 * this is roughly an order of magnitude of headroom, deliberately.
 */
const LCP_CEILING_MS = 2500

/** Read the browser's own LCP entry for the page as loaded. */
async function largestContentfulPaint(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const settled = performance.getEntriesByType('largest-contentful-paint')
        const last = settled[settled.length - 1]
        if (last) return resolve(last.startTime)

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const entry = entries[entries.length - 1]
          if (entry) resolve(entry.startTime)
        })
        observer.observe({
          type: 'largest-contentful-paint',
          buffered: true,
        })
        // Anti-hang, not a result: -1 fails the assertion rather than
        // passing it, so a page that never reports LCP is a failure and not
        // a silent skip.
        setTimeout(() => resolve(-1), 5000)
      })
  )
}

test.describe('the entrance never becomes the obstacle', () => {
  test('without JavaScript nothing covers the headline', async ({
    browser,
  }) => {
    /*
     * The most expensive possible failure of this feature, so it is the
     * first test in the file.
     *
     * A curtain lifted by JavaScript, in a browser with JavaScript off, is a
     * page that never appears. `components/ui/command` already solved the
     * same problem for the search trigger with `<noscript><style>`, and this
     * asserts the curtain took that lesson rather than rediscovering it.
     */
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en')

    const headline = page.locator('h1').first()
    await expect(headline).toBeVisible()

    const box = await headline.boundingBox()
    expect(box, 'the headline has no box to test against').not.toBeNull()

    const covering = await page.evaluate(
      ({ x, y }) => {
        const stack = document.elementsFromPoint(x, y)
        const heading = stack.findIndex((el) => el.tagName === 'H1')
        // Everything painted above the headline at its own centre point.
        return stack
          .slice(0, heading === -1 ? stack.length : heading)
          .filter((el) => {
            const style = getComputedStyle(el)
            return (
              style.display !== 'contents' &&
              style.pointerEvents !== 'none' &&
              Number(style.opacity) > 0
            )
          })
          .map((el) => el.tagName + (el.className ? `.${el.className}` : ''))
      },
      { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + 8 }
    )

    expect(
      covering,
      'something is painted over the headline with JavaScript off'
    ).toEqual([])

    await context.close()
  })

  test('reduced motion leaves no curtain visible', async ({ browser }) => {
    /*
     * "Not visible", not "not in the DOM", and the difference is recorded
     * rather than glossed — `docs/stages/TAHAP-48.md` §2.2.
     *
     * The motion preference is not in the request, so the server cannot know
     * it. Deciding after hydration would flash the curtain at exactly the
     * reader who asked for no motion, which is worse than the thing being
     * avoided. So the node ships and CSS never paints it.
     */
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/en')

    const curtain = page.locator('[data-curtain]')
    const count = await curtain.count()

    // Anti-vacuum: if the curtain is gone from the markup entirely this test
    // would pass while measuring nothing, so say which case we are in.
    expect(count, 'no curtain element to check at all').toBeGreaterThan(0)
    await expect(curtain.first()).toBeHidden()

    await context.close()
  })

  test('the curtain leaves the viewport inside the ceiling', async ({
    page,
  }) => {
    await page.goto('/en')

    const curtain = page.locator('[data-curtain]')
    expect(await curtain.count(), 'no curtain element to time').toBeGreaterThan(
      0
    )

    const gone = await page.evaluate(
      (ceiling) =>
        new Promise<number>((resolve) => {
          const started = performance.now()
          const el = document.querySelector('[data-curtain]')
          if (!el) return resolve(-1)

          const check = () => {
            const rect = el.getBoundingClientRect()
            const style = getComputedStyle(el)
            const clear =
              rect.bottom <= 0 ||
              style.display === 'none' ||
              style.visibility === 'hidden'
            if (clear) return resolve(performance.now() - started)
            if (performance.now() - started > ceiling + 1000) {
              return resolve(performance.now() - started)
            }
            requestAnimationFrame(check)
          }
          check()
        }),
      CEILING_MS
    )

    expect(gone, 'the curtain never cleared the viewport').toBeGreaterThan(-1)
    expect(
      gone,
      `the curtain held the viewport for ${Math.round(gone)}ms`
    ).toBeLessThanOrEqual(CEILING_MS)
  })

  test('the content still paints early, measured not assumed', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'load' })
    const lcp = await largestContentfulPaint(page)

    expect(lcp, 'the browser reported no LCP entry').toBeGreaterThan(0)
    expect(
      lcp,
      `LCP ${Math.round(lcp)}ms — the entrance is gating the paint rather than sitting over it`
    ).toBeLessThan(LCP_CEILING_MS)
  })

  test('the curtain and the route overlay are never both on screen', async ({
    page,
  }) => {
    /*
     * Two full-viewport panels animating past each other is the cheapest way
     * to make a considered entrance look broken. They are meant to be
     * mutually exclusive by construction — the curtain is first-load only,
     * the overlay is navigation only — and this is what makes that a fact
     * rather than an intention.
     */
    await page.goto('/en')
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-curtain]')
      return !el || el.getBoundingClientRect().bottom <= 0
    })

    const link = page.getByRole('link', { name: /work/i }).first()
    await link.click()

    const overlapped = await page.evaluate(() => {
      const visible = (selector: string) => {
        const el = document.querySelector(selector)
        if (!el) return false
        const rect = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        return (
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          style.display !== 'none' &&
          Number(style.opacity) > 0
        )
      }
      return visible('[data-curtain]') && visible('[data-page-transition]')
    })

    expect(
      overlapped,
      'the curtain reappeared during a client-side navigation'
    ).toBe(false)
  })
})
