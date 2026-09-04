import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'

/**
 * The search palette — Tahap 28, Fase 4 of the approved scaffold.
 *
 * ## What this file exists to catch, and it is not "does it open"
 *
 * Three failures, each of which shipped somewhere in this project's history in
 * a different form:
 *
 * 1. **The wrong answer.** Ordering results structurally and highlighting the
 *    first one meant that typing `scope` — the first word of the journal entry
 *    "Scope is the deliverable" — highlighted the **home page**, whose
 *    description happens to contain "scopes". Enter took the reader somewhere
 *    they had not asked for. Measured before `matchScore` existed; the unit
 *    test in `lib/content/search-index.test.ts` pins the scoring, and the
 *    ranking test below pins what a reader actually sees.
 *
 * 2. **An audit that proves nothing.** `axe` inspects what is rendered, and a
 *    closed dialog is not rendered — so every route on this site could stay
 *    green forever while carrying a broken palette. This is Tahap 25 §7.5's
 *    lesson (three defects survived because axe ran at `scrollY 0` while the
 *    element sat below the fold) in the shape it takes for an overlay: the
 *    audit below runs with the palette **open**.
 *
 * 3. **A control that lies.** Without JavaScript the palette cannot exist, so
 *    the trigger must not be there either. A button that renders and does
 *    nothing when pressed is worse than no button.
 */

/**
 * The narrowest thing that still counts as a column rather than an indent.
 *
 * Three weaker versions of the band assertion below were written and measured
 * against the stacked layout Tahap 29 replaced, and all three passed on it:
 * `name.left > rail.left` passed on a 7px glyph inset; clearing the rail's
 * width passed because an inline span in a stacked row shrinks to its text;
 * and sharing a top edge passed because `align-items: baseline` moves box
 * tops by the difference in font size, which was *larger* than the stacked
 * layout's. Horizontal separation on this scale is the thing only real
 * columns have — measured 226px and 452px as shipped, 7px and 0px stacked.
 */
const MIN_COLUMN_PX = 100

/** Opens the palette with the keyboard, the way the shortcut advertises. */
async function openWithShortcut(page: Page) {
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(600)
}

