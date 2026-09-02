/**
 * The fixture slugs this suite navigates to by name.
 *
 * ## Why they are here and not typed out twenty times
 *
 * Tahap 13 renamed the six fixtures — the site had been seeded as a
 * commissioned-artwork studio and the sector is an agency — and eleven tests
 * across six files broke on hardcoded `arus-balik` and `arus-balik`. None of them
 * cared *which* work it was; they needed a detail page that exists.
 *
 * That is the same shape of problem `lib/content/practices.ts` solves for the
 * app: one list, many consumers. A future rename is one edit here.
 *
 * ## Why not derive every one from the sitemap
 *
 * Some tests should, and do — `media-edge.e2e.ts` walks every published work
 * precisely so it cannot pass against a dataset that no longer holds the slug
 * it was written for. But a test that needs *a particular shape* of work — the
 * square cover, a featured work that appears on the home page — cannot pick
 * one at random and still mean what it says. Those name it, and name it once.
 */

/**
 * A featured work, so it appears on the home page *and* in the catalogue.
 * The route morph is measured from `/en` to this page.
 */
export const FEATURED_WORK = 'arus-balik'

/**
 * The square cover — ratio 1.00, the boundary `isFullWidth()` turns on.
 * Kept as a named constant because a test that loses it stops testing the
 * boundary while still passing.
 */
export const SQUARE_WORK = 'bacaan-mesin'
