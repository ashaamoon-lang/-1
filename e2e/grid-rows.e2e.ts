import { expect, test } from '@playwright/test'

/**
 * No card is left alone in a row with half the grid empty beside it —
 * Tahap 86.
 *
 * ## The defect this exists for
 *
 * The home page's editorial grid took each card's width straight from the
 * CMS (`project.span`, 6 or 12) with no notion of rows. The featured works run
 * `6, 12, 6, 6`, so the first half opened a row the full card could not join:
 * **787px of empty ground at 1600×900**, beside a card 776px wide. The repo
 * owner reported it from a screenshot as "a missing grid".
 *
 * ## Why it measures overlap, not a shared `top`
 *
 * The first instrument written for this grouped cards by identical `top`, and
 * it flagged every card on `/work` as alone. It was wrong: the catalogue
 * offsets alternate cards with `margin-block-start` on purpose (Tahap 44), so
 * a pair shares a row while starting at different heights — measured, the
 * pairs end on the same pixel (1681/1681, 2826/2826, 3970/3970). A card is
 * alone when **nothing overlaps it vertically**, which is what an eye sees and
 * what this asks.
 *
 * ## Why every grid on the sitemap
 *
 * Walked, not named. `project-spread.e2e.ts` once pinned one slug and went on
 * skipping after the spread moved to another page. This finds every
 * `ul[data-layout]` on every route the site publishes.
 *
 * ## Red-proof
 *
 * Against the code before the fix: `/en` and `/id`, first card, 787px empty
 * at 1600 and 707px at 1440.
 *
 * Desktop only. Below the desktop breakpoint every card spans the whole
 * 4-column grid (`project-grid.module.css`), so there is no half to strand.
 */

/** A card narrower than this share of its grid is a half. */
const HALF = 0.6

/** Empty width beside a lone card, as a share of the grid, that counts as a hole. */
const HOLE = 0.3

test.describe('project grids leave no card alone in its row', () => {
  test('every grid on every published route, at two desktop widths', async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000)

    const xml = await (await request.get('/sitemap.xml')).text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1] ?? '/').pathname)
      .filter((path) => !path.endsWith('.md'))
    expect(paths.length, 'the sitemap listed nothing').toBeGreaterThan(0)

    const holes: string[] = []
    let halvesSeen = 0

    for (const width of [1600, 1440]) {
      await page.setViewportSize({ width, height: 900 })

      for (const path of paths) {
        await page.goto(path)

        const found = await page.evaluate(
          ({ half, hole }) => {
            const lone: string[] = []
            const out = { lone, halves: 0 }
            for (const grid of document.querySelectorAll('ul[data-layout]')) {
              const box = grid.getBoundingClientRect()
              const cards = [...grid.children].map((child) => {
                const rect = child.getBoundingClientRect()
                return {
                  top: rect.top,
                  bottom: rect.bottom,
                  width: rect.width,
                  label: (child.textContent ?? '').trim().slice(0, 24),
                }
              })
              for (const [index, card] of cards.entries()) {
                if (card.width >= box.width * half) continue
                out.halves += 1
                const partnered = cards.some(
                  (other, j) =>
                    j !== index &&
                    other.top < card.bottom &&
                    other.bottom > card.top
                )
                const empty = box.width - card.width
                if (!partnered && empty > box.width * hole) {
                  out.lone.push(
                    `${grid.getAttribute('data-layout')} card ${index + 1} "${card.label}" leaves ${Math.round(empty)}px empty`
                  )
                }
              }
            }
            return out
          },
          { half: HALF, hole: HOLE }
        )

        halvesSeen += found.halves
        for (const lone of found.lone) holes.push(`${width} ${path}: ${lone}`)
      }
    }

    // Anti-vacuum: a site with no half-width cards anywhere would pass this
    // without having measured the thing it is for.
    expect(
      halvesSeen,
      'no half-width card was measured at all'
    ).toBeGreaterThan(0)
    expect(holes, holes.join('\n')).toEqual([])
  })
})
