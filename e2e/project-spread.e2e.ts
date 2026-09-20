import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'

/**
 * No plate stands alone in a row it cannot fill.
 *
 * ## The hole, measured
 *
 * `vault/blocks/project-gallery`'s `isFullWidth` fixed a real defect in Tahap
 * 44 — the picture's box and the track it was given disagreed — and its own
 * note records what that looked like: *"A portrait sat with 836px of empty
 * page beside it."*
 *
 * It fixed the track and left the row. Measured on the production build at
 * 1440×900, `/en/work/arus-balik`, before this gate existed:
 *
 * ```
 * div  span=half   x=16  w= 572  top= 404   h=715   <- project-hero's cover
 * li   span=full   x=16  w=1161  top=1234   h=675
 * li   span=half   x=16  w= 572  top=1957   h=786   <- alone in its row
 * ```
 *
 * The gallery runs `full, half`, so its half opens a row nothing can join and
 * **572px of ground sits beside the picture** — about 450 thousand square
 * pixels of empty page on the one route that exists to sell a piece of work.
 * 836 became 572 and stayed.
 *
 * The first `half` in that dump is the hero's cover, and it is **not** this
 * gate's business: its row is shared with the facts list. The first reading of
 * these numbers counted it as a second hole and was wrong; see the selector
 * note in `platesOn` for how the two are told apart.
 *
 * ## What this measures, and what it deliberately does not
 *
 * It asks the only question that catches the defect in every sequence: **does
 * anything share this plate's row?** A rule about neighbours in the markup
 * gets three halves in a row wrong — the first two fill a row and the third
 * opens its own — so the test reads geometry, the same thing the reader sees.
 *
 * It does **not** assert the plate got wider, and that is the point.
 * `e2e/media-edge.e2e.ts` requires artwork to sit on at most two widths and
 * requires the track to follow the picture's shape. A spread that stretched
 * the portrait to fill its row would satisfy "nothing is alone" while breaking
 * both, so the width is asserted *unchanged* below.
 */

const WORK_LOC_ALL = /<loc>[^<]*?(\/en\/work\/[^<]+)<\/loc>/g

/** Boxes this close vertically are on the same row. */
const ROW_TOLERANCE = 8

/** Widths this close are the same width. Matches `media-edge`'s tolerance. */
const WIDTH_TOLERANCE = 1.5

interface Plate {
  span: string | null
  spread: boolean
  x: number
  right: number
  top: number
  bottom: number
  mediaWidth: number
  noteX: number | null
}

async function platesOn(page: Page, path: string) {
  await page.goto(path)
  await page.waitForTimeout(2000)
  return page.evaluate((): Plate[] => {
    /*
     * `li[data-span]`, not `[data-span]`.
     *
     * `vault/blocks/project-hero` marks its cover with the same attribute,
     * and the cover is **not** a gallery plate: it is a half that shares its
     * row with the facts list, which carries no `data-span` at all. A gate
     * that swept the bare attribute would demand a spread on the cover and
     * fail a row that is already filled. The gallery is a list; the hero is
     * not, and the tag is the honest way to tell them apart.
     */
    const items = [...document.querySelectorAll('li[data-span]')]
    return items.map((item) => {
      const box = item.getBoundingClientRect()
      const media = item.querySelector('img')?.getBoundingClientRect()
      const note = item.querySelector('p')?.getBoundingClientRect()
      return {
        span: item.getAttribute('data-span'),
        spread: item.hasAttribute('data-spread'),
        x: Math.round(box.x),
        right: Math.round(box.right),
        top: Math.round(box.top + window.scrollY),
        bottom: Math.round(box.bottom + window.scrollY),
        mediaWidth: Math.round(media?.width ?? 0),
        noteX: note ? Math.round(note.x) : null,
      }
    })
  })
}

