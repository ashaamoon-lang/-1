import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * Every block that arrives on scroll arrives *as* something.
 *
 * ## Why this exists
 *
 * `docs/stages/TAHAP-14.md` §1 measured melius.com and found the gap was not
 * technique — it ships no three.js at all — but coverage: 27 blocks at `h3`
 * depth, each revealing as it enters the viewport, against roughly six here.
 * A page where five sections animate in and four appear abruptly does not
 * read as restrained, it reads as unfinished; the inconsistency is more
 * visible than either treatment alone would be.
 *
 * ## Why an ancestor, not the element
 *
 * `lib/hooks/use-reveal.ts` flips `data-reveal` on a *container* and CSS
 * animates its `[data-reveal-item]` children. The question for a heading is
 * therefore not "does this element reveal" but "is it inside something that
 * does" — hence `closest()`.
 *
 * ## Why headings, and why a floor
 *
 * The first version of this gate walked `section, h2, h3`. It went green on
 * `/en/work/<slug>` while finding **zero** candidates there — that page has
 * no `<section>` and no `h2`/`h3` at all — and green on `/en/work` while
 * never seeing that page's own `<h1>`. A gate that passes because it found
 * nothing to check is worse than no gate, and it is the exact defect class
 * this project keeps re-finding (`docs/stages/TAHAP-12.md` §10).
 *
 * So: headings `h1`–`h3`, which every route has, **and** a per-route floor on
 * how many were found. If a page renders less than it should, this fails on
 * the count before it can pass on the coverage.
 *
 * ## What it cannot see, stated plainly
 *
 * A block with no heading is invisible here. `vault/blocks/next-project` is
 * the one that matters today: it is a full-width link with no heading of its
 * own, so its reveal was added by hand and is not policed by this file.
 *
 * ## Why `<main>` only
 *
 * Header and footer are persistent chrome — on screen before any scrolling,
 * never entering the viewport. A reveal there would be a load animation,
 * which `MOTION-SPEC.md` §9.5 budgets separately.
 *
 * ## The opt-out is explicit and carries a reason
 *
 * `data-reveal-exempt="<why>"` on the element or an ancestor. A silent
 * exception is how a gate stops meaning anything; one that has to be typed
 * out, with a reason, is a decision somebody made on purpose.
 */

/** Routes whose content the reader scrolls through, and the least each renders. */
const ROUTES: { path: string; minHeadings: number }[] = [
  // Hero h1, work h2, four card h3, studio h2, contact h2 + h3.
  { path: '/en', minHeadings: 6 },
  // Page h1 plus one h3 per published work.
  { path: '/en/work', minHeadings: 5 },
  // The work's own title. Gallery and next-project carry no heading.
  { path: `/en/work/${FEATURED_WORK}`, minHeadings: 1 },
]

interface Heading {
  tag: string
  text: string
}

async function readHeadings(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'networkidle' })

  /*
   * Walk the page once before measuring.
   *
   * `useReveal` sets `data-reveal` in a layout effect, so the attribute is
   * present whether or not the element has been seen — but a block far below
   * the fold may not have hydrated its client component yet. Scrolling to the
   * bottom and back is what a reader does, and it is the state this is about.
   */
  await page.evaluate(async () => {
    const step = window.innerHeight
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(400)

  return page.evaluate(() => {
    const main = document.querySelector('main')
    if (!main) return { total: 0, missing: [] as Heading[] }

    const headings = [...main.querySelectorAll<HTMLElement>('h1, h2, h3')]
    const missing = headings
      .filter(
        (heading) =>
          !heading.closest('[data-reveal]') &&
          !heading.closest('[data-reveal-exempt]')
      )
      .map((heading) => ({
        tag: heading.tagName.toLowerCase(),
        text: (heading.textContent ?? '').trim().slice(0, 48),
      }))

    return { total: headings.length, missing }
  })
}

test.describe('reveal coverage', () => {
  for (const route of ROUTES) {
    test(`${route.path}: nothing arrives unannounced`, async ({ page }) => {
      const { total, missing } = await readHeadings(page, route.path)

      // The floor first: a page that rendered nothing must not pass by having
      // nothing to check.
      expect(
        total,
        `${route.path} rendered only ${total} heading(s); this gate needs at least ${route.minHeadings} to mean anything`
      ).toBeGreaterThanOrEqual(route.minHeadings)

      expect(
        missing,
        `${route.path}: ${missing.length} heading(s) with no reveal and no explicit exemption:\n${missing
          .map((heading) => `  <${heading.tag}> ${heading.text}`)
          .join('\n')}`
      ).toEqual([])
    })
  }
})
