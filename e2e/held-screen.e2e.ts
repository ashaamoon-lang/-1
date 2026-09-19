import { expect, test } from '@playwright/test'

/**
 * A box that holds a screen fills it.
 *
 * ## The defect this was written for
 *
 * `/studio`'s hero holds `calc(100svh - header - lead)` for a documented motion
 * reason — Tahap 25 §2.2 measured the statement below it already a third
 * revealed at `scrollY 0`, and no `start` value fixes a scrub on an element
 * that is already on screen. The height is load-bearing and was re-checked in
 * Tahap 69 §1.1: the statement begins at 980 against a fold of 900, so the
 * 780px box buys exactly 80px of margin.
 *
 * What nothing checked is whether anything is *in* it. Measured on the
 * production build, the hero's content stopped at 439 of a box ending at 932 —
 * **493px, 63% of the box, empty** — and both columns stopped at the same
 * height, so it was not the home page's diagonal but a band of content with
 * dead ground under it.
 *
 * And it got worse as the screen got bigger: 55% at 1280x720, 63% at 1440x900,
 * **68% at 1728x1117**. That is the signature of the defect rather than a
 * side-effect of it — the box is tied to the viewport and its contents are
 * not, so every extra pixel of screen becomes an extra pixel of nothing.
 *
 * ## Why the threshold is not a taste number
 *
 * `taste-preflight` refuses to pick an arbitrary bound for `border-radius`,
 * and the same objection would apply to "a hero must be N% full" if N were
 * chosen by feel. It was not. Every held box on this site was measured first,
 * at four viewports and both locales:
 *
 * ```
 *                          1280x720   1440x900   1728x1117   390x844
 *   home hero (100svh)         8%         7%          7%        6%
 *   /work masthead             0%         0%          0%        0%
 *   /journal masthead          0%         0%          0%        0%
 *   /practice hero             0%         0%          0%        0%
 *   /studio hero              55%        63%         68%       35%
 * ```
 *
 * Every shipped composition sits at 0-8%. The defect sits at 35-68%. The bound
 * below is placed in the gap, far from both edges, so it neither flatters the
 * defect nor polices the compositions that are already right. A number with a
 * 27-point margin on each side is a separation in the data, not an opinion.
 *
 * ## What this deliberately does not cover
 *
 * Boxes shorter than `HELD_FRACTION` of the viewport. A masthead that is 31%
 * of the screen is not claiming the screen, and a tail measured against a
 * small box says nothing: 25% of a 280px masthead is 70px, which is one
 * ordinary block of padding. The rule is about boxes that take a screen and
 * owe the reader something for it.
 */

/** A box counts as holding the screen at this fraction of the viewport. */
const HELD_FRACTION = 0.6

/**
 * The most of itself a held box may leave empty at its foot.
 *
 * See the measurements above: shipped compositions reach 8%, the defect starts
 * at 35%.
 */
const TAIL_MAX = 0.25

/**
 * The heroes and mastheads that open a route.
 *
 * Listed rather than discovered: "the first big box on the page" would sweep
 * up the full-bleed wash and grain layers, which are `aria-hidden` decoration
 * that carries no information and would report every route as full. That is
 * the instrument error Tahap 67 made once already.
 */
const HELD = [
  { path: '/en', selector: '[data-epic="hero-arrival"]', what: 'home hero' },
  { path: '/id', selector: '[data-epic="hero-arrival"]', what: 'home hero' },
  { path: '/en/studio', selector: 'main header', what: 'studio hero' },
  { path: '/id/studio', selector: 'main header', what: 'studio hero' },
  {
    path: '/en/practice/consulting',
    selector: 'main header',
    what: 'practice hero',
  },
] as const

