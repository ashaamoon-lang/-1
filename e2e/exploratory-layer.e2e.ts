import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The exploratory layer — Tahap 43.
 *
 * ## What this file holds, and the numbers it was written against
 *
 * `DESIGN_VARIANCE` was set to 7 in Tahap 34 and the catalogue kept running
 * at 3. Measured on the production build at 1440x900, six works:
 *
 * | card | x   | y (document) | w   | h   |
 * | ---- | --- | ------------ | --- | --- |
 * | 0    | 16  | 506          | 691 | 919 |
 * | 1    | 723 | 506          | 691 | 919 |
 * | 2    | 16  | 1441         | 691 | 919 |
 * | 3    | 723 | 1441         | 691 | 919 |
 * | 4    | 16  | 2376         | 691 | 919 |
 * | 5    | 723 | 2376         | 691 | 919 |
 *
 * Two distinct `x`. Three distinct `y`. A row pitch of 935px three times
 * running, and **three of three rows with both cards sharing an identical
 * top**. A grid a reader can predict in full from its first two cards.
 *
 * `rows never run in lockstep` is the assertion that goes red against that,
 * and it is written as "not every row" rather than "no row" on purpose: an
 * offset pattern with three values will still align some rows, and demanding
 * that none ever line up would be demanding randomness. Randomness reads as a
 * bug; a repeating three-value figure reads as a decision.
 *
 * The other assertions are the guard rails that keep the composition from
 * becoming a trick — cards that never overlap, a drift difference that stays
 * inside the band, information that never lives only in the cursor, and a
 * theme that survives with JavaScript switched off.
 */

const SCROLL_SAMPLES = 12

interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
}

/** Card boxes in document coordinates, so a scrolled sample is comparable. */
async function cardBoxes(page: Page): Promise<Box[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('ul li[data-flip-id]')].map((li) => {
      const r = li.getBoundingClientRect()
      return {
        id: li.getAttribute('data-flip-id') ?? '',
        x: r.x,
        y: r.y + window.scrollY,
        w: r.width,
        h: r.height,
      }
    })
  )
}

function overlaps(a: Box, b: Box): boolean {
  /*
   * A one-pixel tolerance, because sub-pixel layout puts adjacent edges at
   * 706.9999 and 707.0001 and a strict comparison would call that an overlap
   * on some runs and not others. The defect this guards against is a card
   * sitting *on top of* another, which is tens of pixels, never one.
   */
  const gap = 1
  return (
    a.x < b.x + b.w - gap &&
    b.x < a.x + a.w - gap &&
    a.y < b.y + b.h - gap &&
    b.y < a.y + a.h - gap
  )
}

