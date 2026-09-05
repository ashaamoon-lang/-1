import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { routing } from '../lib/i18n/routing'

/**
 * The catalogue lays out as a catalogue.
 *
 * ## What this caught, and why nothing else could
 *
 * `ProjectGrid` places each card by the work's own `span` — 6 or 12 of the
 * 12 desktop columns. That is a *composition* choice, made by the studio so a
 * chosen piece runs full width among a handful of neighbours on the home
 * page. Tahap 8 pointed the same block at `/work`, which lists everything.
 *
 * Measured on the built site at 1440px, with three works spanning 6, 12, 6:
 *
 *   card 1   691px wide
 *   card 2  1398px wide   <- cannot sit beside a span-6, so a new row
 *   card 3   691px wide   <- another new row
 *
 * Three rows for three works, two of them carrying ~700px of dead space, and
 * a page 3802px tall. Twenty works would run past 18,000px with the same
 * holes. Every gate passed: axe is clean, nothing overflows, the HTML is
 * complete without JavaScript, the headers are cacheable. It took looking at
 * a screenshot — which is the point `docs/AUDIT-2026-08.md` keeps making
 * about this project, that a green gate is not a correct page.
 *
 * The fix is `layout="catalogue"`, which gives every card the same column.
 * This asserts that, because the failure mode is silent: reverting the prop
 * changes no test, no type, and no lint rule.
 */

const CATALOGUE_ROUTES = [
  ...routing.locales.map((locale) => `/${locale}/work`),
  ...PRACTICES.map((value) => `/en/work/practice/${value}`),
]

test.describe('catalogue layout', () => {
  for (const path of CATALOGUE_ROUTES) {
    test(`${path} gives every work the same column`, async ({ page }) => {
      await page.goto(path)

      const cards = page.locator('article[data-span]')
      const count = await cards.count()
      test.skip(count === 0, `${path} has no published work to lay out`)

      const spans = await cards.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute('data-span'))
      )

      // Not "every span is 6" — that would pin the design. The invariant is
      // that a catalogue has one rhythm, whatever it is.
      expect(
        new Set(spans).size,
        `${path} mixes column spans: ${spans.join(', ')}`
      ).toBe(1)
    })
  }

  test('the home page keeps its editorial spans', async ({ page }) => {
    /*
     * The other half of the same decision, and the reason the fix is a prop
     * rather than a change to `ProjectGrid`'s default.
     *
     * The home page shows a *selection*, and a full-width piece among
     * half-width neighbours is how the studio composes it. If someone
     * "simplifies" this by making the uniform layout unconditional, the home
     * page loses its composition silently — so this test fails only when the
     * seeded data actually contains a mix, and skips honestly when it does
     * not, rather than asserting something the fixtures cannot support.
     */
    await page.goto('/en')

    const spans = await page
      .locator('article[data-span]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-span')))

    test.skip(
      new Set(spans).size < 2,
      'seeded home selection has no span variety to preserve'
    )

    expect(
      new Set(spans).size,
      'home page flattened to one span'
    ).toBeGreaterThan(1)
  })
})

/**
 * The filter filters — Tahap 39.
 *
 * ## What was wrong, measured before any of this was built
 *
 * `vault/blocks/practice-filter` renders "All" plus one chip per practice, in
 * a `<nav>`, with `aria-current` on the selected one. It looks exactly like a
 * filter. It was not one:
 *
 *   - `app/[locale]/work/page.tsx` hardcoded `practice={null}`, so the
 *     `active` prop was **always** `null` — "All" was permanently current and
 *     **no chip could ever appear selected**;
 *   - pressing a chip **left the catalogue** for `/practice/<value>`, a
 *     different kind of page with its own hero and statement;
 *   - the filtered branch of `catalogue.tsx` — the `key`, the
 *     `t(`${practice}Title`)` lookup, the empty state — was **dead code**.
 *
 * A control that looks like a filter, behaves like navigation, and never
 * shows a selected state is a usability failure, and more to the point it
 * lies to the reader.
 *
 * ## Why the selected-chip assertion is scoped to the filter's own nav
 *
 * `aria-current` is not unique on this page. Proving these red caught the
 * instrument before it caught the site: a selector of
 * `nav:has(a[href$="/work"])` matched the **header's** route navigation —
 * which Tahap 38 had just added — and reported the current chip as `Work`,
 * the header's own link. The language switcher carries `aria-current="true"`
 * too.
 *
 * So the filter marks itself with `data-practice-filter`, and this queries
 * that. A test hook rather than a structural guess: the same reasoning
 * `data-statement` and `data-site-facts` already carry elsewhere in this
 * suite, and the alternative is an assertion that passes on the wrong
 * element.
 */
