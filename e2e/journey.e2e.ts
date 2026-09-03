import type { ConsoleMessage, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'

declare global {
  /** Overlay states sampled inside the page by the probes below. */
  var __states: string[]
}

/**
 * The site as one reader moving through it, rather than as a set of pages.
 *
 * ## The class of defect this exists for
 *
 * Every other gate in this repository opens a page with `page.goto` — which
 * always starts at scroll zero, alone, with no history behind it. Nothing has
 * ever tested a reader who *moves*. That is precisely how Tahap 15b's landing
 * defect survived sixteen stages of green gates: every internal navigation
 * carried the previous page's scroll offset, and no gate could see it because
 * no gate ever performed a second navigation.
 *
 * `e2e/navigation-landing.e2e.ts` covers one hop. This covers a sequence, and
 * asserts the invariants that only a sequence can break:
 *
 *   - state that leaks from one navigation into the next (a stranded overlay,
 *     a `view-transition-name` never cleaned up);
 *   - the browser's own history behaviour, which no single-hop test touches;
 *   - whether the sixth navigation still behaves like the first.
 *
 * ## What this cannot catch
 *
 * It samples resting states between hops, not the frames inside them —
 * `e2e/motion.e2e.ts` owns what happens during a transition. And it walks one
 * path; a different order could still surface something this one does not.
 */

/** Long enough for the transition, the reveal, and any scroll to settle. */
const SETTLED = 2200

interface Resting {
  url: string
  y: number
  title: string
  heading: string | null
  headingTop: number | null
  viewport: number
  overlay: string | null
  /** Elements still carrying an inline `view-transition-name` after settling. */
  leakedNames: string[]
}

async function resting(page: Page): Promise<Resting> {
  await page.waitForTimeout(SETTLED)
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const rect = h1?.getBoundingClientRect()
    const leaked: string[] = []
    for (const el of document.querySelectorAll<HTMLElement>('[style]')) {
      if (el.style.viewTransitionName)
        leaked.push(`${el.tagName}=${el.style.viewTransitionName}`)
    }
    return {
      url: location.pathname,
      y: Math.round(window.scrollY),
      title: document.title,
      heading: h1?.textContent?.trim() ?? null,
      headingTop: rect ? Math.round(rect.top) : null,
      viewport: window.innerHeight,
      overlay:
        document
          .querySelector('[class*="page-transition"]')
          ?.getAttribute('data-state') ?? null,
      leakedNames: leaked,
    }
  })
}

/**
 * The invariants that must hold after **every** hop, forward or back.
 *
 * A stranded overlay is the worst of them: the panel is `aria-hidden` and
 * covers the viewport, so a reader who meets one cannot read the page and
 * cannot dismiss it either.
 */
function assertSettled(state: Resting, hop: string) {
  expect(
    state.overlay,
    `${hop}: the route overlay was left at "${state.overlay}" instead of idle`
  ).not.toBe('covering')
  expect(
    state.overlay,
    `${hop}: the route overlay was left at "${state.overlay}" instead of idle`
  ).not.toBe('revealing')

  // React applies these for the duration of a transition and removes them
  // after. One left behind is claimed by the *next* navigation's pairing,
  // which is how a morph starts animating the wrong element.
  expect(
    state.leakedNames,
    `${hop}: view-transition-name left on the page: ${state.leakedNames.join(', ')}`
  ).toEqual([])
}

/** A forward hop opens the destination at its top. */
function assertOpenedAtTop(state: Resting, hop: string) {
  expect(
    state.y,
    `${hop}: kept the previous page's scroll offset — landed ${state.y}px down`
  ).toBe(0)
  expect(
    state.headingTop ?? -1,
    `${hop}: heading "${state.heading}" was outside the viewport at ${state.headingTop}px`
  ).toBeGreaterThanOrEqual(0)
  expect(
    state.headingTop ?? Number.POSITIVE_INFINITY,
    `${hop}: heading was below the fold at ${state.headingTop}px`
  ).toBeLessThan(state.viewport)
}

/** Console errors are collected across the whole journey, not per page. */
function collectErrors(page: Page) {
  const errors: string[] = []
  const onConsole = (m: ConsoleMessage) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200))
  }
  page.on('console', onConsole)
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

/**
 * Every console error is fatal to this gate, and that took a fix to be true.
 *
 * Until Tahap 16c this file carried an allowlist for Next's
 * `instant-shell-url-data` diagnostic, which fired on both dynamic routes.
 * `docs/stages/TAHAP-16.md` §7 measured the two ways out, and the routes now
 * declare `export const instant = false` — the truthful one, since everything
 * on them depends on `params`. Measured after: **zero** url-data errors across
 * eight routes in both languages, so the allowlist went with it.
 *
 * Keeping an allowlist that no longer excludes anything is how a gate quietly
 * stops being able to fail.
 */

