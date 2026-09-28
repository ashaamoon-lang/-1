import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * The in-page sampler's handle, declared rather than asserted at each use —
 * the same reasoning as the `__morph` handle in `motion.e2e.ts`.
 */
declare global {
  var __epic: Map<Element, { first: number; last: number; state: string }>
}

/**
 * The interaction grammar, on the page — `docs/MOTION-SPEC.md` §9.
 *
 * ## What made this necessary
 *
 * One command, run against the repository at Tahap 12:
 *
 * ```
 * grep -rn ":active" --include=*.css app components vault lib
 * → 0
 * ```
 *
 * Eighteen stylesheets used `:hover`. Not one element in the site changed
 * when it was pressed, so between "I touched this" and "a new page appeared"
 * the site was silent. On a fast connection that gap is short and reads as
 * expensive; on a slow one it reads as a click that was not received.
 *
 * `MOTION-SPEC.md` §9 answers it with one sentence spoken by every pressable
 * noun — REST, INTENT, COMMIT, TRANSPORT, SETTLE — and this file is what
 * stops that sentence from being a document nobody kept.
 *
 * ## Why the DOM carries the grammar
 *
 * `data-press="<noun>"` marks the control; `data-intent` marks the element
 * that visibly acknowledges hover or focus, when it is not the control
 * itself. Two attributes, so the grammar is inspectable in devtools and
 * addressable from here — a test that had to guess which descendant of a card
 * carries the acknowledgment would be a test that quietly stops checking the
 * moment the markup moves.
 *
 * ## What left this file in the fork
 *
 * Five assertions fixed how the site expresses itself rather than whether a
 * reader is answered, and the fork removed them (`docs/FORK.md`, steps 2 and
 * 5): a list of nouns each route had to carry; COMMIT and INTENT inside a
 * 150–250ms band; every press easing on `transform`; a ceiling on moments per
 * route; and every long movement named. The last two are now printed.
 *
 * What stays is the reader's side of the grammar: a pressable thing answers a
 * press, INTENT reaches the keyboard as well as the cursor, and reduced motion
 * keeps the state change while dropping the transition.
 *
 * ## What is deliberately not asserted
 *
 * **COMMIT from the keyboard.** `:active` is used precisely because the
 * platform applies it to Enter and Space on a link or button as well as to a
 * pointer — that is the argument for CSS over a `pointerdown` handler. It is
 * not observable here: Enter on an `<a>` navigates in the same tick, so there
 * is no frame in which to measure the compression. INTENT *is* asserted from
 * the keyboard below, which is the half that can strand a reader.
 */

/**
 * The visual state of one element, as a reader would perceive it.
 *
 * Deliberately wider than the transform.
 *
 * The first version compared `transform`, `scale` and `opacity` only, and
 * reported the header's nav links and the hero's call to action as
 * acknowledging a cursor but not a keyboard. They do acknowledge it — with
 * colour, which is what those two controls change on hover as well. The
 * narrow snapshot was measuring one kind of acknowledgment and concluding
 * something about all of them.
 */
interface Snapshot {
  transform: string
  scale: string
  opacity: string
  color: string
  background: string
  borderColor: string
  textDecoration: string
}

/** Reads the visual state of an element and everything inside it. */
async function snapshot(page: Page, index: number): Promise<Snapshot[]> {
  return page.evaluate((i) => {
    const root = document.querySelectorAll('[data-press]')[i]
    if (!root) return []
    return [root, ...root.querySelectorAll('*')].map((el) => {
      const style = getComputedStyle(el)
      return {
        transform: style.transform,
        scale: style.scale,
        opacity: style.opacity,
        color: style.color,
        background: style.backgroundColor,
        borderColor: style.borderColor,
        textDecoration: style.textDecorationLine,
      }
    })
  }, index)
}

function differs(before: Snapshot[], after: Snapshot[]): boolean {
  if (before.length !== after.length) return true
  return before.some((b, i) => {
    const a = after[i]
    if (a === undefined) return true
    return (Object.keys(b) as (keyof Snapshot)[]).some(
      (key) => a[key] !== b[key]
    )
  })
}

