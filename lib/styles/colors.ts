/*
 * A gallery palette: two neutrals, and no chromatic accent at all.
 *
 * This is the second version of Tahap 1. The first gave the site a saturated
 * red, on the reasoning that every award-winning studio site measured in
 * `docs/TEARDOWN.md` carries exactly one high-chroma accent. That reasoning
 * was right about creative *studios* and wrong about this site.
 *
 * Arth is an agency, and its case studies carry the colour on these pages. The work
 * is the colour. A saturated accent competes with every image on the page,
 * and two independent sources say so:
 *
 *   - the `ui-ux-pro-max` Museum/Gallery palette sets `Accent` to the same
 *     value as `Primary` — a gallery has no chromatic accent;
 *   - its Portfolio Grid pattern states the colour strategy outright:
 *     "Neutral background (let work shine). Accent: Minimal."
 *
 * basement.studio's orange and darkroom's red work because their content is
 * code, type and 3D. Ours is pigment.
 *
 * ## The neutrals are warm, and that is a choice
 *
 * A pure grey reads as unconsidered. These carry a small warm bias (hue ~66°
 * and ~92° at very low chroma), which reads as paper and pigment rather than
 * as screen. The shift is subtle enough that no image on top of it picks up a
 * cast.
 *
 * ## Why `contrast` is not a third colour
 *
 * Components use `--color-contrast` for interactive state: focus rings,
 * checked boxes, switch fills, form errors. Filling that role with the ink
 * itself gives a focus ring 17.24:1 against its ground — far stronger than the
 * 4.32:1 the red managed, and WCAG 2.2 asks only 3:1 for non-text indicators.
 * The token stays so a future brand colour can be introduced in one place
 * without touching every component.
 */
const colors = {
  /** Warm near-black. #110f0d */
  ink: 'oklch(0.17 0.006 66)',
  /** Warm off-white, gallery-wall rather than paper-white. #f4f3ef */
  paper: 'oklch(0.964 0.006 92)',
} as const

/*
 * `red` is gone. It described a theme no page ever applied, and with no
 * chromatic accent it described nothing at all. Removing it also clears every
 * `red/*` row out of the contrast baseline, which previously made that file
 * look far more compromised than the site actually was.
 */
const themeNames = ['light', 'dark'] as const
const colorNames = ['primary', 'secondary', 'contrast'] as const

const themes = {
  light: {
    primary: colors.paper,
    secondary: colors.ink,
    contrast: colors.ink,
  },
  dark: {
    primary: colors.ink,
    secondary: colors.paper,
    contrast: colors.paper,
  },
} as const satisfies Themes

export { colors, themeNames, themes }

// UTIL TYPES
export type Themes = Record<
  (typeof themeNames)[number],
  Record<(typeof colorNames)[number], string>
>