test.describe('the catalogue composes rather than repeats', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('rows never run in lockstep', async ({ page }) => {
    await page.goto('/en/work')
    await page.waitForTimeout(1200)

    const boxes = await cardBoxes(page)
    // Anti-vacuum: an empty catalogue would pass every assertion below.
    expect(boxes.length).toBeGreaterThanOrEqual(4)

    const tops = boxes.map((b) => Math.round(b.y))
    const columns = new Set(boxes.map((b) => Math.round(b.x)))
    expect(columns.size).toBeGreaterThanOrEqual(2)

    /*
     * Group by column, then ask how many cards in the *second* column share a
     * top with a card in the first. Measured before this stage: every one of
     * them. The composition is doing its job when at least one card in the
     * grid sits at a top no card in the other column shares.
     */
    const byColumn = new Map<number, number[]>()
    for (const box of boxes) {
      const key = Math.round(box.x)
      byColumn.set(key, [...(byColumn.get(key) ?? []), Math.round(box.y)])
    }
    const [first = [], second = []] = [...byColumn.values()]
    const shared = second.filter((y) =>
      first.some((other) => Math.abs(other - y) <= 2)
    )

    expect(
      shared.length,
      `every card in column two shares a top with column one (${tops.join(', ')})`
    ).toBeLessThan(second.length)
  })

  test('cards never overlap, at any scroll position', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/en/work')
    await page.waitForTimeout(1500)

    const height = await page.evaluate(
      () => document.documentElement.scrollHeight
    )

    for (let i = 0; i <= SCROLL_SAMPLES; i += 1) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        (height * i) / SCROLL_SAMPLES
      )
      await page.waitForTimeout(220)

      const boxes = await cardBoxes(page)
      expect(boxes.length).toBeGreaterThanOrEqual(4)

      for (let a = 0; a < boxes.length; a += 1) {
        for (let b = a + 1; b < boxes.length; b += 1) {
          const one = boxes[a]
          const two = boxes[b]
          if (!one || !two) continue
          expect(
            overlaps(one, two),
            `${one.id} overlaps ${two.id} at scroll ${Math.round((height * i) / SCROLL_SAMPLES)}`
          ).toBe(false)
        }
      }
    }
  })

  test('the two columns drift by a readable difference, not a large one', async ({
    page,
  }) => {
    await page.goto('/en/work')
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
    await page.waitForTimeout(700)

    /*
     * The parallax runs on the media wrapper inside each card, so the
     * difference is read there rather than on the `<li>`, whose position is
     * layout and does not move.
     */
    const shifts = await page.evaluate(() =>
      [...document.querySelectorAll('ul li[data-flip-id]')].map((li) => {
        const media = li.querySelector('[class*="parallax"]')
        const t = media ? getComputedStyle(media).transform : 'none'
        const m = /matrix\([^)]*,\s*([-\d.]+)\)$/.exec(t)
        return {
          x: Math.round(li.getBoundingClientRect().x),
          y: m?.[1] ? Number.parseFloat(m[1]) : 0,
        }
      })
    )
    expect(shifts.length).toBeGreaterThanOrEqual(4)

    const columns = [...new Set(shifts.map((s) => s.x))].sort((a, b) => a - b)
    expect(columns.length).toBeGreaterThanOrEqual(2)

    const mean = (xs: number[]) =>
      xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length
    const left = mean(shifts.filter((s) => s.x === columns[0]).map((s) => s.y))
    const right = mean(shifts.filter((s) => s.x === columns[1]).map((s) => s.y))

    // Anti-vacuum: zero on both sides would satisfy any upper bound.
    expect(
      Math.abs(left - right),
      `columns drift identically (${left} vs ${right})`
    ).toBeGreaterThan(0.5)
    // The plan's ceiling: a difference, not a divergence.
    expect(Math.abs(left - right)).toBeLessThanOrEqual(60)
  })
})

test.describe('the cursor carries nothing the page does not also say', () => {
  test('every cursor payload also exists in the DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/work')
    await page.waitForTimeout(1200)

    const carriers = await page.evaluate(() =>
      [...document.querySelectorAll('[data-cursor-label]')].map((el) => ({
        label: el.getAttribute('data-cursor-label') ?? '',
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
      }))
    )

    // Anti-vacuum: this stage is what puts payloads on the page at all.
    expect(carriers.length).toBeGreaterThan(0)

    for (const carrier of carriers) {
      const digits = carrier.label.replace(/\D+/g, '')
      expect(
        carrier.text.replace(/\D+/g, '').includes(digits),
        `cursor says "${carrier.label}" but the element reads "${carrier.text}"`
      ).toBe(true)
    }
  })
})

test.describe('the journal is a reading surface', () => {
  for (const path of ['/en/journal', '/en/journal/scope-is-the-deliverable']) {
    test(`${path} renders its theme without JavaScript`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false })
      const page = await context.newPage()
      await page.goto(path)

      const theme = await page.evaluate(() => {
        const themed = document.querySelector('[data-theme]')
        return themed?.getAttribute('data-theme') ?? null
      })

      expect(theme, `${path} shipped no theme without JavaScript`).toBe('light')
      await context.close()
    })
  }
})

test.describe('icons name actions', () => {
  for (const path of ['/en/work', '/en/work/arus-balik']) {
    test(`${path} ships no unnamed icon`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(path)
      await page.waitForTimeout(800)

      const unnamed = await page.evaluate(() =>
        [...document.querySelectorAll('svg')]
          .filter((svg) => {
            // An icon is fine when it is decoration, or when the control
            // around it carries the name.
            if (svg.getAttribute('aria-hidden') === 'true') return false
            if (svg.getAttribute('aria-label')) return false
            if (svg.querySelector('title')) return false
            return !svg.closest('[aria-label], button, a')
          })
          .map((svg) => svg.outerHTML.slice(0, 80))
      )

      expect(unnamed, unnamed.join('\n')).toEqual([])
    })
  }
})