test.describe('interaction grammar', () => {
  test('every pressable noun answers a press', async ({ page }) => {
    /*
     * Longer than the 30s default, because this walks every marked noun on
     * the page one at a time and each one costs a hover, a settle and a
     * press. Tahap 14b added three (`vault/blocks/practice-list`), which took
     * the run from comfortably inside the default to just over it — it passed
     * alone and timed out whenever another spec was sharing the machine.
     * The budget is the thing that was wrong, not the coverage: dropping
     * nouns to fit a timeout would be trading the gate's meaning for its
     * runtime.
     */
    test.setTimeout(90_000)

    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)

    const count = await page.locator('[data-press]').count()
    expect(count, '/en has nothing marked pressable').toBeGreaterThan(0)

    const silent: string[] = []

    for (let i = 0; i < count; i += 1) {
      const el = page.locator('[data-press]').nth(i)
      const noun = (await el.getAttribute('data-press')) ?? `#${i}`

      /*
       * `hover()`, not a hand-computed point.
       *
       * The first version of this scrolled with `scrollIntoViewIfNeeded` and
       * pressed at the element's own rect. That puts a card flush against the
       * top of the viewport, where the *fixed header* covers it, so
       * `elementFromPoint` returned the header and the press landed there —
       * and the test reported four cards as silent when the CSS was correct.
       * Playwright's actionability check scrolls somewhere the element can
       * actually receive the event, and throws instead of measuring the wrong
       * thing.
       */
      await el.hover()
      // Let INTENT finish first. The difference measured below is then COMMIT
      // alone — otherwise a control with only a hover state would pass a test
      // about pressing.
      await page.waitForTimeout(400)
      const hovered = await snapshot(page, i)

      await page.mouse.down()
      await page.waitForTimeout(300)

      // The measurement is only meaningful if the browser agrees the control
      // is being pressed. Without this the test cannot tell "this control has
      // no COMMIT" from "the press never reached it".
      const active = await el.evaluate((node) => node.matches(':active'))
      const pressed = await snapshot(page, i)

      // Released away from the control, so measuring a press never navigates.
      await page.mouse.move(2, 2)
      await page.mouse.up()

      expect(active, `${noun}: the press did not reach the control`).toBe(true)
      if (!differs(hovered, pressed)) silent.push(noun)
    }

    expect(
      silent,
      `these answer hover but not press: ${silent.join(', ')}`
    ).toEqual([])
  })

  test('INTENT is reachable from the keyboard, not only from a cursor', async ({
    page,
  }) => {
    /*
     * Longer than the 30s default, because this walks every marked noun on
     * the page one at a time and each one costs a hover, a settle and a
     * press. Tahap 14b added three (`vault/blocks/practice-list`), which took
     * the run from comfortably inside the default to just over it — it passed
     * alone and timed out whenever another spec was sharing the machine.
     * The budget is the thing that was wrong, not the coverage: dropping
     * nouns to fit a timeout would be trading the gate's meaning for its
     * runtime.
     */
    test.setTimeout(90_000)

    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(600)

    // One real key press first: Chromium only grants `:focus-visible` to a
    // programmatic focus when the last interaction was a keyboard one. Without
    // this the test measures `:focus`, which is not what a reader sees.
    await page.keyboard.press('Tab')

    const count = await page.locator('[data-press]').count()
    // Without this the loop below runs zero times and the test reports
    // success having examined nothing — the failure mode this project keeps
    // finding in its own gates.
    expect(count, '/en has nothing marked pressable').toBeGreaterThan(0)

    const cursorOnly: string[] = []

    for (let i = 0; i < count; i += 1) {
      const el = page.locator('[data-press]').nth(i)
      const noun = (await el.getAttribute('data-press')) ?? `#${i}`

      await el.scrollIntoViewIfNeeded()
      const rest = await snapshot(page, i)

      await el.evaluate((node) => {
        if (node instanceof HTMLElement) node.focus()
      })
      await page.waitForTimeout(400)
      const focused = await snapshot(page, i)

      await el.evaluate((node) => {
        if (node instanceof HTMLElement) node.blur()
      })

      if (!differs(rest, focused)) cursorOnly.push(noun)
    }

    expect(
      cursorOnly,
      `these acknowledge a cursor but not a keyboard: ${cursorOnly.join(', ')}`
    ).toEqual([])
  })

  /**
   * Every page `MOTION-SPEC.md` §9.5 names, not just the home page.
   *
   * ## What running on one route hid
   *
   * This sampler existed from Tahap 12e and visited `/en` and nothing else,
   * while §9.5's table names seven page types. Four of them declared no
   * `data-epic` at all and were never counted — so the budget was enforced on
   * one seventh of the surface it governs.
   *
   * `docs/stages/TAHAP-40.md` §Hasil carries what widening it found.
   *
   * ## Why the whole table, rather than the pages that looked suspicious
   *
   * A budget checked where you expect trouble is not a budget. The list below
   * is generated from §9.5's own rows, so a page added to that table without
   * a corresponding route here is the kind of drift this file exists to stop.
   */
  /*
   * The routes whose moments are reported.
   *
   * Each entry used to carry a `ceiling` — 12 on the four brand routes, 6 on
   * `/journal` and `/work/<slug>`, 3 on a journal entry — `MOTION-SPEC.md`
   * §9.5 as widened in Tahap 60. The fork removed the ceilings
   * (`docs/FORK.md`, step 2): a route may spend as many moments as its
   * design wants, and this prints how many it did.
   */
  const EPIC_ROUTES = [
    { path: '/en' },
    { path: '/en/work' },
    { path: `/en/work/${FEATURED_WORK}` },
    /*
     * A practice page is a brand surface, not an information one.
     *
     * It was the route that taught this table to describe the site rather
     * than contradict it: Tahap 52 marked the two moments §9.5 had listed
     * since Tahap 15 and found a third already shipping — `work-transport`,
     * which `ProjectCard` carries wherever it renders, the same accounting
     * defect Tahap 50 found on `/studio`. The lesson was that an unmarked
     * moment is not an absent one.
     */
    { path: '/en/practice/consulting' },
    { path: '/en/studio' },
    { path: '/en/journal' },
    { path: '/en/journal/scope-is-the-deliverable' },
  ] as const

  for (const { path: route } of EPIC_ROUTES)
    test(`${route} reports its choreographed moments`, async ({ browser }) => {
      /*
       * The moments a route spends, `MOTION-SPEC.md` §9.5 — measured from
       * motion that actually happened, not from what a stylesheet declares.
       *
       * That distinction is the whole difficulty, and the stage spec named it
       * as this stage's largest risk (`docs/stages/TAHAP-12.md` §8.3): counting
       * choreographed movements from static CSS misses every GSAP tween, and
       * counting declarations catches transitions that never run. Both fail
       * *green*. So this samples `requestAnimationFrame` while the page arrives
       * and asks what moved, which is the same method that proved the route
       * morph in Tahap 11d and the COMMIT compression in 12c.
       *
       * `data-epic="<name>"` marks a moment. §9.5 requires the two to be
       * *named*; naming them in the DOM is what makes that requirement
       * checkable, and it means a failure says which moment overspent rather
       * than pointing at an anonymous `<div>`.
       *
       * The threshold is 600ms — the standard band's ceiling (§2). Anything
       * that moves longer than that has left the band a page is allowed to
       * spend freely.
       */
      const context = await browser.newContext()
      const page = await context.newPage()

      try {
        await page.addInitScript(() => {
          const started = performance.now()
          const spans = new Map<
            Element,
            { first: number; last: number; state: string }
          >()
          globalThis.__epic = spans

          const sample = () => {
            const elapsed = performance.now() - started
            if (elapsed > 2600) return

            for (const el of document.querySelectorAll('main *, header *')) {
              const style = getComputedStyle(el)
              const matrix = new DOMMatrixReadOnly(style.transform)
              /*
               * Rounded, and that is a fix rather than a convenience.
               *
               * Comparing the computed `matrix()` string counts float noise as
               * movement: the first version of this probe reported the hero
               * headline as moving for 2738ms when it settles by about 1000ms,
               * because the matrix kept jittering in the last decimal place
               * after the tween visually finished.
               */
              const state = `${[
                matrix.a,
                matrix.b,
                matrix.c,
                matrix.d,
                matrix.e,
                matrix.f,
              ]
                .map((n) => Math.round(n * 100) / 100)
                .join(',')}|${Math.round(Number(style.opacity) * 100) / 100}`

              const seen = spans.get(el)
              if (!seen) {
                spans.set(el, { first: -1, last: -1, state })
                continue
              }
              if (state !== seen.state) {
                if (seen.first === -1) seen.first = elapsed
                seen.last = elapsed
                seen.state = state
              }
            }

            requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)
        })

        await page.goto(route, { waitUntil: 'load' })
        await page.waitForTimeout(2800)

        const { moved, names } = await page.evaluate(() => ({
          moved: [...globalThis.__epic.entries()]
            .filter(
              ([, span]) => span.first !== -1 && span.last - span.first > 600
            )
            .map(([el, span]) => ({
              ms: Math.round(span.last - span.first),
              epic:
                el.closest('[data-epic]')?.getAttribute('data-epic') ?? null,
              what: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 18)}"`,
            })),
          names: [
            ...new Set(
              [...document.querySelectorAll('[data-epic]')].map(
                (el) => el.getAttribute('data-epic') ?? ''
              )
            ),
          ],
        }))

        // A page where nothing moved would pass both assertions below without
        // examining anything.
        expect(
          await page.evaluate(() => globalThis.__epic.size),
          'the sampler observed no elements at all'
        ).toBeGreaterThan(20)

        /*
         * Reported, not capped — the fork.
         *
         * Two assertions stood here. One capped how many choreographed moments
         * a route could declare (`ceiling`); the other failed any movement past
         * the 150–250ms standard band that no named moment claimed. Both are
         * budgets on expression, and the first contradicted this repo in
         * writing: `epic-sequence.e2e.ts:11` says the per-page count was
         * replaced by its overlap rule because "the count was never the thing
         * worth protecting" — and this line went on enforcing it.
         *
         * The overlap rule it pointed to went with `epic-sequence.e2e.ts` in
         * the fork's step 5. Here the route's moments are printed, so the
         * number stays visible.
         */
        const unnamed = moved.filter((item) => item.epic === null)
        console.log(
          `MOMENTS ${route.padEnd(38)} ${String(names.length).padStart(2)} named${
            names.length > 0 ? ` (${names.join(', ')})` : ''
          }${unnamed.length > 0 ? ` + ${unnamed.length} unnamed long moves` : ''}`
        )
        /*
         * There is deliberately **no** floor of "at least one named moment",
         * and that is a correction to this file's own first attempt at the
         * per-route ceiling.
         *
         * Adding one looked like the obvious anti-vacuum companion — a route
         * allowed three should not pass by declaring none — and it went red
         * on `/en/journal/scope-is-the-deliverable` within one run.
         * Correctly: `MOTION-SPEC.md` §9.5 says in as many words that "a page
         * missing from it has no choreographed movement, and that is a
         * legitimate answer", and the entry page's one moment is
         * `journal-transport`, spent on *arriving from the index*. Loaded
         * directly, as this sampler does, it declares nothing and should.
         *
         * The vacuum is already closed twice over, in the right places: the
         * sampler asserts it observed elements at all, the unnamed count above
         * reports choreographed movement that belongs to no name, and
         * `e2e/journey.e2e.ts` fails outright if the home page's pin never
         * engages. A floor here would have been a fourth guard that
         * contradicts the spec.
         */
      } finally {
        await context.close()
      }
    })

  test('reduced motion keeps the state change and drops the transition', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()

    try {
      await page.goto('/en', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)

      // Prove the emulation took before asserting anything about it. A
      // fixture that silently does not apply reports a correct page as broken
      // — which is exactly what happened in Tahap 11c.
      const reduced = await page.evaluate(
        () => matchMedia('(prefers-reduced-motion: reduce)').matches
      )
      expect(reduced, 'reduced-motion emulation did not apply').toBe(true)

      const durations = await page.evaluate(() =>
        [...document.querySelectorAll('[data-press]')].map((el) =>
          Number.parseFloat(getComputedStyle(el).transitionDuration)
        )
      )
      expect(durations.length).toBeGreaterThan(0)
      // §9.4 rule 3: the duration collapses, the state still changes.
      expect(Math.max(...durations)).toBeLessThan(0.02)

      const el = page.locator('[data-press]').first()
      await el.scrollIntoViewIfNeeded()
      const point = await el.evaluate((node) => {
        const r = node.getBoundingClientRect()
        return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 32) }
      })

      await page.mouse.move(point.x, point.y)
      await page.waitForTimeout(120)
      const hovered = await snapshot(page, 0)
      await page.mouse.down()
      await page.waitForTimeout(120)
      const pressed = await snapshot(page, 0)
      await page.mouse.move(2, 2)
      await page.mouse.up()

      expect(
        differs(hovered, pressed),
        'under reduced motion the press produced no state change at all'
      ).toBe(true)
    } finally {
      await context.close()
    }
  })
})
