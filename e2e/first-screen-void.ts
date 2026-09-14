/**
 * How much of a first screen carries nothing, and whether that is a device or
 * a gap.
 *
 * ## The defect this was written for
 *
 * The home hero pins its practice index to grid row 1 and bottom-anchors
 * everything else in rows 2–4, so the frame's `minmax(0, 1fr)` slack sits
 * between them. Measured on the production build:
 *
 * ```
 * 1440×900   .index y 100–182   h1 y 465–655   ->  516px empty, 57% of the screen
 *  390×844                                     ->  554px empty, 66%
 * ```
 *
 * The index's own CSS says where it is supposed to be — *"the four columns the
 * headline's 9em measure leaves free"* — which is **beside** the headline.
 * Tahap 67 shipped the prop into the right columns and the wrong row, and
 * nothing noticed for forty stages. `docs/stages/TAHAP-74.md`.
 *
 * ## Leading air is not an interior hole
 *
 * This is the distinction the whole module exists for, and collapsing it is
 * how a gate starts failing correct pages.
 *
 * A bottom-anchored nameplate with air above it is a recognised editorial
 * device, and on `/practice/<v>` it is a **measured** one:
 * `practice-hero.module.css` sets `min-height: 70svh` with a comment carrying
 * its own numbers — the nameplate holds the screen so the statement below has
 * scroll runway, without which all 46 words resolve in 8% of the page. Judged
 * by total emptiness that page scores 50% and looks identical to the defect.
 * Judged by *where* the emptiness sits, it is leading air and the home hero is
 * a hole between two masses.
 *
 * So the profile separates the three, and only the interior one is a fault.
 *
 * ## Why the threshold is not a taste call
 *
 * Measured across seven routes at two viewports before any of this was
 * written, this site's working compositions sit at **4–16%** interior. The
 * ceiling below is more than double the worst of them: it is a rule against
 * holes, not a preference about density.
 */

/** A vertical span of the first screen, in CSS pixels from its top. */
export interface Band {
  readonly top: number
  readonly bottom: number
}

/** One measured first screen. */
export interface Screen {
  readonly route: string
  /** Human label for the viewport, e.g. `1440×900`. */
  readonly viewport: string
  readonly height: number
  /** Viewport width, for the horizontal profile. Omit to skip it. */
  readonly width?: number
  /** Horizontal spans the same content boxes occupy. Omit to skip. */
  readonly columns?: readonly Band[]
  /**
   * Boxes that carry **content** — text the reader reads, or a picture.
   *
   * Not grain, hairlines or the grid pattern. The first draft of this measure
   * counted anything that paints, and scored a visibly empty `/studio` first
   * screen at 100% because the grain layer covers the viewport. Ground is not
   * ink.
   */
  readonly boxes: readonly Band[]
}

/**
 * Compositions allowed an interior void, and why.
 *
 * `viewport` is deliberately part of the key rather than the reason text. Both
 * entries below are desktop-only — each collapses to 9% or less once the
 * columns stack on a phone — and a route-wide exemption would switch off the
 * viewport where this gate's own defect was **worst** (66% against 57%). An
 * exemption should cost exactly what it excuses.
 */
export const VOID_EXEMPT: readonly {
  route: string
  /** Omit to exempt the route at every viewport. */
  viewport?: string
  because: string
}[] = [
  {
    route: '/en/practice/consulting',
    because:
      '`practice-hero` is `min-height: 70svh` + `justify-content: flex-end` by design, and its own comment carries the measurement: the nameplate holds the screen so the statement below it has scroll runway, without which all 46 words of the statement resolve in 8% of the page. The "interior" reading comes from a 14px breadcrumb above the hero, not from a hole in it',
  },
  {
    route: '/en/studio',
    viewport: '1440×900',
    because:
      'Tahap 69 moved the capability band to the foot of the hero on purpose, after measuring it stranded at `opacity: 0` below the reveal line. The band is the trailing mass and the statement is the leading one, so the air between them is that decision, not a hole. Measured 40% at 1440×900 and 9% at 390×844 — it is a two-column artefact that stacks away on a phone, which is why this entry names the viewport',
  },
]

