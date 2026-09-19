import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { FEATURED_WORK } from './fixtures'

/**
 * One thing is epic at a time.
 *
 * ## What this replaces, and why replacing it was the point
 *
 * `MOTION-SPEC.md` §9.5 capped choreographed moments per page — two, then
 * three from Tahap 49. `e2e/interaction-grammar.e2e.ts` enforces that count.
 *
 * But the count was never the thing worth protecting. Award sites do not make
 * everything epic because **a page where everything is epic has nothing
 * epic** — and on a short page, capping the number is a crude way to get
 * there. On a page with a 110svh hero and a 300vh pinned passage it is the
 * wrong instrument entirely: such a page can hold many moments *in sequence*
 * without any of them competing, and a count says nothing about whether they
 * compete.
 *
 * So Tahap 60 widened the count sharply (3 → 12 on the brand routes) and put
 * the real invariant here instead:
 *
 *   Two moments with **different names**, neither **nested** inside the
 *   other, must not occupy the same scroll range.
 *
 * That is stricter about quality and far looser about quantity, which is
 * exactly the trade the direction asked for.
 *
 * ## The two exemptions are measured, not assumed
 *
 * The naive rule — no two `[data-epic]` boxes may overlap — is red on five of
 * seven routes, and every one of those is legitimate. Measured at 1440x900:
 *
 *   /en/work   catalogue-sift  594..3624
 *              work-transport  594..1514  nested   overlap 920px
 *   /en        work-transport 6132..7051
 *              work-transport 6132..7051           overlap 919px
 *
 * 1. **Same name.** `work-transport` is marked once per card
 *    (`vault/blocks/project-card`). Six overlapping instances are *one moment
 *    rendered six times*, not six moments colliding.
 * 2. **Nested.** `work-transport` inside `catalogue-sift`,
 *    `journal-transport` inside `journal-index`. A per-item moment inside a
 *    list-level moment is correct composition.
 *
 * With both exemptions the rule is green on all seven routes today — a gate
 * that describes the site as it is, and catches the next one.
 *
 * ## Scroll range is not the element box
 *
 * A pinned moment owns far more scroll than its box. Measured on `/en`:
 *
 *   arth-passage   element box   1109..2009  (900px)
 *                  pin-spacer    1109..4259  (3150px)  <- what it owns
 *   next moment                  4339..
 *
 * Reading the element box alone would conclude the passage ends at 2009 and
 * treat 2009–4259 as free. GSAP's pin spacer is what actually occupies the
 * document, so a moment's range is **the nearest `.pin-spacer` ancestor's box
 * when there is one, and its own box when there is not**. The real gap
 * between the passage and the first card is 80px.
 */

/**
 * Touching is not overlapping.
 *
 * Ranges are rounded to whole pixels, so two sections that abut report an
 * overlap of 0. The tolerance absorbs sub-pixel layout — a fractional gap
 * that rounds the wrong way is not two moments competing for a reader's
 * attention.
 */
const TOLERANCE = 8

const ROUTES = [
  '/en',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  '/en/studio',
  '/en/journal',
  '/en/journal/scope-is-the-deliverable',
  ...PRACTICES.map((value) => `/en/practice/${value}`),
]

test.describe('one thing is epic at a time', () => {
  for (const route of ROUTES) {
    test(`${route} runs its choreographed moments in sequence`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      // ScrollTrigger creates its pin spacers on first refresh, and the range
      // this gate reads does not exist until it has.
      await page.waitForTimeout(900)

      const moments = await page.evaluate(() => {
        const scroll = window.scrollY

        return [...document.querySelectorAll('[data-epic]')].map((el) => {
          /*
           * The spacer, when GSAP made one — see the note above. `closest`
           * rather than a parent check: ScrollTrigger wraps the pinned
           * element, but not always as its direct parent.
           */
          const spacer = el.closest('.pin-spacer')
          const box = (spacer ?? el).getBoundingClientRect()

          return {
            name: el.getAttribute('data-epic') ?? '',
            top: Math.round(box.top + scroll),
            bottom: Math.round(box.bottom + scroll),
            // Whether *this* element sits inside another named moment.
            nested: el.parentElement?.closest('[data-epic]') != null,
          }
        })
      })

      expect(
        moments.length,
        `${route} declares no choreographed moment at all — either it has none, or one is unmarked and \`interaction-grammar\` is the gate that says so`
      ).toBeGreaterThan(0)

      const collisions: string[] = []

      for (const [index, a] of moments.entries()) {
        for (const b of moments.slice(index + 1)) {
          // One moment rendered many times, not many moments colliding.
          if (a.name === b.name) continue
          // A per-item moment inside a list-level one is composition.
          if (a.nested || b.nested) continue

          const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)

          if (overlap > TOLERANCE) {
            collisions.push(
              `"${a.name}" (${a.top}..${a.bottom}) and "${b.name}" (${b.top}..${b.bottom}) share ${overlap}px of scroll`
            )
          }
        }
      }

      expect(
        collisions,
        `${route}: two choreographed moments compete for the same scroll. A page may spend many moments — it may not spend two at once`
      ).toEqual([])
    })
  }
})
