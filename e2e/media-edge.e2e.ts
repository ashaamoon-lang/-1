import { expect, test } from '@playwright/test'

/**
 * A project page has an edge a reader can follow.
 *
 * ## What this caught
 *
 * Measured on `/en/work/panas-sore` at 1440×900, before the fix:
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

/** Sub-pixel rounding; two widths this close are the same width. */
const TOLERANCE = 1.5

test.describe('media edge', () => {
  test('artwork sits on at most two widths', async ({ page, request }) => {
    // A real slug from the sitemap rather than a hardcoded one, so this
    // cannot pass against a dataset that no longer holds it.
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const paths = [
      ...sitemap.matchAll(
        /<loc>[^<]*?(\/en\/work\/(?!discipline\/)[^<]+)<\/loc>/g
      ),
    ].map((match) => match[1] ?? '')

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
    const path = sitemap.match(
      /<loc>[^<]*?(\/en\/work\/(?!discipline\/)[^<]+)<\/loc>/
    )?.[1]
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
