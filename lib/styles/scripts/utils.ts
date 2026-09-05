export function scalingCalc(value: number) {
  return `calc(((${value} * 100) / var(--device-width)) * 1vw)`
}

/**
 * The width past which nothing grows.
 *
 * 1920, because that is where the desktop design's own proportions stop being
 * a description of anything: at 2560 the old formula put `h1` at 213px and the
 * header at 128px, which is 14% of a 900px screen spent on a wordmark and
 * three links.
 */
const CEILING_WIDTH = 1920

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * One continuous, bounded curve through both design anchors.
 *
 * ## What it replaces
 *
 * `scalingCalc` emits `N * 100 / var(--device-width) * 1vw`, and
 * `--device-width` flips from 375 to 1440 at the 800px breakpoint. Two
 * branches, each anchored on a different width, meeting nowhere. Measured on
 * the production build (`docs/stages/TAHAP-36.md` §1): crossing 800px, `h1`
 * fell 17.7%, `caption` fell **71.4%** — 23.4px to 6.7px — and the gutter
 * collapsed 3.8x. At 320px the caption rendered at 9.4px, below the 11px
 * floor `typography.ts` set deliberately; at 2560px `h1` reached 213px.
 *
 * ## The curve
 *
 * A straight line through (375, mobile) and (1440, desktop), expressed as
 * `origin + slope * 1vw` so the browser interpolates it, then clamped: it
 * stops shrinking at the mobile design value and stops growing at whatever
 * it reaches at 1920.
 *
 * **The property that makes this a bounding change and not a redesign: at
 * 375px and 1440px every value is still exactly what was designed.** The line
 * passes through both anchors by construction. Only the space between them
 * and beyond them moves, which is precisely where the defect lived.
 * `e2e/scale-continuity.e2e.ts` asserts that anchor property directly.
 *
 * A pair whose two values are equal — `--gap` and `--safe` are both 16 —
 * emits a constant. A value that is 16px at 375 and 16px at 1440 was never
 * meant to be 34px at 799.
 */
export function fluidCalc(
  mobile: number,
  desktop: number,
  mobileWidth: number,
  desktopWidth: number
): string {
  if (mobile === desktop) return `${mobile}px`

  const perPx = (desktop - mobile) / (desktopWidth - mobileWidth)
  const slopeVw = perPx * 100
  const originPx = mobile - perPx * mobileWidth
  const atCeiling = originPx + perPx * CEILING_WIDTH

  const lower = round(Math.min(mobile, atCeiling))
  const upper = round(Math.max(mobile, atCeiling))

  return `clamp(${lower}px, calc(${round(originPx)}px + ${round(slopeVw)}vw), ${upper}px)`
}

/**
 * Format an object into a string of CSS variables
 * @param obj - The object to format
 * @param mapper - A function that maps the object's entries to a string
 * @param joiner - The string to join the mapped entries with
 * @returns A string of CSS variables
 */
export function formatObject<Obj extends object>(
  obj: Obj,
  mapper: (args: [key: keyof Obj, value: Obj[keyof Obj]]) => string,
  joiner = '\n\t'
) {
  // SAFETY: Object.entries()'s built-in typing widens keys to `string`;
  // the entries it returns are exactly `obj`'s own keys, i.e. `keyof Obj`.
  return (Object.entries(obj) as [keyof Obj, Obj[keyof Obj]][])
    .map(mapper)
    .join(joiner)
}
