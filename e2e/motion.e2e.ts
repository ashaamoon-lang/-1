import type { Browser, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'
import { transitionName } from '../lib/motion/transition-name'
import { FEATURED_WORK } from './fixtures'

/**
 * Handles the in-page probes write to and this file reads back.
 *
 * Declared rather than asserted at each use: `globalThis as unknown as {…}`
 * twice over is the assertion chain the anti-slop rules reject, and rightly —
 * the shape is known here, so it belongs in a declaration where it is stated
 * once and checked everywhere.
 */
declare global {
  var __morph: {
    calls: number
    names: string[]
    pseudo: string[]
    durations: number[]
  }
  var __states: string[]
}

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

/**
 * Runs in the page: the `<main>` a reader is actually looking at.
 *
 * After a client-side Back this app has **two** `<main>` elements — measured
 * on `/en/work`: 2 mains, 2 grids, 8 reveal items where a fresh load has 1, 1
 * and 6, and it does not clear.
 *
 * ## It is not a defect, and the first version of this note said it was
 *
 * The second `<main>` is `display: none`, `0×0`. It is Next's cached
 * navigation tree — the previous route kept for an instant Back — and it is
 * in no accessibility tree, takes no tab stop, and paints nothing. I wrote it
 * up as a duplicate-landmark defect before measuring the box, which is the
 * same mistake this file's other notes describe, made on a framework
 * behaviour instead of on our own code.
 *
 * What it *does* break is a probe that queries the whole document: the two
 * items inside that hidden tree read as `opacity: 0` and get reported as
 * content stranded from the reader. So the probes ask for the rendered
 * `<main>` — the one with a box — rather than the first or last in document
 * order, which is a guess either way.
 */
declare global {
  /** Installed in the page by `installLiveRoot` below. */
  var live: () => ParentNode
}

async function installLiveRoot(page: Page) {
  await page.addInitScript(() => {
    globalThis.live = () => {
      for (const main of document.querySelectorAll('main')) {
        const box = main.getBoundingClientRect()
        if (box.width > 0 && box.height > 0) return main
      }
      return document
    }
  })
}

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

/**
 * Text pushed out of the mask it is supposed to rise into.
 *
 * `strandedItems` below reads `opacity`, and that is the whole reason this
 * exists as a second probe rather than a clause in the first. `TextReveal`
 * hides a line by translating it **down by its own height** inside a parent
 * with `overflow: clip` — the line stays at `opacity: 1` the entire time, and
 * an opacity check reports the page as clean while two thirds of the home
 * page's `<h1>` is invisible.
 *
 * Measured under `prefers-reduced-motion` before the fix: line 1 at
 * `matrix(1, 0, 0, 1, 0, 0)`, lines 2 and 3 at `matrix(1, 0, 0, 1, 0, 102)`
 * inside 102px masks — 0% of each visible. It had shipped since Tahap 11c.
 *
 * The measure is the fraction of the *mask* its child actually covers, not
 * whether the child is on screen: an element scrolled below the fold is fine,
 * an element parked outside its own clip is not.
 */
async function clippedOutOfView(page: Page) {
  return page.evaluate(() =>
    [...live().querySelectorAll('h1, h2, h3, p')]
      .flatMap((el) => [...el.querySelectorAll('*')])
      .filter((child) => {
        const parent = child.parentElement
        if (!parent) return false
        const overflow = getComputedStyle(parent).overflow
        if (overflow !== 'clip' && overflow !== 'hidden') return false

        const mask = parent.getBoundingClientRect()
        const inner = child.getBoundingClientRect()
        if (mask.height === 0) return false

        const covered =
          Math.max(
            0,
            Math.min(mask.bottom, inner.bottom) - Math.max(mask.top, inner.top)
          ) / mask.height
        return covered < 0.5
      })
      .map((el) => `"${(el.textContent ?? '').trim().slice(0, 24)}"`)
  )
}

async function strandedItems(page: Page) {
  return page.evaluate(() =>
    [...live().querySelectorAll('[data-reveal-item]')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => `${el.tagName}.${String(el.className).split(' ')[0]}`)
  )
}

test.describe('motion', () => {
  for (const path of ['/en', '/en/work', `/en/work/${FEATURED_WORK}`]) {
    test(`${path} strands no content invisible`, async ({ page }) => {
      await installLiveRoot(page)
      await installLiveRoot(page)
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
    await installLiveRoot(page)
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
      test(`/${locale} shows every line of the headline`, async ({
        browser,
      }) => {
        const { context, page } = await reducedMotionPage(browser, `/${locale}`)

        try {
          const heading = page.locator('h1')
          await expect(heading).toBeVisible()

          // The accessible name is the whole headline whether or not it was
          // split (`aria: 'auto'`), so this passes even while the page shows
          // one line of three. What a reader sees is the assertion below.
          const clipped = await clippedOutOfView(page)
          expect(
            clipped,
            `/${locale}: text parked outside its own mask: ${clipped.join(', ')}`
          ).toEqual([])
        } finally {
          await context.close()
        }
      })
    }

    for (const locale of routing.locales) {
      test(`/${locale}/work/arus-balik renders everything immediately`, async ({
        browser,
      }) => {
        const { context, page } = await reducedMotionPage(
          browser,
          `/${locale}/work/${FEATURED_WORK}`
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
        await page
          .locator(`a[href="/en/work/${FEATURED_WORK}"]`)
          .first()
          .click()
        await page.waitForURL(`**/work/${FEATURED_WORK}`)
        await expect(page.locator(OVERLAY)).toHaveCount(0)
      } finally {
        await context.close()
      }
    })
  })

  /*
   * Instruments `document.startViewTransition` and reports what the browser
   * actually built: the names it applied, the pseudo-elements it animated,
   * and how long the morph group ran.
   *
   * Every one of those is invisible after the fact — React removes
   * `view-transition-name` when the transition ends, so reading it afterwards
   * always says `none`. A test that checked the settled DOM would pass
   * whether or not a morph ever happened.
   */
  async function captureMorph(
    page: Page,
    from: string,
    to: string,
    /**
     * Run before the link is clicked.
     *
     * The practice pair's link lives inside a closed `<details>`, so it is not
     * clickable until the disclosure is opened — the same thing a reader does
     * before pressing it.
     */
    prepare?: (page: Page) => Promise<void>
  ) {
    await page.goto(from)
    await page.waitForTimeout(1500)
    if (prepare) await prepare(page)

    /*
     * The prefix is passed in rather than typed out inside the page.
     *
     * It used to be the literal `work-cover`, in four places here, while
     * `lib/motion/transition-name.ts` owned the real one — so renaming the
     * prefix would have left this gate looking for a name nothing emits, and
     * it would have reported "no morph pair formed" about a morph that was
     * working. That is the same drift the sitemap's `(?!discipline/)`
     * lookahead produced in Tahap 13. The page cannot import, so the value
     * crosses the boundary as an argument.
     */
    await page.evaluate((namePrefix: string) => {
      const record: typeof globalThis.__morph = {
        calls: 0,
        names: [],
        pseudo: [],
        durations: [],
      }
      globalThis.__morph = record

      const original = document.startViewTransition.bind(document)
      document.startViewTransition = (callback) => {
        record.calls += 1
        const transition = original(callback)
        const started = performance.now()
        const sample = () => {
          for (const element of document.querySelectorAll('*')) {
            const name = getComputedStyle(element).viewTransitionName
            if (name && name !== 'none') record.names.push(name)
          }
          for (const animation of document.getAnimations()) {
            const effect = animation.effect
            // `pseudoElement` is declared on KeyframeEffect, not on the
            // AnimationEffect base — and a view transition's animations are
            // always keyframe effects.
            const pseudo =
              effect instanceof KeyframeEffect ? effect.pseudoElement : null
            if (!pseudo) continue
            record.pseudo.push(pseudo)
            if (pseudo.includes(`group(${namePrefix}`)) {
              record.durations.push(
                Number(effect?.getComputedTiming().duration ?? 0)
              )
            }
          }
          if (performance.now() - started < 900) requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
        return transition
      }
    }, transitionName(''))

    await page.locator(`a[href="${to}"]`).first().click()
    await page.waitForURL(`**${to.replace(/^\/[a-z]{2}/, '')}`)
    await page.waitForTimeout(1800)

    return page.evaluate(() => {
      const record = globalThis.__morph
      return {
        calls: record.calls,
        names: [...new Set(record.names)],
        pseudo: [...new Set(record.pseudo)],
        durations: [...new Set(record.durations)],
      }
    })
  }

  test('a work card morphs into its project page', async ({ page }) => {
    const morph = await captureMorph(
      page,
      '/en/work',
      `/en/work/${FEATURED_WORK}`
    )

    expect(morph.calls, 'no view transition was started').toBeGreaterThan(0)
    expect(morph.names, 'the shared name was never applied').toContain(
      transitionName(FEATURED_WORK)
    )

    /*
     * The assertion that proves a *pair* formed rather than a lone element
     * crossfading. A `group` pseudo-element only exists when the browser
     * matched an old and a new element under the same name — which is the
     * difference between the cover moving and the cover being replaced.
     */
    const group = morph.pseudo.filter((p) =>
      p.includes(`view-transition-group(${transitionName(FEATURED_WORK)})`)
    )
    expect(
      group.length,
      `no morph pair formed; pseudo-elements seen: ${morph.pseudo.join(', ')}`
    ).toBeGreaterThan(0)

    for (const half of ['old', 'new']) {
      expect(
        morph.pseudo.some((p) =>
          p.includes(
            `view-transition-${half}(${transitionName(FEATURED_WORK)})`
          )
        ),
        `the ${half} half of the pair is missing`
      ).toBe(true)
    }
  })

  test('the same cover morphs from the home page, far down it', async ({
    page,
  }) => {
    /*
     * The case the catalogue test could not see, and the reason Tahap 15b
     * found a defect at all.
     *
     * `/en/work` puts its grid near the top, so a reader pressing a card there
     * carried a small scroll offset into the project page — small enough that
     * the destination cover was still inside the viewport, which is the only
     * condition under which React keeps a `view-transition-name` on the
     * entering half (`applyViewTransitionToHostInstancesRecursive` returns
     * whether any host instance is in view, and the caller strips the name
     * when it is not).
     *
     * The home page's featured grid sits about a thousand pixels down. With
     * `components/ui/link` still defaulting to `scroll={false}`, the project
     * page opened at that same offset, its cover 917px above the fold, and the
     * morph degraded to `::view-transition-old(...)` alone — no group, no new
     * half, no movement. Measured, not inferred.
     *
     * Same assertion as the catalogue test, from a place where it used to
     * fail.
     */
    const morph = await captureMorph(page, '/en', `/en/work/${FEATURED_WORK}`)

    expect(morph.calls, 'no view transition was started').toBeGreaterThan(0)

    const name = transitionName(FEATURED_WORK)
    expect(morph.names, 'the shared name was never applied').toContain(name)
    expect(
      morph.pseudo.filter((p) => p.includes(`view-transition-group(${name})`))
        .length,
      `no morph pair formed; pseudo-elements seen: ${morph.pseudo.join(', ')}`
    ).toBeGreaterThan(0)
    expect(
      morph.pseudo.some((p) => p.includes(`view-transition-new(${name})`)),
      'the entering half of the pair is missing — the destination was scrolled out of view'
    ).toBe(true)
  })

  test('the overlay stands aside for a morph', async ({ page }) => {
    /*
     * The two are mutually exclusive: a morph is only legible if the reader
     * can see both states, and the cover exists to stop them seeing either.
     * Without this the panel would sweep over the exact thing it is meant to
     * be revealing.
     */
    await installLiveRoot(page)
    await page.goto('/en/work')
    await page.waitForTimeout(800)

    await page.evaluate(() => {
      const seen: string[] = []
      globalThis.__states = seen
      const overlay = document.querySelector('[class*="page-transition"]')
      const started = performance.now()
      const tick = () => {
        const state = overlay?.getAttribute('data-state')
        if (state) seen.push(state)
        if (performance.now() - started < 2500) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    await page.locator(`a[href="/en/work/${FEATURED_WORK}"]`).first().click()
    await page.waitForURL(`**/${FEATURED_WORK}`)
    await page.waitForTimeout(1800)

    const states = await page.evaluate(() => [...new Set(globalThis.__states)])

    expect(
      states,
      `overlay animated during a morph: ${states.join(', ')}`
    ).toEqual(['idle'])
  })

  test('a practice name morphs into its own page', async ({ page }) => {
    /*
     * The second pair on the site, added in Tahap 15.
     *
     * `ui-ux-pro-max` is explicit that a navigation should morph one pair and
     * no more — "compounding Flips are hard to time correctly". So this
     * asserts a pair formed, exactly as the work-cover test does, rather than
     * asserting that several things moved.
     *
     * The name travelling is not the element pressed: the link sits in the
     * disclosure's panel, the `<h3>` above it carries the shared name. That is
     * the same arrangement as a work card, where the link is pressed and the
     * cover travels.
     */
    const morph = await captureMorph(
      page,
      '/en',
      '/en/practice/consulting',
      async (p) => {
        // Open the disclosure, then let its panel finish arriving so the link
        // is not still moving when it is clicked.
        await p.locator('#practice summary').first().click()
        await p.waitForTimeout(700)
      }
    )

    expect(morph.calls, 'no view transition was started').toBeGreaterThan(0)

    const name = transitionName('practice-consulting')
    expect(morph.names, 'the shared name was never applied').toContain(name)

    // A `group` pseudo-element exists only when the browser matched an old and
    // a new element under one name — the difference between the name moving
    // and the two screens crossfading.
    expect(
      morph.pseudo.filter((p) => p.includes(`view-transition-group(${name})`))
        .length,
      `no morph pair formed; pseudo-elements seen: ${morph.pseudo.join(', ')}`
    ).toBeGreaterThan(0)
  })

  test('a double click leaves nothing covering the page', async ({ page }) => {
    /*
     * `MOTION-SPEC.md` §9.4 rule 1: a moment must be interruptible with a
     * defined resolution.
     *
     * A double click announces two navigations. The first sets the overlay
     * covering and arms `maxWait`; the second re-arms it. If the route only
     * commits once — which is what happens, because the destination is the
     * same — the second announcement has no matching pathname change to
     * uncover it, and only the safety timer is left between the reader and a
     * blank screen. That is the shape of failure this asserts is impossible,
     * on the covered path rather than the morphed one.
     */
    await installLiveRoot(page)
    await page.goto('/en/work')
    await page.waitForTimeout(600)

    const overlay = page.locator(OVERLAY)
    await expect(overlay).toHaveAttribute('data-state', 'idle')

    const chip = page.locator('a[data-press="chip"]').nth(1)
    const href = await chip.getAttribute('href')
    await chip.dblclick()
    await page.waitForURL(`**${href}`)

    await expect(overlay).toHaveAttribute('data-state', 'idle', {
      timeout: 5000,
    })
    const parked = await overlay.evaluate(
      (el) => el.getBoundingClientRect().top >= window.innerHeight
    )
    expect(parked, 'overlay did not park after a double click').toBe(true)

    // And the destination is actually readable, which is the thing a stuck
    // overlay takes away.
    await expect(page.locator('main h1, main h2').first()).toBeVisible()
  })

  test('going back mid-transition strands nothing', async ({ page }) => {
    /*
     * The other half of rule 1, and the one `ui-ux-pro-max` rates `Severity:
     * High`: Back must work predictably.
     *
     * The overlay's two halves are driven by different things — the cover by a
     * click, the uncover by a `usePathname()` change — so Back pressed while
     * the reveal is still running is where they can come apart.
     *
     * ## Why it waits for the URL first
     *
     * The obvious version of this test clicked and went back 120ms later,
     * without waiting. That does not interrupt a transition, it interrupts a
     * *click*: the client-side navigation has not committed at 120ms, so
     * `goBack()` steps past the page under test to `about:blank` and the
     * assertions run against an empty document. Measured — url after click
     * `/en/work`, url after back `about:blank`, zero `<h1>`.
     *
     * Waiting for the destination and going back immediately is the real
     * interruption: the route has committed, the reveal is still in flight.
     */
    await installLiveRoot(page)
    await page.goto('/en/work')
    await page.waitForTimeout(600)

    const overlay = page.locator(OVERLAY)
    const chip = page.locator('a[data-press="chip"]').nth(1)
    const href = await chip.getAttribute('href')

    await chip.click()
    await page.waitForURL(`**${href}`)
    await page.goBack()
    await page.waitForURL('**/en/work')
    await page.waitForTimeout(900)

    await expect(overlay).toHaveAttribute('data-state', 'idle', {
      timeout: 5000,
    })
    const parked = await overlay.evaluate(
      (el) => el.getBoundingClientRect().top >= window.innerHeight
    )
    expect(parked, 'overlay did not park after going back').toBe(true)

    await expect(page.locator('h1').first()).toBeVisible()
    expect(
      await strandedItems(page),
      'going back left content at opacity 0'
    ).toEqual([])
    expect(
      await clippedOutOfView(page),
      'going back left text outside its mask'
    ).toEqual([])
  })

  test('the route-change overlay covers, then always uncovers', async ({
    page,
  }) => {
    await installLiveRoot(page)
    await page.goto('/en')
    await page.waitForTimeout(800)

    const overlay = page.locator(OVERLAY)
    await expect(overlay).toHaveAttribute('data-state', 'idle')

    await page.locator(`a[href="/en/work/${FEATURED_WORK}"]`).first().click()
    await page.waitForURL(`**/work/${FEATURED_WORK}`)

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