test.describe('the search palette', () => {
  for (const locale of ['en', 'id'] as const) {
    test(`/${locale}: the button and the shortcut both open it`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)
      await page.waitForTimeout(1200)

      const trigger = page.locator('[data-search-trigger]')
      await expect(
        trigger,
        'the search trigger is not in the header — a shortcut nobody can see is not a feature'
      ).toBeVisible()

      await trigger.click()
      await page.waitForTimeout(600)
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Escape, then the shortcut, so both doors are proved in one pass.
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      await expect(page.locator('[role="dialog"]')).toBeHidden()

      await openWithShortcut(page)
      await expect(
        page.locator('[role="dialog"]'),
        'Ctrl/Cmd-K did not open the palette'
      ).toBeVisible()

      const rows = await page.locator('[role="option"]').count()
      expect(
        rows,
        'the palette opened with no results at all — the index never arrived'
      ).toBeGreaterThan(5)
    })
  }

  test('it searches content, not only route names', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    /*
     * A client name that appears on no page title anywhere on the site. If
     * this finds nothing, the palette is a filtered navigation menu wearing a
     * search field, which is the version of this feature that should not
     * have been built (`docs/stages/TAHAP-28.md` §1).
     */
    await page.keyboard.type('kedai')
    await page.waitForTimeout(400)

    const results = await page.locator('[role="option"]').allTextContents()
    expect(
      results.length,
      'searching a client name found nothing — only titles are being matched'
    ).toBeGreaterThan(0)
    expect(results.join(' ')).toContain('Kedai')
  })

  test('the words may arrive in any order', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)
    await page.waitForSelector('[data-search-row]')

    const results = async (query: string) => {
      await page.fill('[role="combobox"]', '')
      await page.keyboard.type(query)
      await page.waitForTimeout(350)
      return page.locator('[role="option"]').allTextContents()
    }

    /*
     * All three found nothing before the query was read as words rather than
     * as one substring — including the last, which is the entry's own title
     * minus the connectives nobody types. `docs/stages/TAHAP-30.md` §2.
     */
    expect((await results('arus balik')).join(' ')).toContain('Arus Balik')
    expect(
      (await results('balik arus')).join(' '),
      'reversing two words of a title loses the result'
    ).toContain('Arus Balik')
    expect(
      (await results('tanjung 2025')).join(' '),
      'the client and the year are one line of the row, and typing both finds nothing'
    ).toContain('Arus Balik')
    expect(
      (await results('scope deliverable')).join(' '),
      "an entry's own words, in order, without its connectives"
    ).toContain('Scope is the deliverable')
  })

  test('a title match outranks a passing mention', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    await page.keyboard.type('scope')
    await page.waitForTimeout(400)

    const highlighted = await page.evaluate(
      () =>
        document
          .querySelector('[role="option"][data-highlighted]')
          ?.textContent?.trim() ?? ''
    )

    /*
     * Proved red on 2026-09-03: this returned the home page, because its
     * description contains "scopes". Enter would have opened it.
     */
    expect(
      highlighted,
      `Enter would open "${highlighted}" — a page that merely mentions the word, rather than the entry whose title is it`
    ).toContain('Scope is the deliverable')
  })

  test('it is operable from the keyboard alone, and gives focus back', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)

    // Focus the trigger by tabbing to it rather than clicking, so this test
    // never touches a pointer.
    await page.locator('[data-search-trigger]').focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(600)

    const focusRole = await page.evaluate(() =>
      document.activeElement?.getAttribute('role')
    )
    expect(
      focusRole,
      'focus did not land in the search field when the palette opened'
    ).toBe('combobox')

    await page.keyboard.type('journal')
    await page.waitForTimeout(400)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(200)

    const pointer = await page.evaluate(() => {
      const input = document.querySelector('[role="combobox"]')
      const id = input?.getAttribute('aria-activedescendant')
      return { id, exists: id ? Boolean(document.getElementById(id)) : false }
    })
    expect(
      pointer.id,
      'the combobox names no active option, so a screen reader is told nothing as the highlight moves'
    ).toBeTruthy()
    expect(
      pointer.exists,
      `aria-activedescendant points at "${pointer.id}", which is not in the document`
    ).toBe(true)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    await expect(page.locator('[role="dialog"]')).toBeHidden()
    const returned = await page.evaluate(() =>
      document.activeElement?.hasAttribute('data-search-trigger')
    )
    expect(
      returned,
      'closing the palette dropped focus somewhere else, so a keyboard reader loses their place'
    ).toBe(true)
  })

  test('Enter opens the highlighted result', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)

    await page.keyboard.type('arus')
    await page.waitForTimeout(400)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(2500)

    expect(
      new URL(page.url()).pathname,
      'Enter on the only result did not navigate to it'
    ).toBe('/en/work/arus-balik')
    await expect(page.locator('[role="dialog"]')).toBeHidden()
  })

  for (const locale of ['en', 'id'] as const) {
    test(`/${locale}: axe is clean with the palette open`, async ({ page }) => {
      await page.goto(`/${locale}`)
      await page.waitForTimeout(1200)
      await page.locator('[data-search-trigger]').click()
      await page.waitForSelector('[data-search-row]')

      /*
       * Wait for the entrance to finish before auditing.
       *
       * Not a convenience: a row part-way through its fade genuinely has
       * failing contrast, and this gate caught exactly that — three
       * `color-contrast` nodes on one run, clean on the retry. WCAG is about
       * the state content rests in, and a gate that samples a random frame of
       * an animation reports noise instead of the thing it is meant to
       * protect. The entrance is capped so this wait stays short; see
       * `MAX_STAGGERED_ROWS` in the palette.
       */
      await page.evaluate(() =>
        Promise.all(
          [...document.querySelectorAll('[data-search-row]')].flatMap((row) =>
            row.getAnimations().map((animation) => animation.finished)
          )
        ).catch(() => undefined)
      )

      const rows = await page.locator('[role="option"]').count()
      expect(
        rows,
        'nothing was rendered, so this run proves nothing about the open palette'
      ).toBeGreaterThan(0)

      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()
      const found = results.violations.map(
        (violation) =>
          `${violation.impact}: ${violation.id} (${violation.nodes.length} node(s))`
      )
      expect(found, found.join('\n')).toEqual([])
    })
  }

  /*
   * Tahap 29's gates. The palette passed everything above while looking like a
   * command palette from any developer tool, so these check the things that
   * made it this site's: a real type hierarchy, a rail on the page's own grid,
   * a counter that answers the query, and three distinct states for an empty
   * list. `docs/stages/TAHAP-29.md` carries the measurements.
   */
  test('a result row has a real typographic hierarchy', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await page.locator('[data-search-trigger]').click()
    await page.waitForSelector('[data-search-row]')
    await page.waitForTimeout(600)

    const row = await page.evaluate(() => {
      const first = document.querySelector('[data-search-row]')
      const read = (index: number) => {
        const el = first?.children[index]
        const style = el ? getComputedStyle(el) : null
        return style
          ? {
              size: Number.parseFloat(style.fontSize),
              family: style.fontFamily,
              left: Math.round(el?.getBoundingClientRect().left ?? 0),
            }
          : null
      }
      return { meta: read(0), label: read(1), description: read(2) }
    })

    expect(row.meta && row.label && row.description).toBeTruthy()
    if (!row.meta || !row.label || !row.description) return

    /*
     * Tahap 28 set the name and its description at the same size, so nothing
     * on the row could be scanned — `ui-ux-pro-max --domain ux`: "Consistent
     * type hierarchy aids scanning". Three sizes, from the scale this site
     * already has, in the order a reader needs them.
     */
    expect(
      row.label.size,
      `the name (${row.label.size}px) is not larger than its description (${row.description.size}px) — the row cannot be scanned`
    ).toBeGreaterThan(row.description.size)
    expect(
      row.description.size,
      'the description is not larger than the rail; the rail is meant to be the quietest thing on the row'
    ).toBeGreaterThan(row.meta.size)
    expect(
      row.meta.family,
      `the rail is set in ${row.meta.family} — it carries facts (a path, a date, a client and year) and this site sets facts in the mono face`
    ).toContain('Mono')
  })

  test('every rail sits on one edge, and the reading column on another', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await page.locator('[data-search-trigger]').click()
    await page.waitForSelector('[data-search-row]')
    await page.waitForTimeout(600)

    const edges = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-search-row]')]
      const at = (index: number) =>
        rows.map((row) =>
          Math.round(row.children[index]?.getBoundingClientRect().left ?? -1)
        )
      return {
        rail: [...new Set(at(0))],
        name: [...new Set(at(1))],
        description: [...new Set(at(2))],
      }
    })

    expect(
      edges.rail,
      `the rails start at ${edges.rail.join(', ')} — a column that does not line up is not a column`
    ).toHaveLength(1)
    expect(edges.name).toHaveLength(1)

    /*
     * Three bands, each a real column further right than the last — which is
     * what a table of contents is, and what a stacked row is not.
     *
     * Three weaker versions of this were written and measured against the
     * stacked layout this stage replaced, and all three passed on it. See
     * `MIN_COLUMN_PX` above for what each one missed.
     */
    expect(edges.description).toHaveLength(1)
    const [railX = 0, nameX = 0, descriptionX = 0] = [
      edges.rail[0],
      edges.name[0],
      edges.description[0],
    ]

    expect(
      nameX - railX,
      `the name starts ${nameX - railX}px after the rail — that is an indent, not a column`
    ).toBeGreaterThanOrEqual(MIN_COLUMN_PX)
    expect(
      descriptionX - nameX,
      `the description starts ${descriptionX - nameX}px after the name — these are stacked, not banded`
    ).toBeGreaterThanOrEqual(MIN_COLUMN_PX)
  })

  test('the counter answers the query', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await openWithShortcut(page)
    await page.waitForSelector('[data-search-row]')

    const read = async () =>
      (
        await page.evaluate(
          () =>
            [...document.querySelectorAll('[role="dialog"] p')]
              .map((p) => p.textContent?.trim() ?? '')
              .find((text) => /^\d+\s*\/\s*\d+$/.test(text)) ?? ''
        )
      ).replace(/\s+/g, '')

    const all = await read()
    expect(all, 'no counter is rendered once the index has loaded').toMatch(
      /^\d+\/\d+$/
    )

    await page.keyboard.type('scope')
    await page.waitForTimeout(400)
    const filtered = await read()

    const count = (value: string) => Number(value.split('/')[0])
    expect(
      count(filtered),
      `the counter read ${all} then ${filtered} — it is not following the query`
    ).toBeLessThan(count(all))
    expect(count(filtered)).toBeGreaterThan(0)
  })

  test('an index still loading does not claim the query matched nothing', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)

    // Hold the index back so the gap between opening and having data is real,
    // the way it is on a slow connection.
    await page.route('**/search.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      return route.continue()
    })

    await page.locator('[data-search-trigger]').click()
    await page.waitForTimeout(250)

    const early =
      (await page.evaluate(
        () => document.querySelector('[role="dialog"]')?.textContent ?? ''
      )) ?? ''

    /*
     * Proved red on 2026-09-04: for the whole 900ms the palette rendered its
     * empty state — "Nothing matches that", over a `00 / 00` counter — in
     * answer to a query the reader had not typed. Both shipped in Tahap 28
     * with every gate green.
     */
    expect(
      early,
      `while the index was loading the palette said: "${early.slice(0, 90)}"`
    ).not.toContain('Nothing matches')
    expect(
      early,
      'a zeroed counter is shown before there is anything to count'
    ).not.toMatch(/00\s*\/\s*00/)

    await page.waitForSelector('[data-search-row]', { timeout: 5000 })
  })

  test('a failed index says so, and says what still works', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await page.route('**/search.json', (route) =>
      route.fulfill({ status: 500, body: 'no' })
    )

    await page.locator('[data-search-trigger]').click()
    await page.waitForTimeout(900)

    const text =
      (await page.evaluate(
        () => document.querySelector('[role="dialog"]')?.textContent ?? ''
      )) ?? ''

    // "Nothing matched" would be a lie about a fetch that failed, and it is
    // what this said before Tahap 29.
    expect(text).not.toContain('Nothing matches')
    expect(
      text.toLowerCase(),
      'a broken search does not tell the reader it is broken'
    ).toContain('unavailable')
  })

  test('reduced motion leaves the rows still and fully visible', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en')
    await page.waitForTimeout(1200)
    await page.locator('[data-search-trigger]').click()
    await page.waitForSelector('[data-search-row]')
    await page.waitForTimeout(400)

    const state = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-search-row]')]
      return {
        animating: rows.filter((row) => row.getAnimations().length > 0).length,
        dim: rows.filter(
          (row) => Number.parseFloat(getComputedStyle(row).opacity) < 0.99
        ).length,
        shifted: rows.filter(
          (row) => getComputedStyle(row).transform !== 'none'
        ).length,
        total: rows.length,
      }
    })

    expect(state.total).toBeGreaterThan(0)
    expect(
      state.animating,
      `${state.animating} rows are still animating under prefers-reduced-motion`
    ).toBe(0)
    expect(
      [state.dim, state.shifted],
      'a row is left dimmed or displaced — CLAUDE.md #5 requires content to end fully visible'
    ).toEqual([0, 0])
  })

  test('without JavaScript the trigger is not offered at all', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto('/en', { waitUntil: 'domcontentloaded' })

      // Present in the markup — the header is a client component and React
      // renders it server-side — but never shown, which is the contract.
      await expect(
        page.locator('[data-search-trigger]'),
        'the search button is offered without JavaScript, where pressing it does nothing'
      ).toBeHidden()

      // And the page is still the page.
      await expect(page.locator('h1')).toBeVisible()
    } finally {
      await context.close()
    }
  })
})
