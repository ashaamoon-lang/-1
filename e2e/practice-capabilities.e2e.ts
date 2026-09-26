import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { axeTags } from './axe-tags'

/**
 * `practice-capabilities` — the first pinned moment on `/practice/<value>`.
 *
 * ## What this gate is for
 *
 * Tahap 65 gave this route a section it had never had, out of content the
 * dictionary had carried since Tahap 24 and only `/studio` ever rendered.
 * `docs/stages/TAHAP-52.md` §2.1 refused to build it and gave the right
 * reason for the file it read — this page has no capability list — and the
 * list was in `messages/{en,id}.json` the whole time.
 *
 * A section built out of found content is exactly the kind that can rot
 * silently: a translator drops a separator and the pin holds over one item,
 * or the theme changes and the receded statements fall under contrast. So
 * this measures the three claims the section makes, rather than that it
 * renders.
 *
 * 1. **It is held, and holding does something.** The same two questions
 *    `e2e/motion.e2e.ts` asks of `studio-process`, because the failure it was
 *    written for — a pin that resolves inside one screen — is the failure a
 *    shorter section is most at risk of. This one is deliberately shorter
 *    (46svh per item against the step sequence's 62svh), which is precisely
 *    why it has to be measured rather than assumed.
 * 2. **Exactly one statement leads.** Two active items is a lead that means
 *    nothing; zero is a section stuck at its first frame.
 * 3. **Reduced motion ends fully visible, and shorter.** `CLAUDE.md` #5 for
 *    the first half. The second half is this block's own rule: its items are
 *    two or three words, so the height that buys the pin is empty page once
 *    the pin is switched off.
 */

/** One practice is enough for the geometry; every route is swept below. */
const ROUTE = `/en/practice/${PRACTICES[0]}`

