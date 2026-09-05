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