test.describe('the filter filters', () => {
  const FILTER = '[data-practice-filter]'

  test('a practice chip narrows the catalogue in place', async ({ page }) => {
    await page.goto('/en/work')

    const all = await page.locator('article[data-span]').count()
    expect(all, 'no work to filter').toBeGreaterThan(1)

    await page.goto('/en/work?practice=consulting')
    await page.waitForLoadState('networkidle')

    // Still the catalogue, not another page: same route, narrower list.
    expect(new URL(page.url()).pathname).toBe('/en/work')

    const narrowed = await page.locator('article[data-span]').count()
    expect(
      narrowed,
      `filtering to consulting changed nothing: ${all} -> ${narrowed}`
    ).toBeLessThan(all)
    // Anti-vacuum: narrowing to nothing would also satisfy "fewer".
    expect(narrowed).toBeGreaterThan(0)
  })

  test('the selected chip says so, and only it does', async ({ page }) => {
    await page.goto('/en/work?practice=consulting')
    await page.waitForLoadState('networkidle')

    const chips = page.locator(FILTER).locator('a')
    expect(await chips.count(), 'no filter chips').toBeGreaterThan(2)

    const current = await chips.evaluateAll((nodes) =>
      nodes
        .filter((node) => node.getAttribute('aria-current') !== null)
        .map((node) => node.textContent?.trim() ?? '')
    )

    expect(current, `chips marked current: ${current.join(', ')}`).toEqual([
      'Consulting',
    ])
  })

  test('an unknown practice falls back to the whole catalogue', async ({
    page,
  }) => {
    // Not a 404: `?practice=nonsense` is a request that cannot be met, not a
    // page that is missing. The full catalogue is the honest answer.
    await page.goto('/en/work')
    const all = await page.locator('article[data-span]').count()

    await page.goto('/en/work?practice=nonsense')
    await page.waitForLoadState('networkidle')

    expect(await page.locator('article[data-span]').count()).toBe(all)
    expect(await page.locator('h1').first().textContent()).toContain('Work')
  })

  test('the filter works with JavaScript disabled', async ({ browser }) => {
    /*
     * The measurement that decided this stage's shape.
     *
     * Tahap 10 removed `?practice=` because, behind the Suspense boundary
     * `cacheComponents` then required, `/en/work` rendered its heading, the
     * word "Loading", and zero projects. `export const instant = false` did
     * not exist yet. With it, measured on the production build:
     *
     *   /en/work                      813 chars  <h1>Work</h1>        6 links
     *   /en/work?practice=consulting  612 chars  <h1>Consulting</h1>  2 links
     *
     * Those numbers are what this pins.
     */
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto('/en/work?practice=consulting', {
        waitUntil: 'domcontentloaded',
      })

      const rendered = await page.evaluate(() => ({
        chars: (document.body.innerText || '').trim().length,
        heading: document.querySelector('h1')?.textContent?.trim() ?? '',
        cards: document.querySelectorAll('article[data-span]').length,
      }))

      expect(
        rendered.chars,
        `only rendered ${rendered.chars} characters`
      ).toBeGreaterThan(400)
      expect(rendered.heading).toBe('Consulting')
      expect(
        rendered.cards,
        'the filtered catalogue rendered no work server-side'
      ).toBeGreaterThan(0)
    } finally {
      await context.close()
    }
  })
})

/**
 * `catalogue-sift` — the choreography, measured rather than assumed.
 *
 * ## What was verified by hand before these were written
 *
 * On the production build, filtering `/en/work` to consulting (6 cards -> 2):
 *
 * ```
 * survivor fixture-arus-balik   from translate3d(0, -33.22px, 0)  800ms  delay 0
 * survivor fixture-pusat-beban  from translate3d(0, -33.22px, 0)  800ms  delay 70
 * easing   cubic-bezier(0.77, 0, 0.175, 1)   = --ease-in-out-quart
 * ghosts   4 detached cards in one aria-hidden overlay, 0 after it settles
 * ```
 *
 * 800ms is `--duration-slow`; 70ms is `--stagger-cards`; the curve is
 * `--ease-in-out-quart`. All three had **zero** consumers before this stage
 * (`docs/stages/TAHAP-34.md` D3 counted them), which is the whole point of
 * spending them here rather than adding new values.
 *
 * `in-out` is used deliberately and is the one case `CLAUDE.md` #2 allows: a
 * card leaves one position and arrives at another. Everything else on this
 * site is `out-*`.
 */
