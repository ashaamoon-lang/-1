import { expect, test } from '@playwright/test'

import { PRACTICE_SEGMENT } from '../lib/content/practices'

/**
 * A project page has an edge a reader can follow.
 *
 * ## What this caught
 *
 * Measured on `/en/work/arus-balik` at 1440×900, before the fix:
 *
 *   cover        562px      ratio 0.80
 *   gallery 1    936px      ratio 1.33
 *   gallery 2    562px      ratio 0.80
 *
 * inside grid tracks that were 1398px and 691px wide. Every box was exactly
 * 702px tall — `max-width: calc(78svh * var(--ratio))` capped the *height*
 * and let width fall out of each photograph's proportions — so a portrait sat
 * with 836px of empty page beside it and no two images shared an edge.
 *
 * Three separate causes, all of them silent:
 *
 *   1. the height cap, which made width a function of the asset;
 *   2. `ProjectGallery` never passing `className` to `SanityImage`, so its
 *      own `.image` rule had never once applied and the `<img>` rendered at
 *      the intrinsic width of whichever srcset candidate was picked — 1324px
 *      inside a 1398px box;
 *   3. `--column-width` deriving from `100vw`, which includes the scrollbar,
 *      so a hand-computed half track came out 696px against the grid's 691px.
 *
 * None of them is visible in a diff and none breaks a test that reads markup.
 *
 * ## Why two, and why not a number
 *
 * The invariant is that artwork sits on a small, fixed set of widths — one
 * full track and one half — not that either is a particular size. Pinning
 * 1398px would make this fail at any other viewport and every time the gutter
 * is tuned.
 *
 * ## What is deliberately excluded
 *
 * The "next project" thumbnail. It is a navigation affordance sitting beside
 * a title, not a presentation of the work, and it is deliberately small. It
 * would otherwise be a permanent third width, and widening the rule to
 * accommodate it would let the real thing regress.
 */

/**
 * Published works in the sitemap, excluding the practice filter.
 *
 * The exclusion is built from `PRACTICE_SEGMENT` rather than typed out. It was
 * typed out — as `(?!discipline/)` — and Tahap 13 renamed the segment to
 * `practice`, so the lookahead stopped excluding anything and these tests
 * started measuring `/en/work/practice/consulting` as if it were one work.
 * The failure was real and unhelpful: "a portrait work is not narrower than a
 * landscape one (614px vs 614px)", which describes a filtered catalogue
 * correctly and a defect not at all.
 */
const WORK_LOC_ALL = new RegExp(
  String.raw`<loc>[^<]*?(/en/work/(?!${PRACTICE_SEGMENT}/)[^<]+)</loc>`,
  'g'
)
const WORK_LOC = new RegExp(
  String.raw`<loc>[^<]*?(/en/work/(?!${PRACTICE_SEGMENT}/)[^<]+)</loc>`
)

/** Sub-pixel rounding; two widths this close are the same width. */
const TOLERANCE = 1.5