test.describe('what a practice covers is a held set', () => {
  test('the pin outlasts a screen, and the lead moves through it', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(ROUTE)
    await page.waitForTimeout(2600)

    const section = page.locator('[data-capability-set]')
    await expect(section, `${ROUTE} renders no capability set`).toBeAttached()

    const box = await section.boundingBox()
    const top = (box?.y ?? 0) + (await page.evaluate(() => window.scrollY))
    const height = box?.height ?? 0

    /*
     * Walk the section and record, at each stop, where the held column sits
     * in the viewport and which item it names. A pinned column reports the
     * same viewport `top` at consecutive stops; a live lead reports a
     * changing index.
     */
    const pinned: number[] = []
    const reported = new Set<string>()
    const STEPS = 12

    for (let i = 0; i <= STEPS; i++) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        Math.round(top - 200 + (height * i) / STEPS)
      )
      await page.waitForTimeout(220)

      const frame = await page.evaluate(() => {
        const held = document.querySelector('[data-capability-active]')
        return {
          top: held ? Math.round(held.getBoundingClientRect().top) : null,
          active: held?.getAttribute('data-capability-active') ?? null,
        }
      })

      if (frame.top !== null) pinned.push(frame.top)
      if (frame.active !== null) reported.add(frame.active)
    }

    let held = 0
    for (let index = 1; index < pinned.length; index++) {
      if (Math.abs((pinned[index] ?? 0) - (pinned[index - 1] ?? 0)) <= 2) {
        held += height / STEPS
      }
    }

    /*
     * 800px is one viewport here. The threshold is the same one
     * `studio-process` is measured against, and it is the claim itself: a
     * held note that resolves inside one screen is a coincidence, not a pin.
     */
    expect(
      Math.round(held),
      `the column held for ${Math.round(held)}px against an 800px viewport — a pin that resolves inside one screen is a coincidence, not a hold`
    ).toBeGreaterThan(800)

    expect(
      reported.size,
      `the lead reported ${reported.size} distinct item(s) across the whole section — a column that never changes should not be pinned at all`
    ).toBeGreaterThanOrEqual(3)
  })

  test('exactly one statement leads at a time', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(ROUTE)
    await page.waitForTimeout(2600)

    const section = page.locator('[data-capability-set]')
    await expect(section, `${ROUTE} renders no capability set`).toBeAttached()

    const box = await section.boundingBox()
    const top = (box?.y ?? 0) + (await page.evaluate(() => window.scrollY))
    const height = box?.height ?? 0

    const counts: number[] = []
    for (let i = 1; i < 6; i++) {
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        Math.round(top + (height * i) / 6)
      )
      await page.waitForTimeout(260)
      counts.push(
        await page.evaluate(
          () =>
            document.querySelectorAll('[data-capability][data-active]').length
        )
      )
    }

    expect(
      counts,
      `the number of leading statements at five scroll stops was ${counts.join(', ')} — one, always`
    ).toEqual([1, 1, 1, 1, 1])
  })

  test('every practice renders its own set, in both languages', async ({
    page,
  }) => {
    for (const locale of ['en', 'id']) {
      for (const practice of PRACTICES) {
        const route = `/${locale}/practice/${practice}`
        await page.goto(route)

        const items = page.locator(`[data-capability]`)
        const count = await items.count()

        /*
         * More than one, because a line that lost its separators would render
         * as a single item — a pinned section holding over nothing. The exact
         * count is `lib/content/practices.test.ts`; what a browser can add is
         * that the split survived the server render.
         */
        expect(
          count,
          `${route} rendered ${count} capabilit${count === 1 ? 'y' : 'ies'} — a set of one is a pin with nothing to hold over`
        ).toBeGreaterThan(1)

        const texts = await items.allInnerTexts()
        expect(
          texts.filter((text) => text.trim() === ''),
          `${route} rendered an empty statement`
        ).toEqual([])
      }
    }
  })

  test('reduced motion ends fully visible, and does not buy the height', async ({
    browser,
  }) => {
    const motion = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    })
    const reduced = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    })

    const measure = async (context: typeof motion) => {
      const page = await context.newPage()
      await page.goto(ROUTE)
      await page.waitForTimeout(2600)
      const result = await page.evaluate(() => {
        const section = document.querySelector('[data-capability-set]')
        const held = document.querySelector('[data-capability-active]')
        const items = [...document.querySelectorAll('[data-capability]')]
        return {
          height: Math.round(section?.getBoundingClientRect().height ?? 0),
          position: held ? getComputedStyle(held).position : null,
          opacities: items.map((item) =>
            Number.parseFloat(getComputedStyle(item).opacity)
          ),
        }
      })
      await page.close()
      return result
    }

    const withMotion = await measure(motion)
    const withoutMotion = await measure(reduced)
    await motion.close()
    await reduced.close()

    expect(
      withMotion.opacities.length,
      'no capabilities rendered, so this proves nothing'
    ).toBeGreaterThan(1)

    /*
     * The component creates no trigger under the preference, so without the
     * stylesheet's promise every item after the first would sit at
     * `--capability-recede` permanently — content dimmed by an effect that is
     * switched off.
     */
    const dimmest = Math.min(...withoutMotion.opacities)
    expect(
      dimmest,
      `an item sat at ${dimmest} with reduced motion on — content dimmed by an effect that is not running`
    ).toBe(1)

    expect(
      withoutMotion.position,
      'the column is still pinned with reduced motion on'
    ).toBe('static')

    /*
     * And the height goes with it. `step-sequence` keeps its length under the
     * preference because each of its steps carries a paragraph; four
     * two-word statements at 46svh, with nothing leading the reader between
     * them, is two screens of empty page bought by an effect that is off.
     */
    expect(
      withoutMotion.height,
      `the section is ${withoutMotion.height}px with reduced motion against ${withMotion.height}px with it — the height that buys the pin is empty page once the pin is gone`
    ).toBeLessThan(withMotion.height)
  })
})

/**
 * axe, run from inside the section.
 *
 * `e2e/route-sweep.e2e.ts` audits every route at `scrollY 0`, and this
 * section is far below that. Its recede value is inherited from
 * `step-sequence`, whose first attempt at one measured 3.7:1 against a 4.5
 * floor and was invisible to the route sweep for the same reason. The only
 * place the question can be answered is here.
 */
test.describe('the capability set is audited where it happens', () => {
  for (const route of [ROUTE, ROUTE.replace('/en/', '/id/')]) {
    test(`${route} passes axe with a statement receded`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(route)
      await page.waitForTimeout(2600)

      const section = page.locator('[data-capability-set]')
      await expect(section, `${route} renders no capability set`).toBeAttached()

      const box = await section.boundingBox()
      const scrollY = await page.evaluate(() => window.scrollY)
      await page.evaluate(
        (y) => window.scrollTo(0, y),
        Math.round((box?.y ?? 0) + scrollY + (box?.height ?? 0) / 2)
      )
      await page.waitForTimeout(900)

      const receded = await page.evaluate(
        () =>
          [...document.querySelectorAll('[data-capability]')].filter(
            (item) => !item.hasAttribute('data-active')
          ).length
      )
      expect(
        receded,
        'nothing had receded, so this run proves nothing about the receded state'
      ).toBeGreaterThan(0)

      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()

      expect(
        results.violations.map((violation) => violation.id),
        `${route} has axe violations with a capability receded`
      ).toEqual([])
    })
  }
})
