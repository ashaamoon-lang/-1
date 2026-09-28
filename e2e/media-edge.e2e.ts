import { expect, test } from '@playwright/test'

/**
 * A project page fills the boxes it reserves for its artwork.
 *
 * ## What left this file in the fork
 *
 * Two layout rules stood here: artwork sits on **at most two widths** (one
 * full track, one half), and the track a work lands in follows its shape
 * (landscape full, portrait half, a run's plates all one track — judged in
 * `track-contract.ts`). Both were how this site composed a project page, and
 * the fork removed them with their module (`docs/FORK.md`, step 5).
 *
 * What stays is the defect the history below found, which is a defect under
 * any composition: an image rendering narrower than the box reserved for it,
 * leaving dead space where the picture should be. And a sitemap that lists a
 * redirect, which asks a crawler to index a 308.
 *
 * ## What the width rules were written against
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
 * Published works in the sitemap.
 *
 * ## Why there is no longer an exclusion here, and why that is asserted
 *
 * This used to carry `(?!${'practice'}/)` to keep the filtered catalogue out of a
 * list of works. Tahap 15 moved practices to their own top-level pages, so
 * `/work/practice/…` is not in the sitemap at all and the lookahead would
 * exclude nothing.
 *
 * A lookahead that matches nothing is not harmless: it reads as a live guard
 * and the next rename will trust it. This project has already paid for that
 * exactly once — the same expression was typed out as `(?!discipline/)`,
 * Tahap 13 renamed the segment, and these tests silently began measuring
 * `/en/work/practice/consulting` as if it were one work, reporting "a portrait
 * work is not narrower than a landscape one (614px vs 614px)": true of a
 * filtered catalogue, and not a defect at all.
 *
 * So the guard becomes an assertion instead. `practiceUrlsAreGone` below fails
 * if a practice URL ever reappears under `/work/`, which is the thing the
 * lookahead was silently protecting.
 */
const WORK_LOC_ALL = /<loc>[^<]*?(\/en\/work\/[^<]+)<\/loc>/g
const WORK_LOC = /<loc>[^<]*?(\/en\/work\/[^<]+)<\/loc>/

/**
 * The sitemap must not list a practice under `/work/`.
 *
 * Tahap 15 gave each practice its own page and made the old filtered URL a
 * permanent redirect. A sitemap that still advertised the old path would ask
 * a crawler to index a 308.
 */
function practiceUrlsAreGone(sitemap: string): string[] {
  return [
    ...sitemap.matchAll(
      /<loc>[^<]*?(\/[a-z]{2}\/work\/practice\/[^<]+)<\/loc>/g
    ),
  ].map((m) => m[1] as string)
}

test.describe('media edge', () => {
  test('the sitemap lists no practice under /work/', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()

    // The guard that used to be a silent lookahead — see `WORK_LOC_ALL`.
    expect(
      practiceUrlsAreGone(sitemap),
      'the sitemap lists a practice under /work/, which is now a permanent redirect'
    ).toEqual([])

    // Anti-vacuum: a sitemap with no work at all would pass the guard above
    // by listing nothing.
    expect(
      [...sitemap.matchAll(WORK_LOC_ALL)].length,
      'the sitemap lists no work to check against'
    ).toBeGreaterThan(0)
  })

  test('every artwork box is filled by its image', async ({
    page,
    request,
  }) => {
    /*
     * The second cause above, on its own.
     *
     * `.media` reserves a box from the asset's ratio; if the `<img>` inside
     * renders narrower, the reserved box shows as dead space. This asserts
     * the box is actually filled.
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