test.describe('the gallery leaves no half-empty row', () => {
  test('every half-width plate has its row filled', async ({
    page,
    request,
  }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'the twelve-column grid, and therefore the row, exists on desktop only'
    )
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })

    // Real slugs from the sitemap, so this cannot pass against a dataset that
    // no longer holds the one it was written for.
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [...sitemap.matchAll(WORK_LOC_ALL)].map(
      (match) => match[1] ?? ''
    )
    test.skip(paths.length === 0, 'no published project to measure')

    let halvesSeen = 0

    for (const path of paths) {
      const plates = await platesOn(page, path)

      /*
       * A gallery that runs has no rows to fill — Tahap 82.
       *
       * `project-gallery` has had two layouts since Tahap 64, and until the
       * fixtures carried four plates only one of them ever rendered. Above
       * `RUN_MINIMUM` the grid is **replaced** by a pinned horizontal track,
       * which hands `Horizontal` the figures alone: no `<ul>`, no `<li>`, and
       * therefore no `data-span`. Everything below this line asks which plates
       * share a row, and a track's answer is "there are no rows".
       *
       * So a track is skipped rather than measured. The assertion that used to
       * sit here read `plates.length > 0` as "this work renders artwork", and
       * it fired on the first work whose gallery became a track — reporting
       * "renders no artwork" about a page full of it.
       *
       * This cannot become a silent pass: the `halvesSeen` check at the end of
       * this test fails when no work anywhere contributed a half, so a dataset
       * that turned every project into a track goes red there instead. The
       * fixtures deliberately keep one work of each shape — `e2e/fixtures.ts`
       * names both.
       */
      const runs = await page.locator('[data-epic="project-run"]').count()
      if (runs > 0 && plates.length === 0) continue

      expect(plates.length, `${path} renders no artwork`).toBeGreaterThan(0)

      for (const plate of plates) {
        if (plate.span !== 'half') continue
        halvesSeen += 1

        const sharesRow = plates.some(
          (other) =>
            other !== plate &&
            Math.abs(other.top - plate.top) <= ROW_TOLERANCE &&
            Math.abs(other.bottom - plate.bottom) <= ROW_TOLERANCE * 60
        )
        if (sharesRow) continue

        /*
         * Nothing else is in this row, so the plate has to fill it itself —
         * which is what `data-spread` means, and the note is the half that
         * fills it. A spread whose note rendered under the picture instead of
         * beside it would leave the same hole while carrying the attribute.
         */
        expect(
          plate.spread,
          `${path}: a half-width plate at y=${plate.top} is alone in its row with nothing beside it`
        ).toBe(true)

        expect(
          plate.noteX,
          `${path}: the spread at y=${plate.top} renders no note to fill the row with`
        ).not.toBeNull()

        expect(
          plate.noteX ?? 0,
          `${path}: the spread's note at y=${plate.top} sits at x=${plate.noteX} — under the plate, not beside it`
        ).toBeGreaterThan(plate.x + plate.mediaWidth)
      }
    }

    expect(
      halvesSeen,
      'no half-width plate on any project, so this run proves nothing'
    ).toBeGreaterThan(0)
  })

  test('filling the row does not widen the picture', async ({
    page,
    request,
  }) => {
    test.skip(
      test.info().project.name !== 'desktop',
      'one-column mobile has no second track to widen into'
    )
    await page.setViewportSize({ width: 1440, height: 900 })

    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [...sitemap.matchAll(WORK_LOC_ALL)].map(
      (match) => match[1] ?? ''
    )
    test.skip(paths.length === 0, 'no published project to measure')

    const halfWidths: number[] = []
    for (const path of paths) {
      for (const plate of await platesOn(page, path)) {
        if (plate.span === 'half' && plate.mediaWidth > 0) {
          halfWidths.push(plate.mediaWidth)
        }
      }
    }

    test.skip(halfWidths.length < 2, 'fewer than two half plates to compare')

    /*
     * Every half is the same width whether or not it opened a spread. This is
     * `media-edge`'s "at most two widths" asserted from the other side: there
     * it is a property of the page, here it is a property of the mechanism.
     */
    const min = Math.min(...halfWidths)
    const max = Math.max(...halfWidths)
    expect(
      max - min,
      `half-width plates render between ${min}px and ${max}px — a spread widened its picture`
    ).toBeLessThanOrEqual(WIDTH_TOLERANCE)
  })

  test('reduced motion leaves the note fully visible', async ({
    browser,
    request,
  }) => {
    /*
     * It looks for the spread rather than assuming which project has one —
     * Tahap 82.
     *
     * This used to navigate to a hardcoded `/en/work/arus-balik`, and that
     * held only while that one project happened to strand a half. It stopped:
     * `arus-balik` now pairs its halves, the spread moved to another work, and
     * this test skipped itself with "this project has no spread to check"
     * while `data-spread` was rendering one page over. A gate that names a
     * slug is a gate that stops measuring the day the fixtures move — which is
     * the whole reason `e2e/fixtures.ts` exists, and the reason the row test
     * above already walks the sitemap.
     *
     * Which project spreads is not this test's business. Whether a spread's
     * note survives `prefers-reduced-motion` is.
     */
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [...sitemap.matchAll(WORK_LOC_ALL)].map(
      (match) => match[1] ?? ''
    )
    test.skip(paths.length === 0, 'no published project to measure')

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()

    const notes: { opacity: number; text: number }[] = []
    for (const path of paths) {
      await page.goto(path)
      await page.waitForTimeout(2600)
      notes.push(
        ...(await page.evaluate(() =>
          [...document.querySelectorAll('li[data-spread] p')].map((note) => ({
            opacity: Number.parseFloat(getComputedStyle(note).opacity),
            text: (note.textContent ?? '').trim().length,
          }))
        ))
      )
      if (notes.length > 0) break
    }
    await context.close()

    /*
     * Still a skip rather than a failure, and the layer matters. A real
     * portfolio may legitimately hold no work that strands a half, and this
     * gate has nothing to say about that. What must never happen is the
     * **fixtures** losing one — `lib/scripts/seed-fixtures.test.ts` holds that,
     * and fails when no grid project strands anything.
     */
    test.skip(notes.length === 0, 'no project in this dataset renders a spread')

    for (const note of notes) {
      expect(note.text, 'a spread note rendered empty').toBeGreaterThan(0)
      expect(
        note.opacity,
        `a spread note sat at ${note.opacity} with reduced motion on`
      ).toBe(1)
    }
  })
})

/**
 * axe, run from inside the gallery.
 *
 * `e2e/route-sweep.e2e.ts` audits every route at `scrollY 0`, and the gallery
 * is far below that — the same blind spot that let `ProgressText`'s
 * `aria-prohibited-attr` stand for nine stages. The note is muted text on the
 * page's ground, so its contrast is a real question, and this is the only
 * place it can be asked.
 */
test.describe('the spread is audited where it happens', () => {
  for (const route of ['/en/work/arus-balik', '/id/work/arus-balik']) {
    test(`${route} passes axe at the gallery`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route)
      await page.waitForTimeout(2600)

      const gallery = page.locator('li[data-span]').first()
      await expect(gallery, `${route} renders no artwork`).toBeAttached()

      await gallery.scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)

      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()

      expect(
        results.violations.map((violation) => violation.id),
        `${route} has axe violations at the gallery`
      ).toEqual([])
    })
  }
})
