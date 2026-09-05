import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The scale has a floor, a ceiling, and no cliff — Tahap 36.
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
 * ## The four claims
 *
 * A readability floor, no cliff, a ceiling, and — the one that keeps this a
 * *bounding* change rather than a redesign — the two design anchors must not
 * move.
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

/** Ceilings, from `docs/stages/TAHAP-36.md` §3.1. */
const CEILING_PX = {
  h1: 160,
  caption: 14,
  gap: 20,
  safe: 20,
  header: 80,
} as const

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
      caption: size('.caption'),
      texts: sizes.length,
      smallest: sizes.length > 0 ? Math.min(...sizes) : 0,
    }
  })
}

test.describe('the scale is bounded and continuous', () => {
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

  test('nothing grows past its ceiling', async ({ page }) => {
    const measured = await sample(page, 2560)

    for (const [key, ceiling] of Object.entries(CEILING_PX)) {
      const value = measured[key as keyof typeof CEILING_PX]
      expect(value, `${key} unmeasured`).toBeGreaterThan(0)
      expect(
        value,
        `${key} reaches ${value.toFixed(1)}px at 2560px`
      ).toBeLessThanOrEqual(ceiling)
    }
  })

  /*
   * The assertion that keeps this a bounding change and not a redesign.
   * `typography.ts` and `layout.mjs` are the design; the curve has to pass
   * through both of their anchors exactly.
   */
  test('the two design anchors do not move', async ({ page }) => {
    const mobile = await sample(page, 375)
    const desktop = await sample(page, 1440)

    expect(mobile.h1).toBeCloseTo(38, 0)
    expect(mobile.caption).toBeCloseTo(11, 0)
    expect(mobile.gap).toBeCloseTo(16, 0)
    expect(mobile.safe).toBeCloseTo(16, 0)
    expect(mobile.header).toBeCloseTo(58, 0)

    expect(desktop.h1).toBeCloseTo(120, 0)
    expect(desktop.caption).toBeCloseTo(12, 0)
    expect(desktop.gap).toBeCloseTo(16, 0)
    expect(desktop.safe).toBeCloseTo(16, 0)
    expect(desktop.header).toBeCloseTo(72, 0)
  })
})
