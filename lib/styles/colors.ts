/*
 * Ground colours are deliberately OFF pure black and white.
 *
 * `docs/TEARDOWN.md` §3: the sites that read as most considered avoid #000 and
 * #fff — Lando Norris ships #111112/#f4f4ed, Minh Pham #0d0d0d, By-Kin
 * #242527/#f4f2ed. The offset is small and disproportionately responsible for
 * a page looking chosen rather than defaulted.
 *
 * It has a real cost, measured rather than assumed. Narrowing the gap between
 * the grounds narrows every contrast ratio with it: the accent red drops from
 * 4.58:1 against pure black/white to 4.19:1 here. That clears WCAG AA for
 * large text (3:1) but NOT for body text (4.5:1), and no lightness of this hue
 * can recover it — the best achievable against these grounds is 4.19, and even
 * against pure white only 4.41.
 *
 * The consequence is a rule, not a warning to ignore: `contrast` is an ACCENT.
 * Use it for emphasis, borders, hover states, and display type — never for
 * body copy. That is how every accent in the measured set is used anyway.
 * `contrast-baseline.json` records the pairs this makes sub-AA, deliberately.
 */
const colors = {
  black: 'oklch(0.145 0 0)',
  white: 'oklch(0.9647 0.0071 106.42)',
  // darkroom.engineering's own accent, measured from their production CSS as
  // #e71419 (`docs/TEARDOWN.md` §3) — which converts to oklch(0.5882 0.2334
  // 27.96), within 0.004 lightness of the value already here. That is not a
  // coincidence: Satūs is darkroom's starter, so the palette already carried
  // their red.
  //
  // Lightness 0.592 is the peak of a very narrow band; against pure black and
  // white it reaches 4.583:1. Against this project's off-grounds it reaches
  // 4.19:1 — see the note above. Check
  // `lib/styles/scripts/contrast.test.ts` before changing it.
  red: 'oklch(0.592 0.2339 27.95)',
  blue: 'oklch(0.5731 0.2145 258.25)',
  green: 'oklch(0.8763 0.2278 152.55)',
} as const

const themeNames = ['light', 'dark', 'red'] as const
const colorNames = ['primary', 'secondary', 'contrast'] as const

const themes = {
  light: {
    primary: colors.white,
    secondary: colors.black,
    contrast: colors.red,
  },
  dark: {
    primary: colors.black,
    secondary: colors.white,
    contrast: colors.red,
  },
  red: {
    primary: colors.red,
    secondary: colors.black,
    contrast: colors.white,
  },
} as const satisfies Themes

export { colors, themeNames, themes }

// UTIL TYPES
export type Themes = Record<
  (typeof themeNames)[number],
  Record<(typeof colorNames)[number], string>
>
