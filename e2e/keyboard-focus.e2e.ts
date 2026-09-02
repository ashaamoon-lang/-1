/**
 * Keyboard focus sweep.
 *
 * `docs/ROADMAP.md` lists "cek fokus keyboard menyeluruh" as Tahap 5 work.
 * axe cannot do it: it inspects a static tree and says nothing about what
 * happens as someone tabs through a page. These are the three failures that
 * actually strand a keyboard user, and none of them is visible in a
 * screenshot:
 *
 *  - focus lands on something with no visible indicator, so the reader cannot
 *    tell where they are;
 *  - focus lands outside the viewport with no scroll, so it is invisible;
 *  - focus enters a control the layout hides (a collapsed mobile menu), which
 *    is a trap in the sense that matters — the reader is somewhere they cannot
 *    see and cannot leave except by tabbing blind.
 */

import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

const ROUTES = ['/en', `/en/work/${FEATURED_WORK}`, '/en/ai']
const MAX_TABS = 40

test.describe('keyboard focus', () => {
  for (const route of ROUTES) {
    test(`${route}: every focus stop is visible and indicated`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(600)

      const problems: string[] = []
      const seen: string[] = []

      for (let i = 0; i < MAX_TABS; i += 1) {
        await page.keyboard.press('Tab')

        const state = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body) return null

          const style = getComputedStyle(el)
          const rect = el.getBoundingClientRect()

          // A focus indicator is an outline, a ring drawn as a box-shadow, or
          // a border the focused state changed. Anything is fine — none is
          // not.
          const hasOutline =
            style.outlineStyle !== 'none' &&
            Number.parseFloat(style.outlineWidth) > 0
          const hasShadow = style.boxShadow !== 'none'

          return {
            tag: el.tagName.toLowerCase(),
            label: (el.textContent ?? '').trim().slice(0, 30),
            hasIndicator: hasOutline || hasShadow,
            // Zero-sized elements are legitimately invisible (a skip link
            // before it is focused is not one — it grows on focus).
            visible: rect.width > 0 && rect.height > 0,
            inViewport:
              rect.bottom > 0 &&
              rect.top < window.innerHeight &&
              rect.right > 0 &&
              rect.left < window.innerWidth,
            hidden: style.visibility === 'hidden' || style.display === 'none',
          }
        })

        if (!state) break

        const id = `${state.tag}:${state.label}`
        // A cycle back to the first stop means the tab order closed; stop.
        if (seen.length > 2 && id === seen[0]) break
        seen.push(id)

        if (state.hidden) problems.push(`${id} — focused while hidden`)
        else if (!state.visible) problems.push(`${id} — focused with zero size`)
        else if (!state.hasIndicator) {
          problems.push(`${id} — no visible focus indicator`)
        } else if (!state.inViewport) {
          problems.push(`${id} — focused outside the viewport`)
        }
      }

      expect(
        seen.length,
        `${route} has no keyboard-reachable controls`
      ).toBeGreaterThan(0)
      expect(problems, `${route} focus problems`).toEqual([])
    })
  }

  test('the skip link is the first stop and reaches main', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.keyboard.press('Tab')

    const first = page.locator(':focus')
    await expect(first).toHaveAttribute('href', '#main-content')

    // Visible once focused — a skip link that stays `sr-only` on focus is
    // there for a checklist, not for a reader.
    await expect(first).toBeVisible()
    await expect(page.locator('#main-content')).toHaveCount(1)
  })
})
