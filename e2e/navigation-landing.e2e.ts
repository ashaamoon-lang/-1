import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { FEATURED_WORK } from './fixtures'

/**
 * Where a reader lands after pressing a link.
 *
 * ## The defect this exists for
 *
 * `components/ui/link` shipped `scroll={false}` from the fork, so every
 * internal navigation kept the **previous** page's scroll offset. Measured on
 * the production build before the fix:
 *
 *   - `/en` at scroll 3520 (the practice disclosure) to
 *     `/en/practice/consulting` → landed at 1522, the page's maximum, with its
 *     `<h1>` 1136px above the fold;
 *   - `/en` to `/en/work/arus-balik` → landed at 1047, title 917px out of view;
 *   - `/en/work` to the same project → landed at 394.
 *
 * A reader asking for a page arrived at the end of it. Sixteen stages of gates
 * were green throughout, because not one of them asked where a navigation
 * *ends up* — every route test used `page.goto`, which always starts at zero.
 *
 * ## Why it is not only a comfort problem
 *
 * React gives a `<ViewTransition>` a `view-transition-name` only when the
 * element is **in the viewport** at commit time, and drops it again otherwise
 * (`applyViewTransitionToHostInstancesRecursive` returns `inViewport`; the
 * caller restores the name when it is false). With the destination scrolled
 * away, only the outgoing half of each pair was named, so every morph on the
 * site degraded to a cross-fade with no group and no `new` half.
 * `e2e/motion.e2e.ts` holds that end; this file holds the cause.
 *
 * ## What this cannot catch
 *
 * It asserts the resting position after a navigation settles, not the frames
 * in between: a page that jumps to the top and animates back down would pass.
 * It also cannot see a destination whose own content shifts after the assert.
 */

/** Long enough for the transition, the reveal and any scroll to settle. */
const SETTLED = 2500

async function landing(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1')
    const rect = h1?.getBoundingClientRect()
    return {
      y: Math.round(window.scrollY),
      heading: h1?.textContent?.trim() ?? null,
      headingTop: rect ? Math.round(rect.top) : null,
      viewport: window.innerHeight,
    }
  })
}

/**
 * Presses a link and reports where the reader ended up.
 *
 * The href is matched exactly rather than by text, so a copy change cannot
 * quietly turn this into a test of a different link.
 */
async function navigate(
  page: Page,
  from: string,
  to: string,
  prepare?: (page: Page) => Promise<void>
) {
  await page.goto(from)
  await page.waitForTimeout(1200)
  if (prepare) await prepare(page)

  const link = page.locator(`a[href="${to}"]`).first()
  await expect(link, `no link to ${to} on ${from}`).toBeVisible()
  await link.click()
  await page.waitForURL(`**${to.replace(/^\/[a-z]{2}/, '')}`)
  await page.waitForTimeout(SETTLED)

  return landing(page)
}

function assertLandedAtTheTop(
  result: Awaited<ReturnType<typeof landing>>,
  where: string
) {
  expect(
    result.y,
    `${where} kept the previous page's scroll offset — the reader landed ${result.y}px down`
  ).toBe(0)

  // The stronger claim, and the one that decides whether a morph can form:
  // the destination's own title has to be on screen.
  expect(result.headingTop, `${where} rendered no h1`).not.toBeNull()
  expect(
    result.headingTop ?? -1,
    `${where} left its heading "${result.heading}" outside the viewport at ${result.headingTop}px`
  ).toBeGreaterThanOrEqual(0)
  expect(
    result.headingTop ?? Number.POSITIVE_INFINITY,
    `${where} put its heading below the fold at ${result.headingTop}px`
  ).toBeLessThan(result.viewport)
}

test.describe('a navigation lands at the top of the page it asked for', () => {
  test('home → a practice page', async ({ page }) => {
    const result = await navigate(
      page,
      '/en',
      `/en/practice/${PRACTICES[0]}`,
      async (p) => {
        // The link lives inside a closed `<details>`; a reader opens it first.
        await p.locator('#practice summary').first().click()
        await p.waitForTimeout(700)
      }
    )
    assertLandedAtTheTop(result, 'home → practice')
  })

  test('home → a project page', async ({ page }) => {
    const result = await navigate(page, '/en', `/en/work/${FEATURED_WORK}`)
    assertLandedAtTheTop(result, 'home → project')
  })

  test('the catalogue → a project page', async ({ page }) => {
    const result = await navigate(page, '/en/work', `/en/work/${FEATURED_WORK}`)
    assertLandedAtTheTop(result, 'catalogue → project')
  })

  test('a practice page → the next practice', async ({ page }) => {
    const result = await navigate(
      page,
      `/en/practice/${PRACTICES[0]}`,
      `/en/practice/${PRACTICES[1]}`
    )
    assertLandedAtTheTop(result, 'practice → next practice')
  })
})
