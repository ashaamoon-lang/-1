import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The scale has a floor and no cliff — Tahap 36.
 *
 * ## What this measures, and why nothing did before
 *
 * Every size on this site was pure linear `vw` anchored on two design widths
 * with one breakpoint at 800px, and no `clamp()` anywhere. Every gate the
 * suite had ran at 1280 or 390 — two points on a curve nobody had plotted.
 *
 * Plotted, on the production build at `/en` on 2026-09-05:
 *
 * | width | h1    | caption | --gap | --header-height |
 * | ----- | ----- | ------- | ----- | --------------- |
 * | 320   | 32.4  | **9.4** | 13.6  | 49.5            |
 * | 799   | 81.0  | 23.4    | 34.1  | 123.6           |
 * | 800   | 66.7  | **6.7** | 8.9   | 40.0            |
 * | 1440  | 120.0 | 12.0    | 16.0  | 72.0            |
 * | 2560  | 213.3 | 21.3    | 28.4  | 128.0           |
 *
 * One pixel of window width, and the caption shrank to a quarter of itself.
 * `docs/stages/TAHAP-36.md` §1 carries the full table.
 *
 * ## The two claims, and the two the fork removed
 *
 * A readability floor, and no cliff. Both protect a reader: type below 11px
 * is not read, and a caption that shrinks to a quarter of itself when the
 * window grows by one pixel is a broken page.
 *
 * It also held a **ceiling** per value at 2560px (h1 160px, caption 14px…)
 * and pinned the **design anchors** — h1 exactly 120px at 1440, 38px at 375.
 * Those fixed the scale itself, so no design could change the type size; the
 * fork removed both (`docs/FORK.md`, step 5).
 */

/** Nine widths, chosen to sit either side of every boundary that matters. */
const WIDTHS = [320, 374, 700, 799, 800, 1000, 1440, 1920, 2560] as const

/**
 * The smallest type this project accepts.
 *
 * `lib/styles/typography.ts` raised `caption` from 8px to 11px and wrote down
 * why: "a flag is not a fix". The floor is that decision, enforced at every
 * width rather than only at the design width where it was made.
 */
const MIN_FONT_PX = 11

/**
 * How far a value may fall while the viewport grows.
 *
 * Not zero: `--columns` goes 4 → 12 at the breakpoint on purpose, so
 * `--column-width` is *supposed* to drop when the grid changes. Ten percent
 * is well under the 64-74% falls measured above and well over the rounding
 * noise of a subpixel layout.
 */
const MAX_FALL = 0.1

interface Sample {
  h1: number
  caption: number
  gap: number
  safe: number
  header: number
  texts: number
  smallest: number
}

async function sample(page: Page, width: number): Promise<Sample> {
  await page.setViewportSize({ width, height: 900 })
  await page.goto('/en')
  await page.waitForTimeout(350)

  return page.evaluate(() => {
    /*
     * A probe element, because `getPropertyValue` on a custom property hands
     * back the declared `calc(…)` string rather than a resolved length.
     * Assigning it to a width and reading the computed width is what makes
     * the token a number.
     */
    const probe = document.createElement('div')
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    document.body.append(probe)
    const token = (name: string) => {
      probe.style.width = `var(${name})`
      return Number.parseFloat(getComputedStyle(probe).width)
    }
    const tokens = {
      gap: token('--gap'),
      safe: token('--safe'),
      header: token('--header-height'),
    }
    probe.remove()

    /*
     * The caption class, read on a probe of its own — the fork. It was read
     * from the first `.caption` in the document, which was the phone's MENU
     * button; the fork's menu moved MENU after the nav, and the first one
     * became a nav link that a phone restyles as a display word (71px at
     * 390, 11px on desktop). The series is about the class, so the class is
     * what is measured.
     */
    const captionProbe = document.createElement('span')
    captionProbe.className = 'caption'
    captionProbe.style.position = 'absolute'
    captionProbe.style.visibility = 'hidden'
    captionProbe.textContent = 'x'
    document.body.append(captionProbe)
    const caption = Number.parseFloat(getComputedStyle(captionProbe).fontSize)
    captionProbe.remove()

    const size = (selector: string) => {
      const el = document.querySelector(selector)
      return el ? Number.parseFloat(getComputedStyle(el).fontSize) : 0
    }

    // Every element that renders its own words, for the readability floor.
    const rendered = [...document.querySelectorAll('main *, header *')].filter(
      (el) =>
        [...el.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent ?? '').trim().length > 0
        ) && (el as HTMLElement).offsetParent !== null
    )
    const sizes = rendered.map((el) =>
      Number.parseFloat(getComputedStyle(el).fontSize)
    )

    return {
      ...tokens,
      h1: size('h1'),
      caption,
      texts: sizes.length,
      smallest: sizes.length > 0 ? Math.min(...sizes) : 0,
    }
  })
}

test.describe('the scale has a floor and no cliff', () => {
  test('nothing is rendered below the readability floor', async ({ page }) => {
    test.setTimeout(120_000)

    for (const width of WIDTHS) {
      const measured = await sample(page, width)

      // Anti-vacuum: a width that rendered no words proves nothing.
      expect(measured.texts, `${width}px rendered no text`).toBeGreaterThan(10)
      expect(
        measured.smallest,
        `${width}px renders ${measured.smallest.toFixed(1)}px type`
      ).toBeGreaterThanOrEqual(MIN_FONT_PX)
    }
  })

  test('no value falls as the viewport grows', async ({ page }) => {
    test.setTimeout(120_000)

    const series: { width: number; measured: Sample }[] = []
    for (const width of WIDTHS) {
      series.push({ width, measured: await sample(page, width) })
    }

    expect(series.length).toBe(WIDTHS.length)

    const keys = ['h1', 'caption', 'gap', 'safe', 'header'] as const
    for (let i = 1; i < series.length; i += 1) {
      const previous = series[i - 1]
      const current = series[i]
      if (!previous || !current) continue

      for (const key of keys) {
        const before = previous.measured[key]
        const after = current.measured[key]
        expect(
          before,
          `${key} unmeasured at ${previous.width}px`
        ).toBeGreaterThan(0)

        const fall = (before - after) / before
        expect(
          fall,
          `${key} falls ${(fall * 100).toFixed(1)}% from ${previous.width}px (${before.toFixed(1)}) to ${current.width}px (${after.toFixed(1)})`
        ).toBeLessThanOrEqual(MAX_FALL)
      }
    }
  })
})
