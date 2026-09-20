import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK, RUN_WORK } from './fixtures'

/**
 * How much of a block is content, and how big the largest hole is — Tahap 83.
 *
 * ## Why this exists, and what it cost to learn
 *
 * Three stages in a row named routes from memory and were wrong about all of
 * them. `TAHAP-81` promised a depth plane to five routes and five were
 * refusable; `TAHAP-82` promised four plates to every project and found that
 * `RUN_MINIMUM` **replaces** the grid rather than adding to it; `TAHAP-83`'s
 * first draft promised a material layer to three routes, none of which lacked
 * material. On the same day this file's author measured `/studio` twice and got
 * it wrong twice — once by grepping the route file instead of the page, once by
 * reading a full-page screenshot of a scroll-scrubbed element as a blank block.
 *
 * Four mistakes, one cause: **nothing measured composition**. `project-spread`
 * measures one route's rows because somebody once looked at `/work`, counted
 * *"roughly 860 thousand square pixels of empty page"*, and built the
 * instrument. Every other route was only ever read.
 *
 * Measured by hand before this file existed, at 1440x900:
 *
 * ```
 * /en/journal        row 629px · text ends 125px · cover 422px
 *                    void 1061 x 457 = ~485,000 px² per row, three rows
 * /en/practice/<v>   block 414px per item · text 43px · 10.4% filled
 * ```
 *
 * ## What counts as content
 *
 * Only **painted leaves**: an element carrying its own text, or an image,
 * canvas, video or SVG. Containers are excluded on purpose — a wrapper's box
 * covers its children, so counting wrappers would report every page as full.
 *
 * Decoration is excluded for the same reason, and it matters here: `/studio`
 * and `/practice/<v>` both lay a `position: fixed` pattern across the whole
 * viewport. Counting it would mark every cell filled and report a page of
 * headlines-in-a-void as perfectly dense.
 *
 * ## Why a grid rather than exact geometry
 *
 * The largest empty rectangle over arbitrary boxes is expensive. A coarse grid
 * with the classic largest-rectangle-in-a-histogram pass is tractable inside a
 * test and accurate enough to separate "a comfortable margin" from "half the
 * row is nothing". `CELLS` is the resolution, and the numbers it produces are
 * approximations by construction — which is why this file reports them beside
 * the hand measurement above rather than instead of it.
 *
 * ## Reports everywhere, enforces where the number was argued
 *
 * Density is not correctness. `/journal/<slug>` is deliberately the calmest
 * surface on the site (`DIREKSI.md` §2.3), and a threshold applied site-wide
 * would punish it for being what it was designed to be. So this walks every
 * brand route and prints, and asserts only on the routes whose numbers a stage
 * has defended — exactly as `project-spread` holds rows in the gallery and
 * nowhere else.
 */

/** Grid resolution. Higher is sharper and slower; 32 resolves ~44px at 1440. */
const CELLS = 32

interface Density {
  /** Share of the block's cells carrying painted content, 0–1. */
  filled: number
  /** Largest empty rectangle inside the block, in CSS pixels squared. */
  largestVoid: number
  /** That hole as a share of the block, 0–1. */
  voidShare: number
  /** The block's own area, for scale. */
  area: number
}

