import { isLocale } from './routing'

/**
 * URLs a reader would reasonably type, and where they actually belong.
 *
 * ## The defect this exists for
 *
 * The header nav reads `WORK · PRACTICE · STUDIO · CONTACT` in English and
 * `KARYA · PRAKTIK · STUDIO · KONTAK` in Indonesian. Three of those four are
 * **anchors on the home page**, not routes — `#work`, `#practice`, `#contact`
 * — and the catalogue lives at `/work` in *both* locales, so the Indonesian
 * segment a reader sees is never the segment the URL uses.
 *
 * A reader who reads a label and types it therefore lands on a 404. Measured
 * against the production build in `docs/stages/TAHAP-22.md` §3:
 *
 * | typed              | before        |
 * | ------------------ | ------------- |
 * | `/en/contact`      | 404           |
 * | `/en/practice`     | 404           |
 * | `/id/kontak`       | 404           |
 * | `/id/praktik`      | 404           |
 * | `/id/karya`        | 404           |
 *
 * Only `/en/contact` was in this stage's spec. The other four were found by
 * checking every label rather than the one that had been reported, and they
 * are the same defect, so they are fixed together.
 *
 * ## Why this is a redirect and not a 404 page improvement
 *
 * A 404 that suggests where to go still costs the reader a page and a
 * decision. And unlike the not-found status itself — which Cache Components
 * force to 200, deliberately, and which `e2e/not-found.e2e.ts` documents —
 * `proxy.ts` runs *before* rendering, so a real 308 is available here.
 *
 * ## What is deliberately absent
 *
 * `studio` is **not** in this table, and no longer needs to be: Tahap 24 made
 * it a real route, so it resolves rather than being redirected. It moved to
 * `REAL_SEGMENTS` below, which is where a guess must never shadow a page.
 *
 * ## The trade-off, stated
 *
 * These segments become unreachable as CMS page slugs: a Sanity `page`
 * document with slug `contact` would be shadowed by the redirect. Verified
 * against the current dataset — none of these slugs exists — and
 * `guessed-paths.test.ts` asserts the table never collides with a real route.
 * A studio that later wants `/contact` as a CMS page must remove its row
 * here first.
 */
const GUESSED_SEGMENTS = new Map([
  // Home-page anchors, in both spellings of each label.
  ['contact', '#contact'],
  ['kontak', '#contact'],
  ['practice', '#practice'],
  ['praktik', '#practice'],
  /*
   * The catalogue, which is `/work` in both locales. `karya` is the label an
   * Indonesian reader sees, so it is the one they type; the English spelling
   * is deliberately absent, because it is a real route and a row for it could
   * only ever redirect the catalogue to itself.
   */
  ['karya', '/work'],
])

/**
 * Single segments that already resolve, so a guess must never shadow them.
 *
 * `work`, `ai`, `studio` (Tahap 24) and `journal` (Tahap 26). The one still absent is `practice`, and the distinction is worth
 * stating: `/en/practice` alone 404s, because the route is `practice/[value]`,
 * which this function never sees (it matches two path parts only).
 *
 * Kept as data so `guessed-paths.test.ts` can assert the two lists never
 * name the same segment.
 */
export const REAL_SEGMENTS = new Set(['work', 'ai', 'studio', 'journal'])

/** Every key the table answers to. Exported for the unit test. */
export const GUESSED_KEYS = [...GUESSED_SEGMENTS.keys()]

/**
 * Where a guessed path should send the reader, or `null` to leave it alone.
 *
 * Matches only `/{locale}/{one-segment}`: `/en/practice/consulting` is a real
 * page and must pass straight through, so anything deeper is never touched.
 */
export function guessedDestination(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length !== 2) return null

  const [maybeLocale, segment] = parts
  if (!maybeLocale || !segment) return null
  if (!isLocale(maybeLocale)) return null

  // A real route always wins over a guess. `/en/work` is the catalogue.
  if (REAL_SEGMENTS.has(segment)) return null

  const target = GUESSED_SEGMENTS.get(segment)
  if (!target) return null

  // Narrowed to a real locale by the `isLocale` guard above, so it is safe to
  // put straight back into the path rather than falling back to a default.
  return `/${maybeLocale}${target}`
}
