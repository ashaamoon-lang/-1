import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'
import { waitForEntrance } from './page-settled'

/**
 * A control stays a control — rescued from `taste-preflight` in the fork.
 *
 * `e2e/taste-preflight.e2e.ts` was the taste checklist made mechanical: every
 * clause a ceiling on expression, down to banning a punctuation mark in the
 * copy. The fork deleted it (`docs/FORK.md` §2, step 5). One of its clauses
 * was not taste, and it lives here now:
 *
 * **A call-to-action whose label wraps onto two lines is a broken button, not
 * a long label.** The hit area splits, the label reads as two separate
 * things, and on a narrow screen it can push the control past its container.
 *
 * Three changes from the original. The third matters most:
 *
 * 1. **The page is waited on, not timed.** The original slept a flat 1600ms
 *    because "entrance motion is choreographed up to 1200ms". The fork removed
 *    that 1.2s entrance ceiling, so a longer opening is now allowed — and a
 *    flat sleep would photograph it half-lifted. `waitForEntrance` waits for
 *    the curtain to actually clear.
 * 2. **The anti-vacuum works.** The original asserted `counted >= 0`, which is
 *    true of a page with no buttons at all. A reader that measured nothing
 *    would have reported a clean site. The home page has CTAs, so it must
 *    count at least one.
 * 3. **It can now actually fail.** The original measured the element's own
 *    client rects, which are one box for any `inline-block` or flex control
 *    no matter how its label wraps — so it could never go red on the buttons
 *    it named. See `wrappedControls` below.
 *
 * What was **not** rescued, and why: `runs one theme`. The audit suggested
 * keeping it as "disorienting"; a theme that turns over mid-scroll is a
 * technique award sites use on purpose, and whichever theme is showing, its
 * text contrast is still measured by `contrast-situ.e2e.ts`. That is a taste
 * judgement, so it went with the rest of the file.
 */

const JOURNAL_ENTRY = 'scope-is-the-deliverable'

const ROUTES = [
  '/en',
  '/id',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  '/en/practice/consulting',
  '/en/studio',
  '/en/journal',
  `/en/journal/${JOURNAL_ENTRY}`,
]

/** Every element that acts as a pressable call-to-action. */
const CONTROLS = '[data-press="cta"], [data-press="email"], [data-press="chip"]'

async function settle(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await waitForEntrance(page)
  await page.waitForTimeout(400)
}

/*
 * How many lines a control's label actually occupies.
 *
 * **The original check could never fail on a real button**, and that was
 * found while rescuing it. It counted `el.getClientRects().length`, which
 * returns one rectangle per line box only for an *inline* element. The home
 * page's CTA is `display: inline-block`, so it returned 1 whether its label
 * sat on one line or three. `taste-preflight` had been checking a condition
 * that could not occur on the controls it named.
 *
 * Counting a `Range` over the contents is closer and still wrong: it returns
 * one fragment per inline piece, so "Search ⌘K" — a label and a keycap in
 * separate spans — measured 5 on a single line. What a wrap actually changes
 * is the number of distinct **line tops**.
 *
 * And it is counted **per text node** — the second correction. Counted over
 * the whole control, the catalogue's filter chips failed as "3 lines": each
 * chip stacks its label over a small count ("All" above "06") inside a 44px
 * touch target, by design, and the label itself was one fragment on one line.
 * A wrapped label is one run of text broken across lines, not a control built
 * from two stacked parts, so each text node is measured on its own. Tops within
 * `SAME_LINE_PX` are one line: the count's two fragments sat at 505 and 506, a
 * rounding difference that had been scored as a second line.
 */
const SAME_LINE_PX = 3

async function wrappedControls(page: Page) {
  return page.evaluate(
    ({ selector, tolerance }) => {
      const lineCount = (node: Text) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        const tops = [...range.getClientRects()]
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => rect.top)
          .sort((a, b) => a - b)
        let lines = 0
        let last = Number.NEGATIVE_INFINITY
        for (const top of tops) {
          if (top - last > tolerance) lines += 1
          last = top
        }
        return lines
      }

      const hits: string[] = []
      let counted = 0
      for (const el of document.querySelectorAll<HTMLElement>(selector)) {
        counted += 1
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!(node instanceof Text) || node.data.trim() === '') continue
          const lines = lineCount(node)
          if (lines > 1) hits.push(`"${node.data.trim()}" (${lines} lines)`)
        }
      }
      return { hits, counted }
    },
    { selector: CONTROLS, tolerance: SAME_LINE_PX }
  )
}

test.describe('a control stays a control', () => {
  test('the reader finds controls to measure at all', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await settle(page, '/en')
    const { counted } = await wrappedControls(page)
    expect(
      counted,
      'the home page carries no [data-press] control — the selector is broken, not the page'
    ).toBeGreaterThan(0)
  })

  for (const path of ROUTES) {
    test(`${path} does not wrap a CTA label`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, path)
      const { hits } = await wrappedControls(page)
      expect(
        hits,
        'a CTA label that wraps to two lines is a broken button, not a long label'
      ).toEqual([])
    })
  }
})