test.describe('media edge', () => {
  test('artwork sits on at most two widths', async ({ page, request }) => {
    // A real slug from the sitemap rather than a hardcoded one, so this
    // cannot pass against a dataset that no longer holds it.
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [...sitemap.matchAll(WORK_LOC_ALL)].map(
      (match) => match[1] ?? ''
    )

    test.skip(paths.length === 0, 'no published project to measure')

    for (const path of paths) {
      await page.goto(path)

      const widths = await page.evaluate(() => {
        const nextProject = document.querySelector('[class*="next-project"]')
        return [...document.querySelectorAll('main img')]
          .filter((img) => !nextProject?.contains(img))
          .map((img) => img.getBoundingClientRect().width)
      })

      expect(widths.length, `${path} renders no artwork`).toBeGreaterThan(0)

      // Cluster within tolerance rather than comparing exact floats.
      const distinct: number[] = []
      for (const width of widths) {
        if (!distinct.some((seen) => Math.abs(seen - width) <= TOLERANCE)) {
          distinct.push(width)
        }
      }

      expect(
        distinct.length,
        `${path} spreads artwork across ${distinct.length} widths: ${distinct
          .map((w) => `${Math.round(w)}px`)
          .join(', ')}`
      ).toBeLessThanOrEqual(2)
    }
  })

  test('the track a work lands in follows its shape', async ({
    page,
    request,
  }) => {
    /*
     * `isFullWidth()` proven all the way to the screen, not just as a function.
     *
     * The rule — ratio >= 1 takes the full track, below it takes the half —
     * has been unit-tested since Tahap 11b and passing, including at the
     * boundary (`isFullWidth(1)`). That is a claim about a function. It says
     * nothing about whether the branch survives the CSS, the grid, and the
     * image component between it and a reader, and the defect Tahap 11b
     * actually found lived in exactly that gap: `ProjectGallery` never passed
     * `className`, so its `.image` rule had never once applied.
     *
     * Until Tahap 12a the dataset held two ratios, 0.80 and 1.60, so no
     * rendered page had ever carried a square asset and the boundary was
     * untested anywhere a browser could see it. `bacaan-mesin` is square on purpose.
     *
     * The assertion is relative — full is wider than half — rather than
     * pinned to 1398px and 691px, for the same reason the test above is: those
     * numbers are one viewport's, and the gutter is allowed to be tuned.
     */
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [...sitemap.matchAll(WORK_LOC_ALL)].map(
      (match) => match[1] ?? ''
    )

    test.skip(paths.length === 0, 'no published project to measure')

    const everyRatio: number[] = []

    for (const path of paths) {
      await page.goto(path)

      const artwork = await page.evaluate(() => {
        const nextProject = document.querySelector('[class*="next-project"]')
        return [...document.querySelectorAll<HTMLImageElement>('main img')]
          .filter((img) => !nextProject?.contains(img) && img.naturalHeight > 0)
          .map((img) => ({
            // The *served* derivative's shape. Sanity keeps the source ratio
            // unless a crop is requested, so this is what the layout reasoned
            // about — and if a crop ever is requested, this catches that too.
            ratio: img.naturalWidth / img.naturalHeight,
            width: img.getBoundingClientRect().width,
          }))
      })

      expect(artwork.length, `${path} renders no artwork`).toBeGreaterThan(0)
      everyRatio.push(...artwork.map((item) => item.ratio))

      const fulls = artwork.filter((item) => item.ratio >= 1)
      const halves = artwork.filter((item) => item.ratio < 1)

      const spread = (items: typeof artwork) =>
        items.length === 0
          ? 0
          : Math.max(...items.map((i) => i.width)) -
            Math.min(...items.map((i) => i.width))

      expect(
        spread(fulls),
        `${path}: landscape and square works land on different widths`
      ).toBeLessThanOrEqual(TOLERANCE)
      expect(
        spread(halves),
        `${path}: portrait works land on different widths`
      ).toBeLessThanOrEqual(TOLERANCE)

      if (fulls.length > 0 && halves.length > 0) {
        const full = Math.min(...fulls.map((i) => i.width))
        const half = Math.max(...halves.map((i) => i.width))
        expect(
          half,
          `${path}: a portrait work is not narrower than a landscape one (${Math.round(half)}px vs ${Math.round(full)}px)`
        ).toBeLessThan(full - TOLERANCE)
      }
    }

    /*
     * And the boundary itself reached a page.
     *
     * Without this the test above passes on a dataset that never exercises
     * `ratio === 1` — which is precisely the state this project shipped in for
     * eleven stages. A gate that cannot see the case it exists for is not a
     * gate.
     */
    expect(
      everyRatio.some((ratio) => Math.abs(ratio - 1) < 0.01),
      `no square work in the dataset; ratios seen: ${[...new Set(everyRatio.map((r) => r.toFixed(2)))].join(', ')}`
    ).toBe(true)
  })

  test('every artwork box is filled by its image', async ({
    page,
    request,
  }) => {
    /*
     * The second cause above, on its own.
     *
     * `.media` reserves a box from the asset's ratio; if the `<img>` inside
     * renders narrower, the reserved box shows as dead space and the width
     * test above can still pass — every image would simply be short by the
     * same amount. This asserts the box is actually filled.
     */
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const path = sitemap.match(WORK_LOC)?.[1]
    test.skip(!path, 'no published project to measure')

    await page.goto(path ?? '')

    const shortfalls = await page.evaluate(() => {
      const out: { box: number; img: number }[] = []
      for (const img of document.querySelectorAll('main img')) {
        const box = img.parentElement
        if (!box) continue
        const boxWidth = box.getBoundingClientRect().width
        const imgWidth = img.getBoundingClientRect().width
        if (boxWidth - imgWidth > 1.5)
          out.push({ box: boxWidth, img: imgWidth })
      }
      return out
    })

    expect(
      shortfalls,
      `images narrower than their reserved box: ${shortfalls
        .map((s) => `${Math.round(s.img)} in ${Math.round(s.box)}`)
        .join('; ')}`
    ).toEqual([])
  })
})
