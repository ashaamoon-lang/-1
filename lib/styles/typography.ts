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
     * 42 on mobile, not 72.
     *
     * The constraint is a measured one, not a preference: a display size is
     * only usable if the longest *word* in a headline fits one line at the
     * narrowest supported viewport. Measured in the browser, "Commissioned"
     * renders 7.93em wide in Syne at this weight and tracking. A 360px phone
     * leaves ~329px of line, so the ceiling is 329 / 7.93 ≈ 41.5px — and the
     * token resolves to `value / 375 * 100vw`, which puts the ceiling at 42.
     *
     * 72 (19.2vw) was locked in Tahap 1 without ever rendering real copy at
     * phone width; it clipped the first headline that had to live in it.
     * Keep this relationship in mind when changing either the scale or the
     * copy: `hero.module.css` carries `overflow-wrap: break-word` as a guard,
     * but a broken word is a symptom, not a design.
     */
    'font-size': { mobile: 42, desktop: 120 },
  },
  h2: {
    'font-family': `var(${fonts.display})`,
    'font-style': 'normal',
    'font-weight': 600,
    'line-height': '90%',
    'letter-spacing': '-0.025em',
    'font-size': { mobile: 32, desktop: 48 },
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