/** Measure every block matching `selector`, in page order. */
async function measure(
  page: Page,
  path: string,
  selector: string
): Promise<Density[]> {
  await page.goto(path)
  await page.waitForTimeout(2200)
  // Scroll once so reveals fire; content held at opacity 0 is not yet content.
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight
  )
  for (let i = 0; i <= 6; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), (height * i) / 6)
    await page.waitForTimeout(250)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)

  return page.evaluate(
    ({ selector: sel, cells }) => {
      const isPainted = (el: Element): boolean => {
        const style = getComputedStyle(el)
        if (style.visibility === 'hidden' || style.display === 'none') {
          return false
        }
        if (Number.parseFloat(style.opacity) < 0.05) return false
        // Decoration that covers the viewport would mark every cell filled.
        if (style.position === 'fixed') return false

        const box = el.getBoundingClientRect()
        if (box.width < 2 || box.height < 2) return false

        if (/^(IMG|SVG|CANVAS|VIDEO|PICTURE)$/.test(el.tagName)) return true

        // A text leaf: it carries the words itself rather than wrapping them.
        return [...el.childNodes].some(
          (node) =>
            node.nodeType === 3 && (node.textContent ?? '').trim() !== ''
        )
      }

      return [...document.querySelectorAll(sel)].map((block) => {
        const outer = block.getBoundingClientRect()
        const covered: boolean[][] = Array.from({ length: cells }, () =>
          Array.from({ length: cells }, () => false)
        )
        const cellW = outer.width / cells
        const cellH = outer.height / cells

        for (const el of block.querySelectorAll('*')) {
          if (!isPainted(el)) continue
          const box = el.getBoundingClientRect()
          const c0 = Math.max(0, Math.floor((box.left - outer.left) / cellW))
          const c1 = Math.min(
            cells - 1,
            Math.ceil((box.right - outer.left) / cellW) - 1
          )
          const r0 = Math.max(0, Math.floor((box.top - outer.top) / cellH))
          const r1 = Math.min(
            cells - 1,
            Math.ceil((box.bottom - outer.top) / cellH) - 1
          )
          for (let r = r0; r <= r1; r += 1) {
            for (let c = c0; c <= c1; c += 1) {
              const row = covered[r]
              if (row) row[c] = true
            }
          }
        }

        const total = cells * cells
        const filledCells = covered.flat().filter(Boolean).length
        const voidCells = ((): number => {
          const rows = covered.length
          const cols = covered[0]?.length ?? 0
          const heights: number[] = Array.from({ length: cols }, () => 0)
          let best = 0
          for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
              heights[c] = covered[r]?.[c] === true ? 0 : (heights[c] ?? 0) + 1
            }
            const stack: number[] = []
            for (let c = 0; c <= cols; c += 1) {
              const h = c === cols ? 0 : (heights[c] ?? 0)
              while (stack.length > 0) {
                const top = stack[stack.length - 1] ?? 0
                if ((heights[top] ?? 0) <= h) break
                stack.pop()
                const left =
                  stack.length === 0 ? 0 : (stack[stack.length - 1] ?? 0) + 1
                best = Math.max(best, (heights[top] ?? 0) * (c - left))
              }
              stack.push(c)
            }
          }
          return best
        })()

        const area = outer.width * outer.height
        return {
          filled: filledCells / total,
          largestVoid: (voidCells / total) * area,
          voidShare: voidCells / total,
          area,
        }
      })
    },
    { selector, cells: CELLS }
  )
}

const pct = (value: number) => `${Math.round(value * 100)}%`
const px2 = (value: number) => `${Math.round(value / 1000)}k px²`

const REPORTED = [
  { path: '/en', selector: 'main section', label: 'home sections' },
  { path: '/en/work', selector: 'main li', label: 'catalogue cards' },
  {
    path: `/en/work/${FEATURED_WORK}`,
    selector: 'main li[data-span]',
    label: 'gallery plates (grid)',
  },
  {
    path: `/en/work/${RUN_WORK}`,
    selector: 'main li[data-run-item]',
    label: 'gallery plates (track)',
  },
  { path: '/en/studio', selector: 'main section', label: 'studio sections' },
  { path: '/en/journal', selector: 'main article', label: 'journal rows' },
  {
    /*
     * The capability blocks, not every `li` on the page.
     *
     * `main li` was the first selector here and it matched **eleven** things
     * — nav rows and the sub-label lists among them — reporting 44% fill
     * against the 10.4% measured by hand on the four blocks that matter. The
     * instrument's first number disagreeing with the hand measurement is how
     * the selector was caught rather than believed.
     */
    path: '/en/practice/consulting',
    selector: '[class*="capability"] li',
    label: 'capability blocks',
  },
] as const

