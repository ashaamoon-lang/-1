import type { Server } from 'node:http'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'
import { readStories, serveStorybook, storyUrl } from './storybook-server'

/**
 * The gallery's horizontal run actually runs.
 *
 * ## The defect this was written for
 *
 * Tahap 64 built a pinned sideways track for `/work/<slug>`: tokenised,
 * reduced-motion aware, carrying an epic marker and an accessible label in both
 * dictionaries, and the project page passes `run`. **The branch was never taken
 * once** — not by a route, not by a story, not by a test.
 *
 * Three things had to be true for it to engage, and none were:
 *
 * - every one of the six seeded projects carries exactly **two** gallery
 *   plates, against a `RUN_MINIMUM` of four;
 * - no story passed `run` — including `Five`, which has five images, clears the
 *   minimum with room to spare, and still drew a grid;
 * - the unit tests cover plate widths and `loneHalves`, not the condition.
 *
 * So the only evidence the mode worked was the arithmetic in `travel()`. The
 * block's own doc already said the first of those out loud, which is credit to
 * Tahap 64 rather than a defect of it — what nothing said was that the
 * catalogue and the tests missed it too.
 *
 * ## Why this runs against Storybook and not a route
 *
 * Because a route cannot reach the branch. It needs a project with four
 * images, and seeding that means writing to the owner's Sanity dataset —
 * outward-facing, and theirs to authorise. A gate that can only run after
 * someone else acts is a gate that does not run.
 *
 * The catalogue has no such dependency: the `Run` story hands the block four
 * images directly, so this measures the real component in a real browser with
 * nothing mocked. When the dataset does gain a four-image project, the route
 * gets the same mode this already holds.
 *
 * ## Why "it rendered" is not the assertion
 *
 * A pin with zero travel is the failure Tahap 64 measured and rejected:
 * `items: 2, trackWidth: 1027, viewportWidth: 1161, travel: -134` — a track
 * narrower than its own viewport, clamped to zero, shipping as a held screen
 * that never moves. `vault/blocks/step-sequence` names the same shape: "a held
 * note that resolves inside one screen is not held; it is a coincidence."
 *
 * So the first assertion is that the track **out-measures its box**. A run that
 * renders and cannot move would satisfy any weaker check, and that is exactly
 * the state this exists to keep out.
 */

const STORY_ID = 'blocks-projectgallery--run'

const stories = readStories()
const hasRun = stories.some((story) => story.id === STORY_ID)

test.describe('the gallery run has somewhere to run', () => {
  let server: Server | undefined
  let origin = ''

  test.beforeAll(async () => {
    if (stories.length === 0) return
    const started = await serveStorybook()
    server = started.server
    origin = started.origin
  })

  test.afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (!server) return resolve()
      server.close(() => resolve())
    })
  })

  test.beforeEach(() => {
    /*
     * Skipped rather than failed when the catalogue has not been built, the
     * same contract `storybook-a11y` uses: a developer running one spec should
     * not be blocked on a Storybook build. CI runs `bun run build-storybook`
     * first, so there it is a real result.
     */
    test.skip(
      stories.length === 0,
      'storybook-static/index.json not found — run `bun run build-storybook` first'
    )
    // Anti-vacuum: a built catalogue that has lost the story must fail loudly,
    // not quietly skip. The missing story *is* the defect this gate is about.
    expect(
      hasRun,
      `${STORY_ID} is not in the built catalogue — the run has nothing drawing it again`
    ).toBe(true)
  })

  test('the track out-measures its own viewport, so the pin has travel', async ({
    page,
  }) => {
    await page.goto(storyUrl(origin, STORY_ID), { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const measured = await page.evaluate(() => {
      const run = document.querySelector('[data-epic="project-run"]')
      if (!run) return null
      const track = run.querySelector('ul')
      const box = track?.parentElement
      if (!track || !box) return null
      return {
        items: run.querySelectorAll('[data-run-item]').length,
        trackWidth: Math.round(track.scrollWidth),
        boxWidth: Math.round(box.clientWidth),
        label: run.getAttribute('aria-label') ?? '',
      }
    })

    expect(measured, 'the run did not render at all').not.toBeNull()
    if (!measured) return

    expect(measured.items, 'the run drew no plates').toBeGreaterThanOrEqual(4)
    expect(
      measured.label.length,
      'the run is a labelled region and its label is empty'
    ).toBeGreaterThan(0)

    // The whole point: a track that fits its box is a pin that cannot move.
    expect(
      measured.trackWidth,
      `track ${measured.trackWidth}px inside a ${measured.boxWidth}px box — a pin with no travel is the defect Tahap 64 measured and rejected`
    ).toBeGreaterThan(measured.boxWidth)
  })

  test('every plate is drawn and none is stranded invisible', async ({
    page,
  }) => {
    await page.goto(storyUrl(origin, STORY_ID), { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)

    /*
     * `CLAUDE.md` #5, and the lesson Tahap 69 learned the expensive way: a
     * block can be laid out perfectly and be entirely invisible, and geometry
     * alone cannot tell the two apart.
     */
    const opacities = await page.evaluate(() =>
      [...document.querySelectorAll('[data-run-item]')].map((item) =>
        Number(getComputedStyle(item).opacity)
      )
    )

    expect(opacities.length, 'no run items to measure').toBeGreaterThanOrEqual(
      4
    )
    expect(
      opacities.filter((value) => value < 0.01).length,
      `${opacities.filter((value) => value < 0.01).length} plate(s) stranded at opacity 0: ${opacities.join(', ')}`
    ).toBe(0)
  })

  test('under reduced motion the plates are readable, not hidden', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(storyUrl(origin, STORY_ID), { waitUntil: 'networkidle' })
    await page.waitForTimeout(900)

    const state = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[data-run-item]')]
      return {
        count: items.length,
        hidden: items.filter((item) => {
          const style = getComputedStyle(item)
          return (
            Number(style.opacity) < 0.01 ||
            style.visibility === 'hidden' ||
            style.display === 'none'
          )
        }).length,
      }
    })

    expect(state.count, 'reduced motion dropped the plates').toBeGreaterThan(0)
    expect(
      state.hidden,
      'reduced motion left plates invisible — content must end fully visible'
    ).toBe(0)

    await context.close()
  })

  test('the run passes axe from inside itself', async ({ page }) => {
    await page.goto(storyUrl(origin, STORY_ID), { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page })
      .withTags(axeTags())
      .include('[data-epic="project-run"]')
      .analyze()

    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === 'critical' || violation.impact === 'serious'
    )

    expect(
      blocking.map((violation) => `${violation.id}: ${violation.help}`),
      'axe violations inside the run'
    ).toEqual([])
  })
})
