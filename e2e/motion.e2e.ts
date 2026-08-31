import type { Browser, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'

/**
 * The site animates, and every animation ends somewhere legible.
 *
 * ## What this is guarding
 *
 * `CLAUDE.md` hard rule #5: `prefers-reduced-motion` is mandatory, and under
 * it content must end **fully visible** — never stranded at `opacity: 0`
 * because an animation was skipped. That is the failure this project set out
 * to avoid from the start, and until now nothing checked it: axe does not
 * look at opacity, and the no-JavaScript gate passes precisely because the
 * reveal CSS is scoped under an attribute JavaScript sets.
 *
 * The second half is the opposite risk, and it is the one that actually bit.
 * `vault/motion/page-transition` was written to cover the viewport and
 * uncover it, and shipped with two bugs — it ran from a `usePathname()`
 * change, which is the moment the *new* route has already rendered, and it
 * needed GSAP on routes that do not load GSAP. Neither was noticed because
 * the component was never mounted (`docs/stages/TAHAP-11.md` §2.4). An
 * overlay that covers and never uncovers is a blank screen, so its terminal
 * state is asserted here rather than assumed.
 */

const OVERLAY = '[class*="page-transition"]'

/** Walks the page so every IntersectionObserver has fired. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  })
  await page.waitForTimeout(1200)
}

async function strandedItems(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal-item]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => `${el.tagName}.${String(el.className).split(' ')[0]}`)
  )
}

test.describe('motion', () => {
  for (const path of ['/en', '/en/work', '/en/work/rimbun']) {
    test(`${path} strands no content invisible`, async ({ page }) => {
      await page.goto(path)

      const total = await page.locator('[data-reveal-item]').count()
      // A page with no reveals would pass this vacuously, and two of these
      // three routes had exactly that until Tahap 11c.
      expect(total, `${path} animates nothing`).toBeGreaterThan(0)

      await scrollThrough(page)

      expect(
        await strandedItems(page),
        `${path} left content at opacity 0`
      ).toEqual([])
    })
  }

  /*
   * Reduced motion is emulated by creating the context explicitly rather than
   * with `test.use({ reducedMotion: 'reduce' })`.
   *
   * The fixture form was tried first and silently did not apply — the tests
   * failed reporting stranded content, which is a symptom of the *page*, on a
   * page that was in fact behaving correctly. It cost a round of debugging
   * pointed at the wrong file. `no-javascript.e2e.ts` already builds its
   * contexts by hand for the same class of emulation, so this matches the
   * suite rather than inventing a second way.
   *
   * Each test still asserts the emulation took, so a future regression here
   * fails on the cause and not on a downstream symptom.
   */
  async function reducedMotionPage(browser: Browser, path: string) {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(path)

    expect(
      await page.evaluate(
        () => matchMedia('(prefers-reduced-motion: reduce)').matches
      ),
      'reduced-motion emulation did not apply'
    ).toBe(true)

    return { context, page }
  }

  test.describe('under prefers-reduced-motion', () => {
    for (const locale of routing.locales) {
      test(`/${locale}/work/rimbun renders everything immediately`, async ({
        browser,
      }) => {
        const { context, page } = await reducedMotionPage(
          browser,
          `/${locale}/work/rimbun`
        )
        try {
          // No scrolling: under the preference the hook reveals on mount and
          // never observes, so content below the fold is already visible.
          await page.waitForTimeout(600)

          expect(
            await strandedItems(page),
            'reduced motion left content at opacity 0'
          ).toEqual([])
        } finally {
          await context.close()
        }
      })
    }

    test('the route-change overlay never becomes visible', async ({
      browser,
    }) => {
      const { context, page } = await reducedMotionPage(browser, '/en')
      try {
        /*
         * Not "is never rendered", which is what this asserted first and what
         * the component's own doc claims. Measured: the overlay *is* in the
         * server-rendered HTML even for a reader who has asked for no motion,
         * and disappears on hydration.
         *
         * It cannot be otherwise. `usePreferredReducedMotion` reads a media
         * query, and the server has no media to query — its snapshot has to
         * be one value, and rendering the overlay is the one that does not
         * flash it in for everyone else. So the markup exists for the length
         * of a hydration.
         *
         * That is why `page-transition.module.css` carries a
         * `@media (--reduced-motion) { display: none }` rule it calls belt and
         * braces: it is the only thing covering that window, and it turns out
         * to be load-bearing rather than defensive. What matters to a reader
         * is that the panel is never visible, so that is what is asserted.
         */
        await expect(page.locator(OVERLAY)).toBeHidden()

        // Once hydrated the component removes itself entirely.
        await expect(page.locator(OVERLAY)).toHaveCount(0, { timeout: 5000 })

        // And navigation still works without it — the overlay is decoration,
        // never a step in the journey.
        await page.locator('a[href="/en/work/panas-sore"]').first().click()
        await page.waitForURL('**/work/panas-sore')
        await expect(page.locator(OVERLAY)).toHaveCount(0)
      } finally {
        await context.close()
      }
    })
  })

  test('the route-change overlay covers, then always uncovers', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForTimeout(800)

    const overlay = page.locator(OVERLAY)
    await expect(overlay).toHaveAttribute('data-state', 'idle')

    await page.locator('a[href="/en/work/panas-sore"]').first().click()
    await page.waitForURL('**/work/panas-sore')

    // The terminal state is the assertion. Whatever happens in between — a
    // fast prefetched route, a slow one, an interrupted cover — the panel has
    // to end parked off-screen, or the reader is looking at a blank page.
    await expect(overlay).toHaveAttribute('data-state', 'idle', {
      timeout: 5000,
    })

    const parked = await overlay.evaluate(
      (el) => el.getBoundingClientRect().top >= window.innerHeight
    )
    expect(parked, 'overlay did not park below the viewport').toBe(true)
  })
})