test.describe('how much of a block is content', () => {
  test('reports the density of every brand route', async ({ page }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'the twelve-column composition this measures exists on desktop'
    )
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })

    let measured = 0
    const lines: string[] = []

    for (const route of REPORTED) {
      const blocks = await measure(page, route.path, route.selector)
      if (blocks.length === 0) {
        lines.push(`${route.path.padEnd(28)} ${route.label}: no block matched`)
        continue
      }
      measured += blocks.length
      const worst = blocks.reduce((a, b) => (b.voidShare > a.voidShare ? b : a))
      const avgFill =
        blocks.reduce((sum, b) => sum + b.filled, 0) / blocks.length
      const tallest = Math.round(Math.max(...blocks.map((b) => b.area)) / 1440)
      lines.push(
        `${route.path.padEnd(28)} ${String(blocks.length).padStart(2)} ${route.label.padEnd(22)}` +
          ` fill ${pct(avgFill).padStart(4)}   worst hole ${pct(worst.voidShare).padStart(4)} = ${px2(worst.largestVoid).padStart(9)}` +
          `   tallest block ~${tallest}px`
      )
    }

    console.log(`\nCOMPOSITION DENSITY @ 1440x900\n${lines.join('\n')}\n`)

    /*
     * Anti-vacuum. Every number above comes from a selector, and a selector
     * that stops matching reports a perfectly dense site made of nothing —
     * the failure shape `design-scoreboard` and `stage-position` each carry
     * their own guard against.
     *
     * It caught one here before it caught anything else: `main li` on
     * `/practice` matched eleven elements and reported 44% fill against the
     * 10.4% measured by hand. The selector was wrong, not the page.
     */
    expect(measured, 'no block matched on any route').toBeGreaterThan(10)
  })

  /*
   * ## The threshold, and why this one
   *
   * **No block may be more than half a single hole.** Not a taste number: a
   * block whose largest *contiguous empty rectangle* outweighs everything
   * painted in it is a block the reader crosses rather than reads, and
   * `DIREKSI.md` §2.1 already names that failure — "hero lebih tinggi dengan
   * isi yang sama bukan lebih memukau, melainkan lebih kosong".
   *
   * Measured across the site before the line was drawn, so it separates
   * observed states rather than inventing one:
   *
   * ```
   * /en/work/arus-balik    0%   gallery plates
   * /en/work               3%   catalogue cards
   * /en/work/pusat-beban  53%   track plates, ragged bottoms
   * /en/journal           59%   text ends at 125px, cover runs to 422px
   * /en/studio            72%
   * /en/practice/<v>      81%   a capability name in a 414px block
   * ```
   *
   * The two dense routes are the two with a gate. That is the whole argument
   * for this file.
   *
   * ## Why only two routes are held
   *
   * `/en` and `/studio` are over the line too, and are deliberately not
   * asserted yet: no stage has measured what their blocks *should* hold, and
   * a threshold applied to a page nobody has argued about is how a metric
   * starts driving the design instead of describing it (`DIREKSI.md` §2.1
   * again, and risk R3 in the plan). They report. When a stage argues them,
   * they move into this list and the reason moves with them.
   */
  const HELD = [
    {
      path: '/en/journal',
      selector: 'main article',
      label: 'journal rows',
      measuredToday: 0.59,
    },
  ] as const

  /*
   * ## `/practice/<v>` was in this list for an hour, and taking it out is the
   * point of the file
   *
   * It measures **81% empty, 351k px² per block** — the emptiest number on the
   * site — and it was held on that number alone. Then the rule that produces it
   * was read:
   *
   * ```
   * capability-set.module.css   min-block-size: 46svh
   * ```
   *
   * with its own measurement attached: *"an 800px viewport — long past the
   * ~200px Tahap 24 proved no reader perceives as holding — and **exactly two
   * statements share the screen**, the one being read and the one arriving"*,
   * and, directly above the padding: *"the extra height is meant to be space
   * **after** an item."*
   *
   * The space is not unclaimed. It is the cadence of a sticky sequence, argued
   * in Tahap 24 and re-measured in Tahap 25, and a gate that fails it would be
   * a metric overruling a decision because the decision is expensive to
   * express as a number.
   *
   * That failure is named in this stage's own spec, §6.2 — *"a threshold forced
   * across the site would punish the routes that are quiet on purpose"* — and it
   * was written before this list was. Writing the risk down did not prevent it;
   * reading the CSS did.
   *
   * So the instrument keeps reporting `/practice` and stops judging it. A block
   * being empty is a question, not a verdict. What this gate can honestly hold
   * is emptiness **nobody has claimed**, and the only way to tell the two apart
   * is to go and read why the space is there.
   */

  const CEILING = 0.5

  for (const route of HELD) {
    test(`${route.path} keeps no block more than half a hole`, async ({
      page,
    }) => {
      test.skip(
        test.info().project.name !== 'desktop',
        'the twelve-column composition this measures exists on desktop'
      )
      test.setTimeout(120_000)
      await page.setViewportSize({ width: 1440, height: 900 })

      const blocks = await measure(page, route.path, route.selector)
      expect(
        blocks.length,
        `${route.path}: no ${route.label} matched, so this proves nothing`
      ).toBeGreaterThan(0)

      const holes = blocks
        .map((block, index) => ({ index, share: block.voidShare, block }))
        .filter((entry) => entry.share > CEILING)

      expect(
        holes.map(
          (entry) =>
            `${route.label} #${entry.index}: ${pct(entry.share)} empty = ${px2(entry.block.largestVoid)}`
        ),
        `${route.path} was measured at ${pct(route.measuredToday)} when this gate was written`
      ).toEqual([])
    })
  }
})