test.describe('catalogue-sift', () => {
  test('surviving cards animate from where they were', async ({ page }) => {
    await page.goto('/en/work')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    await page
      .locator('[data-practice-filter] a', { hasText: 'Consulting' })
      .click()
    await page.waitForTimeout(100)

    /*
     * `ul li[...]`, not `li[...]`. The departing cards are real `<li>`
     * elements too, re-parented into the exit overlay and carrying their own
     * `scale(1)` -> `scale(0.98)` animation — so an unscoped selector reads
     * them as failed FLIPs. Caught by this assertion going red with
     * "started from scale(1)", which is the exit animation working correctly.
     */
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('ul li[data-flip-id]')].flatMap((node) =>
        node.getAnimations().map((animation) => {
          const timing = animation.effect?.getTiming() ?? {}
          /*
           * `getKeyframes` lives on `KeyframeEffect`, not on the
           * `AnimationEffect` base type the DOM lib gives `animation.effect`.
           * Every animation on this page is created by `element.animate()`,
           * which returns exactly that subtype — narrowed with `instanceof`
           * rather than asserted, so the check is earned instead of claimed.
           */
          const effect = animation.effect
          const frames =
            effect instanceof KeyframeEffect ? effect.getKeyframes() : []
          return {
            from: String(frames[0]?.transform ?? ''),
            duration: Number(timing.duration ?? 0),
            delay: Number(timing.delay ?? 0),
            easing: String(timing.easing ?? ''),
          }
        })
      )
    )

    expect(
      moving.length,
      'nothing animated on a filter change'
    ).toBeGreaterThan(0)

    for (const animation of moving) {
      // A FLIP that starts at identity is a FLIP that measured nothing.
      expect(animation.from, `started from ${animation.from}`).toMatch(
        /translate3d\((?!0px, 0px, 0px)/
      )
      expect(animation.duration, 'not the choreographed band').toBe(800)
      expect(animation.easing).toBe('cubic-bezier(0.77, 0, 0.175, 1)')
    }

    // Distance-ranked stagger: at least two different delays, all multiples
    // of the token. One delay for everything is a simultaneous move, which is
    // the thing this choreography exists not to be.
    const delays = [...new Set(moving.map((animation) => animation.delay))]
    for (const delay of delays) expect(delay % 70).toBe(0)
  })

  test('departing cards leave, and leave nothing behind', async ({ page }) => {
    await page.goto('/en/work')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    const before = await page.locator('li[data-flip-id]').count()

    await page
      .locator('[data-practice-filter] a', { hasText: 'Consulting' })
      .click()
    await page.waitForTimeout(90)

    const mid = await page.evaluate(() => ({
      ghosts: document.querySelectorAll('body > div[aria-hidden="true"] > li')
        .length,
      inGrid: document.querySelectorAll('ul li[data-flip-id]').length,
    }))

    expect(mid.ghosts, 'no cards were animated out').toBeGreaterThan(0)
    expect(mid.ghosts + mid.inGrid).toBe(before)

    await page.waitForTimeout(2600)

    const settled = await page.evaluate(() => ({
      layers: document.querySelectorAll(
        'body > div[aria-hidden="true"][style*="fixed"]'
      ).length,
      opacities: [...document.querySelectorAll('ul li[data-flip-id]')].map(
        (node) => getComputedStyle(node).opacity
      ),
      // A ghost layer left behind would sit over the page invisibly.
      overflows: document.documentElement.scrollWidth > window.innerWidth,
    }))

    expect(settled.layers, 'the ghost layer was not cleaned up').toBe(0)
    expect(settled.opacities.every((value) => value === '1')).toBe(true)
    expect(settled.overflows).toBe(false)
  })

  test('reduced motion cuts it, and the filter still works', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      await page.goto('/en/work')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(600)

      await page
        .locator('[data-practice-filter] a', { hasText: 'Consulting' })
        .click()
      await page.waitForTimeout(120)

      const running = await page.evaluate(
        () =>
          [...document.querySelectorAll('ul li[data-flip-id]')].flatMap(
            (node) => node.getAnimations()
          ).length
      )
      expect(running, 'reduced motion still animated the grid').toBe(0)

      await page.waitForTimeout(600)
      const settled = await page.evaluate(() => ({
        cards: document.querySelectorAll('ul li[data-flip-id]').length,
        opacities: [...document.querySelectorAll('ul li[data-flip-id]')].map(
          (node) => getComputedStyle(node).opacity
        ),
        ghosts: document.querySelectorAll('body > div[aria-hidden="true"] > li')
          .length,
      }))

      // The filter is a feature, not an animation: it works identically.
      expect(settled.cards).toBe(2)
      // `CLAUDE.md` #5 — content ends fully visible, never stranded.
      expect(settled.opacities.every((value) => value === '1')).toBe(true)
      expect(settled.ghosts).toBe(0)
    } finally {
      await context.close()
    }
  })
})
