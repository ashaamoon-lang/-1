import { expect, test } from '@playwright/test'

/**
 * What is on the first screen is not left waiting for a scroll.
 *
 * ## What changed in the fork
 *
 * This file used to require that a catalogue's first item start above 85% of
 * the viewport — that a list page open on its list. Where a page puts its
 * subject is composition, and the fork removed that clause (`docs/FORK.md`,
 * step 5). A page may now open on a tall masthead, a statement, a void.
 *
 * What it still holds is the defect underneath the history below: an item
 * that **is** on screen but sits at `opacity: 0`, because the reveal waits for
 * its top to cross 75% of the viewport and the reader has not scrolled. That
 * is a blank where content is, whatever the composition.
 *
 * ## The history, and why it runs at two widths
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
 * ## What this deliberately does not cover, and why
 *
 * `/practice/<v>` puts its first cover at 132% of a 900px screen, unrevealed,
 * and that is **not** this defect. The catalogue's subject is its grid; a
 * practice page's subject is its statement — `PracticeHero`, then the scrubbed
 * `data-practice-statement`, and only then the work. A cover below the fold
 * and waiting for a scroll is the reveal system working there.
 *
 * The distinction is the whole content of this gate: it asks whether a page
 * shows *what it is about* on its first screen, and only the catalogue routes
 * are about their grid. Add a route here when its own subject is a grid, not
 * because it has one.
 */

/**
 * The routes whose subject is a list, and the selector for one item of it.
 *
 * `subject` is what the page is *about*, not merely what it contains — see the
 * note above about `/practice/<v>`, whose grid is evidence for a statement
 * rather than the point of the page.
 */
const SUBJECTS = [
  {
    path: '/en/work',
    subject: 'li[data-flip-id]',
    what: 'covers',
    one: 'cover',
  },
  {
    path: '/id/work',
    subject: 'li[data-flip-id]',
    what: 'covers',
    one: 'cover',
  },
  // The filtered catalogue is a real entry point, not only a click away: the
  // practice pages link straight to it (`app/[locale]/work/hrefs.ts`).
  {
    path: '/en/work?practice=consulting',
    subject: 'li[data-flip-id]',
    what: 'covers',
    one: 'cover',
  },
  // The journal index is its rows. Added in Tahap 52, together with that
  // page's first hero — a reading surface is exactly where a hero can quietly
  // push the reading below the fold.
  {
    path: '/en/journal',
    subject: '[data-epic="journal-index"] article',
    what: 'entries',
    one: 'entry',
  },
  {
    path: '/id/journal',
    subject: '[data-epic="journal-index"] article',
    what: 'entries',
    one: 'entry',
  },
] as const

test.describe('nothing on the first screen waits for a scroll', () => {
  for (const { path, subject, what, one } of SUBJECTS) {
    test(`${path} does not strand its first ${one} invisible`, async ({
      page,
    }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(900)

      const first = await page.evaluate((selector) => {
        const node = document.querySelector(selector)
        if (!node) return null
        const { top } = node.getBoundingClientRect()
        return {
          top: Math.round(top),
          viewport: window.innerHeight,
          opacity: Number(getComputedStyle(node).opacity),
        }
      }, subject)

      expect(first, `no ${what} on ${path} at all`).not.toBeNull()
      if (!first) return

      // Below the fold is the page's choice, and a reveal waiting there for
      // the reader is the reveal working. Reported, not judged.
      if (first.top >= first.viewport) {
        console.log(
          `FIRST-SCREEN ${path} first ${one} at ${first.top}px of ${first.viewport}px — below the fold`
        )
        return
      }

      // On screen, it must be visible. An item parked at `opacity: 0` behind
      // an unfired reveal is a blank where content is.
      expect(
        first.opacity,
        `the first ${one} is in the viewport but still waiting for a scroll to reveal it`
      ).toBeGreaterThan(0.99)
    })
  }
})