test.describe('a reader moving through the site', () => {
  test('seven hops leave nothing behind', async ({ page }) => {
    const errors = collectErrors(page)
    const [first, second] = PRACTICES

    // Hop 0 — arrival. Everything after this is client-side.
    await page.goto('/en')
    const arrival = await resting(page)
    expect(arrival.y, 'a fresh load should start at the top').toBe(0)
    assertSettled(arrival, 'arrival')

    // Hop 1 — home to a practice, from a disclosure far down the page. This is
    // the exact navigation Tahap 15b measured landing at 1522.
    await page.locator('#practice summary').first().click()
    await page.waitForTimeout(700)
    await page.locator(`a[href="/en/practice/${first}"]`).first().click()
    await page.waitForURL(`**/practice/${first}`)
    const hop1 = await resting(page)
    assertOpenedAtTop(hop1, 'hop 1 home → practice')
    assertSettled(hop1, 'hop 1')
    expect(hop1.title, 'hop 1 did not change the document title').not.toBe(
      arrival.title
    )

    // Hop 2 — practice to the next practice. Same component on both ends,
    // which is where a leaked transition name would do the most damage.
    await page.locator(`a[href="/en/practice/${second}"]`).first().click()
    await page.waitForURL(`**/practice/${second}`)
    const hop2 = await resting(page)
    assertOpenedAtTop(hop2, 'hop 2 practice → next practice')
    assertSettled(hop2, 'hop 2')
    expect(hop2.title, 'hop 2 did not change the document title').not.toBe(
      hop1.title
    )

    // Hop 3 — back. The reader is returning to something they have seen, so
    // the browser's restored position is the correct one, not the top.
    await page.goBack()
    await page.waitForURL(`**/practice/${first}`)
    const hop3 = await resting(page)
    assertSettled(hop3, 'hop 3 back')
    expect(hop3.title, 'back did not restore the document title').toBe(
      hop1.title
    )

    // Hop 4 — back again, to the home page, where the reader had scrolled a
    // long way down. Losing that position is the defect this hop watches.
    await page.goBack()
    await page.waitForURL('**/en')
    const hop4 = await resting(page)
    assertSettled(hop4, 'hop 4 back to home')
    expect(
      hop4.y,
      'back to the home page did not restore the reader position'
    ).toBeGreaterThan(0)

    // Hop 5 — forward through history rather than through a link.
    await page.goForward()
    await page.waitForURL(`**/practice/${first}`)
    const hop5 = await resting(page)
    assertSettled(hop5, 'hop 5 forward')

    // Hop 6 — the same navigation as hop 2, six hops later. If any state
    // leaked along the way, this is where it shows: same assertions, and they
    // have to pass identically.
    await page.locator(`a[href="/en/practice/${second}"]`).first().click()
    await page.waitForURL(`**/practice/${second}`)
    const hop6 = await resting(page)
    assertOpenedAtTop(hop6, 'hop 6 (repeat of hop 2)')
    assertSettled(hop6, 'hop 6')
    expect(hop6.y, 'the sixth navigation did not behave like the second').toBe(
      hop2.y
    )
    expect(hop6.headingTop, 'the sixth navigation landed differently').toBe(
      hop2.headingTop
    )

    expect(
      errors,
      `console errors during the journey: ${errors.join(' | ')}`
    ).toEqual([])
  })

  test('a history navigation is dressed, and faster than a link', async ({
    page,
  }) => {
    /*
     * `docs/stages/TAHAP-16.md` §5.
     *
     * Measured before this gate existed: pressing a link runs a transition —
     * the cover overlay, or a morph for the two pairs that share a name — and
     * pressing **back runs nothing at all**. Not a decision anyone made:
     * `announceNavigation()` is only reached from a `<Link>`'s `onNavigate`,
     * and the back button presses no link. The reader gets choreography going
     * one way and a jump-cut coming the other.
     *
     * The database has no row on whether a back navigation should move
     * (spec §2.4). The one row that applies governs its timing: *"exit should
     * always resolve faster than entrance … so back/forward feels snappy"*.
     * So this asserts both halves — that it moves, and that it is marked as
     * the quicker treatment.
     */
    const [first, second] = PRACTICES

    await page.goto(`/en/practice/${first}`)
    await page.waitForTimeout(1500)
    await page.locator(`a[href="/en/practice/${second}"]`).first().click()
    await page.waitForURL(`**/practice/${second}`)
    await page.waitForTimeout(1800)

    await page.evaluate(() => {
      const seen: string[] = []
      globalThis.__states = seen
      const overlay = document.querySelector('[class*="page-transition"]')
      const started = performance.now()
      const tick = () => {
        const state = overlay?.getAttribute('data-state')
        const direction = overlay?.getAttribute('data-source')
        if (state) seen.push(`${state}:${direction ?? 'none'}`)
        if (performance.now() - started < 2000) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    await page.goBack()
    await page.waitForURL(`**/practice/${first}`)
    await page.waitForTimeout(2200)

    const states = await page.evaluate(() => [...new Set(globalThis.__states)])

    expect(
      states.some((s) => s.startsWith('covering')),
      `a back navigation ran no transition at all; overlay states seen: ${states.join(', ')}`
    ).toBe(true)

    // Marked as a history navigation, which is what the stylesheet keys the
    // shorter durations off. Without the mark the overlay would run at the
    // link timing and the asymmetry the skill asks for would be lost.
    expect(
      states.some((s) => s.endsWith(':history')),
      `the overlay did not mark the navigation as history-driven: ${states.join(', ')}`
    ).toBe(true)

    // And it must still land clean — the same invariant every other hop has.
    assertSettled(await resting(page), 'after a history navigation')
  })

  test('reduced motion leaves a history navigation an instant cut', async ({
    browser,
  }) => {
    /*
     * `CLAUDE.md` #5 and `MOTION-SPEC.md` §9.4 rule 3: the preference changes
     * the duration, never the outcome. `PageTransition` renders `null` under
     * it, so 16a's new signal must reach nobody — announced into a room with
     * no listeners rather than suppressed at the source, which is what keeps
     * the two halves independent.
     *
     * Checked rather than assumed, because "the component returns null" is a
     * claim about code and this is a claim about what a reader gets.
     */
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      const [first, second] = PRACTICES
      await page.goto(`/en/practice/${first}`)
      await page.waitForTimeout(1200)
      await page.locator(`a[href="/en/practice/${second}"]`).first().click()
      await page.waitForURL(`**/practice/${second}`)
      await page.waitForTimeout(1200)
      await page.goBack()
      await page.waitForURL(`**/practice/${first}`)
      await page.waitForTimeout(1500)

      const after = await page.evaluate(() => ({
        overlay: document.querySelector('[class*="page-transition"]') !== null,
        heading: document.querySelector('h1')?.textContent?.trim() ?? null,
        // The rule that matters most under this preference: nothing may be
        // left invisible because an animation was skipped.
        hidden: [
          ...document.querySelectorAll<HTMLElement>('[data-reveal-item]'),
        ].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
      }))

      expect(
        after.overlay,
        'the route overlay was rendered under prefers-reduced-motion'
      ).toBe(false)
      expect(after.heading, 'the destination did not render').not.toBeNull()
      expect(
        after.hidden,
        `${after.hidden} revealed items were left invisible after a reduced-motion history navigation`
      ).toBe(0)
    } finally {
      await context.close()
    }
  })

  test('an in-page anchor is not dressed as a route change', async ({
    page,
  }) => {
    /*
     * `docs/stages/TAHAP-16.md` §10.1. A hash press is not a page change, and
     * an overlay sweeping across because the reader jumped to a section on the
     * page they are already reading is worse than no overlay at all.
     *
     * This holds trivially today — nothing listens for `popstate` yet — which
     * is exactly why it is written now: 16a adds that listener, and this is
     * what stops it from claiming a hash press.
     */
    await page.goto('/en')
    await page.waitForTimeout(1500)

    await page.evaluate(() => {
      const seen: string[] = []
      globalThis.__states = seen
      const overlay = document.querySelector('[class*="page-transition"]')
      const started = performance.now()
      const tick = () => {
        const state = overlay?.getAttribute('data-state')
        if (state) seen.push(state)
        if (performance.now() - started < 2000) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    /*
     * `:visible`, and that is not defensive noise. At 390px the header's
     * section anchors are collapsed behind the menu — measured as `0x0`, four
     * of them — while the hero's own call to action stays pressable at
     * 146x42. Taking `.first()` of a plain selector picks a hidden header link
     * and the press times out, which is a test failing on its own selector
     * rather than on the product. This presses the anchor a reader can
     * actually reach at whichever width the test is running.
     */
    await page
      .locator('a[href="#work"]:visible, a[href="#contact"]:visible')
      .first()
      .click()
    await page.waitForTimeout(2200)

    const states = await page.evaluate(() => [...new Set(globalThis.__states)])
    expect(
      states,
      `the overlay ran for an in-page anchor: ${states.join(', ')}`
    ).toEqual(['idle'])
  })
})
