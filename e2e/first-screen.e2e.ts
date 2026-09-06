import { expect, test } from '@playwright/test'

/**
 * A catalogue shows work on its first screen.
 *
 * ## Why this file exists, and why it runs at two widths
 *
 * Tahap 51 gave `/work` a masthead and measured `min-height: 60svh`. The
 * number is 60% of the screen only in isolation: in place the box sits below
 * the page's own top padding (`--header-height` + 80px, clearing the fixed
 * header) and above the filter and the count — 194px at 1440. The first cover
 * landed at 886px of a 900px screen.
 *
 * That is not only a proportion. `lib/hooks/use-reveal.ts` reveals a block
 * when its top passes 75% of the viewport, so a grid pushed past that line
 * never opens: every cover sat at `opacity: 0` until the reader scrolled, and
 * `catalogue-sift` — the animation that answers a chip press — played where
 * nobody could see it.
 *
 * Two gates caught it, and both caught it by accident: `catalogue-layout`'s
 * departing-cards test and `motion`'s back-navigation test both measure at
 * scroll 0, and both had silently depended on the grid being open on load —
 * true only while the masthead was 192px. Nothing measured it on purpose.
 *
 * It lives in its own file rather than in `catalogue-layout.e2e.ts` because
 * how much of a page fits above the fold is a *viewport* question, and the
 * mobile project takes whole files: this way it runs at 390x844 as well,
 * without dragging thirteen FLIP-timing tests into a project that has none.
 *
 * ## What this deliberately does not cover, and the numbers for it
 *
 * `/en/practice/<v>` fails this same check today, and did before Tahap 51 —
 * its hero has been `70svh` since Tahap 15:
 *
 *   1440x900   first cover 1184px = 132%   data-reveal="hidden"   opacity 0
 *   1280x720               1008px = 140%   hidden                 0
 *    390x844               1083px = 128%   hidden                 0
 *
 * It is left out because it is a different page and `docs/ROADMAP.md` Tahap 52
 * already owns that hero — which it plans to raise to 88svh, making this
 * worse. The measurement is here so that stage starts from it. Add the route
 * to `CATALOGUE_ENTRANCES` when it is fixed.
 */

const CATALOGUE_ENTRANCES = [
  '/en/work',
  '/id/work',
  // The filtered catalogue is a real entry point, not only a click away: the
  // practice pages link straight to it (`app/[locale]/work/hrefs.ts`).
  '/en/work?practice=consulting',
]

test.describe('the catalogue opens on work', () => {
  for (const path of CATALOGUE_ENTRANCES) {
    test(`${path} shows work on its first screen`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(900)

      const first = await page.evaluate(() => {
        const card = document.querySelector('li[data-flip-id]')
        if (!card) return null
        const { top } = card.getBoundingClientRect()
        return {
          top: Math.round(top),
          viewport: window.innerHeight,
          opacity: Number(getComputedStyle(card).opacity),
        }
      })

      expect(first, 'no cards on the catalogue at all').not.toBeNull()
      if (!first) return

      expect(
        first.top,
        `the first cover starts at ${first.top}px of a ${first.viewport}px screen — the catalogue opens on nothing but its own title`
      ).toBeLessThan(first.viewport * 0.85)

      // And it is not merely present: it is visible. A cover parked at
      // `opacity: 0` behind an unfired reveal is the same blank screen.
      expect(
        first.opacity,
        'the first cover is in the viewport but still waiting for a scroll to reveal it'
      ).toBeGreaterThan(0.99)
    })
  }
})
