import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * The site keeps moving — Tahap 33.
 *
 * ## The measurement this file exists to hold
 *
 * The project owner judged the site under-animated. That was measured rather
 * than argued: each route was scrolled through eight positions and the
 * elements carrying a non-identity `transform` were counted at each one.
 *
 * | route      | before          | after            |
 * | ---------- | --------------- | ---------------- |
 * | `/en/work` | 0 of 79, **1 distinct frame across 4.5 screens** | 6 of 85, 8 frames |
 * | `/en`      | 11 of 127, 7    | 14 of 131, 9     |
 * | a project  | 1 of 43, 4      | 3 of 45, 8       |
 *
 * The catalogue — the portfolio page — did not move at all. The site's motion
 * was entrance motion: blocks arrived and froze. These tests hold the
 * difference, and the first one goes red against the site as it was.
 */

const SAMPLES = 8

/** Elements carrying a transform, sampled down the page. */
async function frames(page: Page, path: string): Promise<string[]> {
  await page.goto(path)
  await page.waitForTimeout(2200)

  const height = await page.evaluate(
    () => document.documentElement.scrollHeight
  )
  const seen: string[] = []

  for (let i = 0; i <= SAMPLES; i += 1) {
    await page.evaluate((y) => window.scrollTo(0, y), (height * i) / SAMPLES)
    await page.waitForTimeout(400)
    seen.push(
      await page.evaluate(() =>
        [...document.querySelectorAll('main *')]
          .map((el) => getComputedStyle(el).transform)
          .filter((t) => t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)')
          .slice(0, 30)
          .join('|')
      )
    )
  }

  return seen
}

test.describe('the page keeps moving as it is read', () => {
  for (const path of ['/en/work', `/en/work/${FEATURED_WORK}`]) {
    test(`${path} is not a still photograph`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.setViewportSize({ width: 1440, height: 900 })

      const distinct = new Set(await frames(page, path))

      /*
       * Proved red on 2026-09-04: the catalogue returned one signature at
       * every position, because nothing on it carried a transform at all.
       */
      expect(
        distinct.size,
        `the page rendered ${distinct.size} distinct frame(s) across ${SAMPLES + 1} scroll positions — nothing moves as it is read`
      ).toBeGreaterThan(3)
    })
  }

  test('prose never acquires a scroll-linked transform', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(`/en/work/${FEATURED_WORK}`)
    await page.waitForTimeout(2200)
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight / 3)
    )
    await page.waitForTimeout(600)

    /*
     * The rule the parallax preset states and Tahap 23 was right about:
     * media only. A paragraph that drifts against its own column hurts
     * reading comfort, and it is the single way this kind of motion goes
     * wrong.
     */
    const moved = await page.evaluate(() =>
      [...document.querySelectorAll('main p, main li')]
        .filter((el) => {
          const t = getComputedStyle(el).transform
          return t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)'
        })
        .map((el) => el.textContent?.trim().slice(0, 40) ?? '')
    )

    expect(
      moved,
      `these text blocks are being moved: ${moved.join(' / ')}`
    ).toEqual([])
  })

  test('reduced motion leaves every plate where the layout put it', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/work')
    await page.waitForTimeout(2200)
    await page.evaluate(() => window.scrollTo(0, 900))
    await page.waitForTimeout(700)

    const moved = await page.evaluate(
      () =>
        [...document.querySelectorAll('[class*="parallax"]')].filter((el) => {
          const t = getComputedStyle(el).transform
          return t && t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)'
        }).length
    )

    expect(
      moved,
      'a plate is still being displaced under prefers-reduced-motion'
    ).toBe(0)
  })

  test('the travelling layer never shows its own frame', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/work')
    await page.waitForTimeout(2200)

    const exposed: string[] = []
    for (const y of [0, 600, 1400, 2200]) {
      await page.evaluate((v) => window.scrollTo(0, v), y)
      await page.waitForTimeout(500)
      const gaps = await page.evaluate(() => {
        const out: number[] = []
        for (const media of document.querySelectorAll('[class*="media"]')) {
          const inner = media.querySelector('[class*="parallax"]')
          if (!inner) continue
          const frame = media.getBoundingClientRect()
          const layer = inner.getBoundingClientRect()
          out.push(Math.max(layer.top - frame.top, frame.bottom - layer.bottom))
        }
        return out
      })
      const bad = gaps.filter((gap) => gap > 0.5)
      if (bad.length > 0) exposed.push(`y=${y}: ${bad.length} plate(s)`)
    }

    // The overshoot on the travelling layer exists exactly to prevent this;
    // the preset names it as the way parallax layers go wrong.
    expect(exposed, exposed.join(', ')).toEqual([])
  })
})
