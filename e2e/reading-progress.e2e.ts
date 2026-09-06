import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The reading progress hairline reports where the reader is.
 *
 * ## Why this is measured rather than trusted
 *
 * `vault/motion/reading-progress` has **two** implementations of one line: a
 * CSS `animation-timeline: scroll()` where the browser has it, and a
 * ScrollTrigger where it does not. Exactly one runs, decided at runtime by
 * `CSS.supports`, so a change to either can leave the other silently doing
 * nothing — the failure mode is a bar that never moves, which looks like a
 * design decision rather than a defect.
 *
 * This asserts the observable: nothing drawn at the top, the full width at the
 * bottom, on every route that carries it.
 *
 * ## And where it must not be
 *
 * Reduced motion removes it (`display: none`), and short pages never had it —
 * a progress bar on a page that is one scroll long is a decoration pretending
 * to be information.
 */

const LONG_READS = [
  '/en/journal/scope-is-the-deliverable',
  '/en/work/arus-balik',
  '/en/practice/consulting',
]

const SHORT = ['/en', '/en/journal', '/en/work']

const BAR = '[data-reading-progress-bar]'

async function scaleX(page: Page) {
  return page.evaluate((selector) => {
    const bar = document.querySelector(selector)
    if (!bar) return null
    const matrix = new DOMMatrixReadOnly(getComputedStyle(bar).transform)
    return Math.round(matrix.a * 1000) / 1000
  }, BAR)
}

test.describe('the reading progress reports the reading', () => {
  for (const path of LONG_READS) {
    test(`${path} draws nothing at the top and everything at the end`, async ({
      page,
    }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(700)

      expect(
        await page.locator(BAR).count(),
        'the page carries no progress bar at all'
      ).toBe(1)

      expect(
        await scaleX(page),
        'the bar is already drawn before anything has been read'
      ).toBeLessThan(0.02)

      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      )
      await page.waitForTimeout(900)

      expect(
        await scaleX(page),
        'the bar did not reach the end of the page — neither implementation drove it'
      ).toBeGreaterThan(0.98)
    })
  }

  /*
   * The path this browser would never take.
   *
   * Chromium has `animation-timeline`, so every run above exercises the CSS
   * implementation and the ScrollTrigger fallback — the one Safari readers
   * get — is dead code under test. That is the shape of bug that ships: a
   * fallback nobody ran.
   *
   * Two stubs, and both are needed. `CSS.supports` is stubbed before any page
   * script so the component installs the fallback; the `@supports` block still
   * matches in this browser, and a CSS animation outranks the inline style
   * GSAP writes, so the stylesheet has to be silenced too or the CSS path
   * would quietly satisfy the assertion.
   */
  test('the fallback drives it where the timeline is missing', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = CSS.supports.bind(CSS)
      CSS.supports = (...args: string[]) =>
        args.some((value) => String(value).includes('animation-timeline'))
          ? false
          : original(...(args as [string]))
    })

    await page.goto(LONG_READS[0] ?? '/en')
    await page.addStyleTag({
      content: '[data-reading-progress-bar]{animation:none !important}',
    })
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(700)

    expect(
      await scaleX(page),
      'the fallback drew the bar before anything was read'
    ).toBeLessThan(0.02)

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight)
    )
    await page.waitForTimeout(900)

    expect(
      await scaleX(page),
      'with the CSS timeline unavailable, nothing drove the bar — Safari would see a line that never moves'
    ).toBeGreaterThan(0.98)
  })

  test('it is a hairline, and never in the way', async ({ page }) => {
    await page.goto(LONG_READS[0] ?? '/en')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    const track = await page.evaluate(() => {
      const node = document.querySelector('[data-reading-progress]')
      if (!node) return null
      const { height, top } = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        height: Math.round(height),
        top: Math.round(top),
        pointerEvents: style.pointerEvents,
        hidden: node.getAttribute('aria-hidden'),
      }
    })

    expect(track, 'no track').not.toBeNull()
    if (!track) return

    // A hairline, not a band. Four pixels is already a stripe.
    expect(track.height, 'the track is thicker than a hairline').toBeLessThan(4)
    expect(track.pointerEvents, 'the track can swallow a click').toBe('none')
    // It reports; it does not announce. A `progressbar` role here would put a
    // decoration into the accessibility tree.
    expect(track.hidden).toBe('true')
  })

  test('reduced motion removes it', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      await page.goto(LONG_READS[0] ?? '/en')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(500)

      expect(
        await page.evaluate(
          () => matchMedia('(prefers-reduced-motion: reduce)').matches
        ),
        'reduced-motion emulation did not apply'
      ).toBe(true)

      expect(
        await page.evaluate(() => {
          const node = document.querySelector('[data-reading-progress]')
          return node ? getComputedStyle(node).display : 'absent'
        }),
        'the progress bar survived reduced motion'
      ).toBe('none')
    } finally {
      await context.close()
    }
  })

  for (const path of SHORT) {
    test(`${path} does not carry one`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      expect(
        await page.locator('[data-reading-progress]').count(),
        'a short page grew a progress bar'
      ).toBe(0)
    })
  }
})
