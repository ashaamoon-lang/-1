import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * Images carry enough real pixels for the density they are displayed at.
 *
 * ## Why this does not use `naturalWidth`
 *
 * Tahap 5 audited image sizing with a "rendered / natural / requested" table
 * built on `naturalWidth`, found every row a good fit, and shipped. It could
 * not have found anything else. On an `<img>` with a `w`-descriptor srcset,
 * `naturalWidth` is **density-corrected**:
 *
 *     naturalWidth = real_pixels × sizes_width ÷ descriptor
 *
 * so it reports `sizes` measured against itself, and always agrees. Verified
 * during the audit: the same image reported 1036 at viewport 1440 and 921 at
 * 1280, while the bitmap was 1440×900 in both cases. Meanwhile the source was
 * capped at half the pixels the layout needed (`docs/AUDIT-2026-08.md` §1.2).
 *
 * A wrongly shaped gate is worse than no gate, because it produces a green
 * check. So this fetches `currentSrc` and decodes it — the real pixel count,
 * which nothing can correct away — and compares it against the CSS box times
 * the device pixel ratio.
 *
 * Runs under both Playwright projects, so dpr 1 and dpr 3 are both covered;
 * the defect was invisible at dpr 1, which is the only density Tahap 5
 * measured.
 */

/** Below this, the image is being upscaled on screen. */
const MIN_RATIO = 0.95

const ROUTES = ['/en', `/en/work/${FEATURED_WORK}`]

test.describe('images are not upscaled', () => {
  for (const route of ROUTES) {
    test(`${route} delivers enough pixels`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' })

      // Gallery images below the fold are lazy; scroll so they commit to a
      // `currentSrc` before measuring, then return to the top.
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        window.scrollTo(0, 0)
      })

      const measured = await page.evaluate(async (min) => {
        const rows: {
          alt: string
          needed: number
          delivered: number
          ratio: number
        }[] = []

        for (const img of document.querySelectorAll('img')) {
          const rect = img.getBoundingClientRect()
          if (rect.width < 40 || !img.currentSrc) continue

          const needed = Math.round(rect.width * window.devicePixelRatio)

          // The decoded bitmap, not `naturalWidth`. See the note above.
          const blob = await (await fetch(img.currentSrc)).blob()
          const bitmap = await createImageBitmap(blob)
          const delivered = bitmap.width
          bitmap.close()

          rows.push({
            alt: (img.alt || '(no alt)').slice(0, 40),
            needed,
            delivered,
            ratio: +(delivered / needed).toFixed(2),
          })
        }

        return { rows, tooSmall: rows.filter((row) => row.ratio < min) }
      }, MIN_RATIO)

      // An empty page would make the assertion below vacuous.
      expect(measured.rows.length).toBeGreaterThan(0)

      const report = measured.tooSmall
        .map(
          (row) =>
            `${row.alt}: needed ${row.needed}px, got ${row.delivered}px (${row.ratio}x)`
        )
        .join('\n')

      expect(measured.tooSmall, report).toEqual([])
    })
  }
})