/** Overlapping or touching spans, joined. */
export function mergeBands(boxes: readonly Band[]): Band[] {
  const sorted = [...boxes]
    .filter((box) => box.bottom > box.top)
    .sort((a, b) => a.top - b.top)
  const merged: Band[] = []
  for (const box of sorted) {
    const last = merged.at(-1)
    if (last && box.top <= last.bottom) {
      merged[merged.length - 1] = {
        top: last.top,
        bottom: Math.max(last.bottom, box.bottom),
      }
    } else {
      merged.push({ top: box.top, bottom: box.bottom })
    }
  }
  return merged
}

export interface VoidProfile {
  /** Empty space above the first content. A device, never a fault. */
  readonly leading: number
  /** The largest empty span **between** two pieces of content. The fault. */
  readonly interior: number
  /** Empty space below the last content. A device, never a fault. */
  readonly trailing: number
  /** Where the interior span sits, for naming it in a failure. */
  readonly at: string
  /** `interior` as a percentage of the viewport height. */
  readonly interiorPct: number
}

export function voidProfile(
  boxes: readonly Band[],
  height: number
): VoidProfile {
  const merged = mergeBands(boxes)
  if (merged.length === 0) {
    // A first screen with no content at all is not "0% interior void" — it is
    // entirely leading air. Saying so beats reporting a clean profile for a
    // blank page, which is the shape of failure this project keeps paying for.
    return {
      leading: height,
      interior: 0,
      trailing: 0,
      at: '',
      interiorPct: 0,
    }
  }

  let interior = 0
  let at = ''
  for (let index = 1; index < merged.length; index += 1) {
    const previous = merged[index - 1]
    const current = merged[index]
    if (!previous || !current) continue
    const gap = current.top - previous.bottom
    if (gap > interior) {
      interior = gap
      at = `y ${Math.round(previous.bottom)}–${Math.round(current.top)}`
    }
  }

  const first = merged[0]
  const last = merged.at(-1)
  return {
    leading: Math.round(first?.top ?? 0),
    interior: Math.round(interior),
    trailing: Math.round(height - (last?.bottom ?? height)),
    at,
    interiorPct: height > 0 ? Math.round((100 * interior) / height) : 0,
  }
}

/**
 * The share of a first screen a hole between two masses may take.
 *
 * Derived, not chosen — see the module note. Seven routes at two viewports
 * measure 4–16%; this is more than double the worst of them.
 */
export const INTERIOR_MAX_PCT = 35

/** Every screen whose content is split around a hole. */
export function voidFaults(
  screens: readonly Screen[],
  maxPct: number = INTERIOR_MAX_PCT
): string[] {
  const faults: string[] = []
  for (const screen of screens) {
    const excused = VOID_EXEMPT.some(
      (entry) =>
        entry.route === screen.route &&
        (entry.viewport === undefined || entry.viewport === screen.viewport)
    )
    if (excused) continue
    const profile = voidProfile(screen.boxes, screen.height)
    if (profile.interiorPct <= maxPct) continue
    faults.push(
      `${screen.route} at ${screen.viewport}: ${profile.interior}px of nothing between content (${profile.interiorPct}% of the screen, ${profile.at}) — leading ${profile.leading}px, trailing ${profile.trailing}px`
    )
  }
  return faults
}

/**
 * How far a first screen's **ink** reaches across it.
 *
 * ## Why this replaced a measurement of boxes — Tahap 76
 *
 * The first version summed element **box** widths. On `/en/journal` that made
 * a one-word eyebrow inside a column-wide block count as 1398px of used width:
 *
 * ```
 * <p class="caption">Journal</p>   box x 16–1414 (1398px), ink about 60px
 * ```
 *
 * Every comparison Tahap 75 drew from it was wrong. It reported five routes at
 * "95–97%" and set a floor beneath that; measured as ink the same routes span
 * **30–97%**. Worse, the gate barely bit: with box widths every route reports
 * >= 95%, so it caught `/practice/<v>` only because `max-width: 60ch` happened
 * to cap that page's boxes too. Any route with wide boxes and narrow ink sailed
 * through — a gate that cannot fail on the defect that produced it, which is
 * the failure Tahap 68, 70 and 72 each recorded once.
 *
 * Ink comes from `Range.getClientRects()` over the text nodes, the same
 * technique `e2e/contrast-situ.ts` uses to find glyph boxes.
 *
 * The vertical axis was checked the same way before any of this was blamed on
 * the file as a whole: box and ink agree within 1–2px on all seven routes,
 * because for text a box's height *is* its ink's height. Tahap 74 stands.
 */