test.describe('a box that holds a screen fills it', () => {
  for (const { path, selector, what } of HELD) {
    test(`${path} — the ${what} is not mostly empty`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(900)

      const measured = await page.evaluate((sel) => {
        const box = document.querySelector(sel)
        if (!box) return null
        const bounds = box.getBoundingClientRect()

        /*
         * Effective opacity, multiplied up to the held box.
         *
         * This is not defensive detail — it is the whole difference between
         * this gate working and this gate lying. Tahap 69's first fix moved
         * the capability band to the foot of the studio hero, geometry came
         * back perfect, **and the band was invisible**: it sat below
         * `useReveal`'s trigger line, so it held `opacity: 0` on the first
         * screen and the gate reported the hero full.
         *
         * A box filled with content nobody can see is the defect wearing the
         * fix's clothes, and measuring boxes alone cannot tell them apart —
         * the same failure `vault/vault-api.test.ts` was written about, found
         * here in a gate written the same week.
         */
        const litTo = (node: Element, stop: Element) => {
          let lit = 1
          let at: Element | null = node
          while (at && at !== stop.parentElement) {
            lit *= Number(getComputedStyle(at).opacity)
            if (lit === 0) return 0
            at = at.parentElement
          }
          return lit
        }

        /*
         * Leaf ink only: text that is not merely its child's text repeated up
         * the tree, plus images and canvases. Anything under `aria-hidden` is
         * decoration and is skipped — counting the grain and the grid pattern
         * is exactly how Tahap 67's first instrument reported every route as
         * full while the home page was half empty.
         */
        const ink = [...box.querySelectorAll('*')]
          .filter((el) => !el.closest('[aria-hidden="true"]'))
          .filter((el) => {
            const style = getComputedStyle(el)
            if (style.display === 'none' || style.visibility === 'hidden') {
              return false
            }
            const rect = el.getBoundingClientRect()
            if (rect.height < 4 || rect.width < 4) return false
            // Content the reader cannot see does not fill anything.
            if (litTo(el, box) < 0.01) return false
            if (el.tagName === 'IMG' || el.tagName === 'CANVAS') return true
            const text = el.textContent?.trim() ?? ''
            if (text === '') return false
            /*
             * A true leaf, and the first version of this was not.
             *
             * It excluded an element whose text matched *one* child's text,
             * which lets every multi-child container through. So the
             * invisible capability band's own `<section>` — `opacity: 1`,
             * with all four of its stranded items inside it — counted as ink
             * reaching the box's floor, and the gate vouched for content none
             * of which was visible. Exactly the thing the opacity walk above
             * was added to prevent, defeated one line later.
             *
             * Any element with a text-bearing child is a container: its ink
             * is its children's, and they are measured on their own terms.
             */
            return ![...el.children].some(
              (child) => (child.textContent?.trim() ?? '') !== ''
            )
          })
          .map((el) => el.getBoundingClientRect())

        return {
          height: Math.round(bounds.height),
          viewport: window.innerHeight,
          inkCount: ink.length,
          inkBottom: ink.length
            ? Math.round(Math.max(...ink.map((rect) => rect.bottom)))
            : null,
          boxBottom: Math.round(bounds.bottom),
        }
      }, selector)

      // Anti-vacuum: a box that was not found must fail, not silently pass.
      expect(measured, `no ${what} on ${path} at all`).not.toBeNull()
      if (!measured) return

      expect(
        measured.inkCount,
        `${what} on ${path} has no content to measure`
      ).toBeGreaterThan(0)
      if (measured.inkBottom === null) return

      // Short boxes are not claiming the screen — see the note above.
      test.skip(
        measured.height < measured.viewport * HELD_FRACTION,
        `${what} is ${measured.height}px of a ${measured.viewport}px screen — not holding it`
      )

      const tail = measured.boxBottom - measured.inkBottom
      const share = tail / measured.height

      expect(
        share,
        `${what} on ${path} holds ${measured.height}px and leaves ${tail}px (${Math.round(share * 100)}%) of itself empty at the foot. A box that takes a screen owes the reader something in it — fill it with content the page already has, or stop claiming the height.`
      ).toBeLessThanOrEqual(TAIL_MAX)
    })
  }
})
