import type { CSSProperties } from 'react'

/*
 * Two roles, and the division matters more than the count.
 *
 * `display` (Syne) carries everything a reader reads: headings and prose.
 * `mono` (Geist Mono) carries everything a reader scans: captions, labels,
 * calls to action. That split is the pattern measured across Lusion,
 * basement.studio, By-Kin and darkroom in `docs/TEARDOWN.md` §4 — the mono is
 * never decoration, it is the metadata voice.
 *
 * The first Tahap 1 put prose in mono as well. With Syne carrying identity now
 * that the palette has no accent, prose belongs in it too.
 */
const fonts = {
  display: '--next-font-display',
  mono: '--next-font-mono', // this should be the variable name defined in fonts.ts
} as const

const typography = {
  h1: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 700,
    // 85%, not 80%. Sub-100% leading on display type is the signature of
    // considered typography, but Syne has taller forms than the neutral sans
    // it replaced and 80% collides the lines.
    'line-height': '85%',
    'letter-spacing': '-0.04em',
    /*
     * 38 on mobile, not 42, and not 72.
     *
     * The constraint is measured, not a preference: a display size is only
     * usable if the longest *word* in a headline fits one line at the
     * narrowest supported viewport. The token resolves to
     * `value / 375 * 100vw`, so the ceiling is
     * `column_at_320px / (longest_word_em × 320/375)`.
     *
     * The rule was right and the measurement was half-done. It used
     * "Commissioned" (7.97em in Syne at this weight and tracking) and stopped
     * — but this site ships two languages, and Indonesian is the longer one:
     *
     *     Commissioned    7.97em     memperhatikan   8.59em
     *
     * At 320px the headline column is 282.7px, which caps the token at
     * 282.7 / (8.59 × 0.853) = 38.6. So 42 overflowed every phone width from
     * 320 to 768 — in Indonesian only, which is why six stages of English
     * screenshots never showed it (`docs/AUDIT-2026-08.md` §1.1).
     *
     * Re-measure both locales when either the scale or the copy changes.
     * `hero.module.css` keeps `overflow-wrap: anywhere` as a last resort, but
     * a broken word is a symptom, not a design.
     */
    'font-size': { mobile: 38, desktop: 120 },
  },
  h2: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 600,
    'line-height': '90%',
    'letter-spacing': '-0.025em',
    'font-size': { mobile: 32, desktop: 48 },
  },
  /*
   * h3 — added in Tahap 37 to close a hole, not to add a size.
   *
   * The scale ran p-big (20 desktop) straight to h2 (48). Anything a section
   * needed between those had to be invented locally, and four ad-hoc
   * `clamp()` declarations across the site are exactly that hole being filled
   * by hand. 24 to 32 sits where those four were reaching.
   *
   * Display family and the same negative tracking discipline: large type
   * tightens, small type breathes.
   */
  h3: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 600,
    'line-height': '100%',
    'letter-spacing': '-0.02em',
    'font-size': { mobile: 24, desktop: 32 },
  },
  'p-big': {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': '125%',
    'letter-spacing': '-0.02em',
    'font-size': { mobile: 16, desktop: 20 },
  },
  p: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': { mobile: '125%', desktop: '120%' },
    'letter-spacing': '-0.01em',
    'font-size': { mobile: 12, desktop: 14 },
  },
  caption: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': { mobile: '125%', desktop: '120%' },
    'letter-spacing': '-0.01em',
    // Raised from 8/10. The first Tahap 1 shipped 8px on mobile and flagged it
    // as below any readable floor — a flag is not a fix. 11px is still clearly
    // metadata, and legible.
    'font-size': { mobile: 11, desktop: 12 },
  },
  cta: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': '100%',
    'letter-spacing': '-0.01em',
    'font-size': { mobile: 12, desktop: 14 },
  },
  link: {
    'font-family': `var(${fonts.mono})`,
    'font-style': 'normal',
    'font-weight': 400,
    'line-height': { mobile: '125%', desktop: '120%' },
    'letter-spacing': '-0.01em',
    'font-size': { mobile: 12, desktop: 14 },
  },
} as const satisfies TypeStyles

export { fonts, typography }

// UTIL TYPES
type TypeStyles = Record<
  string,
  {
    'font-family': string
    'font-style': CSSProperties['fontStyle']
    'font-weight': CSSProperties['fontWeight']
    'line-height':
      | `${number}%`
      | { mobile: `${number}%`; desktop: `${number}%` }
    'letter-spacing':
      | `${number}em`
      | { mobile: `${number}em`; desktop: `${number}em` }
    'font-feature-settings'?: string
    'font-size': number | { mobile: number; desktop: number }
  }
>
