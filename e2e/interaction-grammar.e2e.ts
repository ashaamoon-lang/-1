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
 * ## What is deliberately not asserted
 *
 * **COMMIT from the keyboard.** `:active` is used precisely because the
 * platform applies it to Enter and Space on a link or button as well as to a
 * pointer — that is the argument for CSS over a `pointerdown` handler. It is
 * not observable here: Enter on an `<a>` navigates in the same tick, so there
 * is no frame in which to measure the compression. INTENT *is* asserted from
 * the keyboard below, which is the half that can strand a reader.
 */

/** Micro band, `MOTION-SPEC.md` §2, in seconds. */
const MICRO = { low: 0.15, high: 0.25 }

/** The nouns each route must be able to speak the sentence with. */
const EXPECTED = {
  '/en': ['nav', 'cta', 'card', 'email'],
  '/en/work': ['chip', 'card'],
  [`/en/work/${FEATURED_WORK}`]: ['next'],
} satisfies Record<string, readonly string[]>

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
  for (const [route, nouns] of Object.entries(EXPECTED)) {
    test(`${route} marks every pressable noun`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(500)

      const present = await page.evaluate(() => [
        ...new Set(
          [...document.querySelectorAll('[data-press]')].map(
            (el) => el.getAttribute('data-press') ?? ''
          )
        ),
      ])

      for (const noun of nouns) {
        expect(
          present,
          `${route}: nothing carries data-press="${noun}" — found [${present.join(', ')}]`
        ).toContain(noun)
      }
    })
  }

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

  test('COMMIT and INTENT stay inside the micro band', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    /*
     * Read from computed style, which reports the *declared* duration.
     *
     * Timing the state change instead would measure the machine, and would be
     * flaky on a loaded runner. The claim is about what the stylesheet says,
     * and this is where the stylesheet says it after the cascade.
     */
    const durations = await page.evaluate(() =>
      [
        ...document.querySelectorAll('[data-press]'),
        ...document.querySelectorAll('[data-intent]'),
      ].map((el) => ({
        noun:
          el.getAttribute('data-press') ??
          el.closest('[data-press]')?.getAttribute('data-press') ??
          '(unmarked)',
        role: el.hasAttribute('data-press') ? 'commit' : 'intent',
        seconds: getComputedStyle(el)
          .transitionDuration.split(',')
          .map((value) => Number.parseFloat(value))
          .reduce((longest, value) => Math.max(longest, value), 0),
      }))
    )

    expect(durations.length, 'nothing to measure').toBeGreaterThan(0)

    const outside = durations.filter(
      (d) => d.seconds < MICRO.low || d.seconds > MICRO.high
    )

    expect(
      outside.map((d) => `${d.noun}/${d.role}: ${d.seconds * 1000}ms`),
      'states outside the 150-250ms micro band'
    ).toEqual([])
  })

  test('every pressable noun actually transitions its transform', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(500)

    /*
     * The failure this exists for is silent by construction.
     *
     * `global.css` supplies the `:active` transform, but the transition has to
     * be declared per control, because `transition` replaces rather than
     * joins. A control that is marked `data-press` and forgets it still
     * changes on press — instantly, with no easing — and every other
     * assertion in this file passes: the state differs, and the duration read
     * back is whatever the colour transition declares, which is in band.
     */
    const snapped = await page.evaluate(() =>
      [...document.querySelectorAll('[data-press]')]
        .filter((el) => {
          const properties = new Set(
            getComputedStyle(el)
              .transitionProperty.split(',')
              .map((value) => value.trim())
          )
          return !(properties.has('transform') || properties.has('all'))
        })
        .map((el) => el.getAttribute('data-press') ?? '(unnamed)')
    )

    expect(
      [...new Set(snapped)],
      'these snap instead of easing — no `transform` in their transition'
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
  const EPIC_ROUTES = [
    '/en',
    '/en/work',
    `/en/work/${FEATURED_WORK}`,
    '/en/practice/consulting',
    '/en/studio',
    '/en/journal',
    '/en/journal/scope-is-the-deliverable',
  ] as const

  for (const route of EPIC_ROUTES)
    test(`${route} spends no more than two choreographed moments`, async ({
      browser,
    }) => {
      /*
       * The epic-moment budget, `MOTION-SPEC.md` §9.5 — measured from motion
       * that actually happened, not from what a stylesheet declares.
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

        const unnamed = moved.filter((item) => item.epic === null)
        expect(
          unnamed.map((item) => `${item.what} moved ${item.ms}ms`),
          `${route}: movement past the standard band that belongs to no named moment`
        ).toEqual([])

        expect(
          names,
          `${route} may spend two choreographed moments; it declares ${names.length}: ${names.join(', ')}`
        ).not.toHaveLength(3)
        expect(names.length).toBeLessThanOrEqual(2)
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