export interface WidthProfile {
  /** Share of the viewport width ink actually covers. */
  readonly coveragePct: number
  /**
   * Leftmost to rightmost ink, as a share of the viewport.
   *
   * The number the gate below uses, and the two are not interchangeable: the
   * home hero measures 30% coverage and 70% extent, because it is two masses
   * with a deliberate gap between them. Coverage calls that the emptiest page
   * on the site; extent knows it reaches across. A composition is allowed to
   * leave air in the middle — that is what Tahap 74 established — and is not
   * allowed to be confined to one narrow column.
   */
  readonly extentPct: number
  readonly leftmost: number
  readonly rightmost: number
}

export function widthProfile(
  columns: readonly Band[],
  width: number
): WidthProfile {
  if (width <= 0 || columns.length === 0) {
    return { coveragePct: 0, extentPct: 0, leftmost: 0, rightmost: 0 }
  }
  const merged = mergeBands(columns)
  const covered = merged.reduce(
    (total, band) => total + (band.bottom - band.top),
    0
  )
  const first = merged[0]
  const last = merged.at(-1)
  const leftmost = Math.round(first?.top ?? 0)
  const rightmost = Math.round(last?.bottom ?? 0)
  return {
    coveragePct: Math.round((100 * covered) / width),
    extentPct: Math.round((100 * (rightmost - leftmost)) / width),
    leftmost,
    rightmost,
  }
}

/**
 * The least of its width a first screen's ink may span.
 *
 * **A floor against confinement, not a measure of composition.** That
 * distinction is the whole of what Tahap 76 learned: measured honestly these
 * routes read 66, 70, 79, 89, 97, 97, 97 — a continuum with no cliff in it. No
 * threshold separates a good composition from a poor one here, and a number
 * that pretends otherwise is taste wearing a measurement's clothes, which is
 * exactly what the first version of this constant was.
 *
 * What it *can* say is that a page has not confined its subject to one narrow
 * column while its grid offers twelve. The margins, written down rather than
 * implied — every figure here measured as ink, at 1440x900:
 *
 * ```
 * /practice before Tahap 75 fixed it       45%   would fail
 * this floor                               50%
 * lowest passing route                     66%   (/journal)
 * next lowest                              70%   (/en)
 * ```
 *
 * The 45% is measured, not inherited: Tahap 75 reported that same state as
 * "42%", which was its *box* extent, and quoting it in an ink table would have
 * repeated the error this stage exists to correct.
 *
 * The passing margin was much tighter when this constant was written —
 * `/practice` sat at 53%, three points off the floor — and Tahap 76c moved it
 * to 97% for reasons of composition rather than of this gate. The floor did
 * not move to suit it.
 *
 * At 390px every route measures 83–89% — blocks stack full width on a phone —
 * so this is a desktop question and the gate says so rather than pretending to
 * measure something on both.
 */
export const EXTENT_MIN_PCT = 50

/** Every screen whose ink is confined to a narrow column. */
export function widthFaults(
  screens: readonly Screen[],
  minPct: number = EXTENT_MIN_PCT
): string[] {
  const faults: string[] = []
  for (const screen of screens) {
    if (screen.width === undefined || screen.columns === undefined) continue
    const profile = widthProfile(screen.columns, screen.width)
    if (profile.extentPct >= minPct) continue
    faults.push(
      `${screen.route} at ${screen.viewport}: ink spans ${profile.extentPct}% of the width (x ${profile.leftmost}–${profile.rightmost}), confined below the ${minPct}% floor`
    )
  }
  return faults
}
