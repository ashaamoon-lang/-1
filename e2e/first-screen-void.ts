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
 * Routes whose horizontal profile cannot be trusted, and why.
 *
 * This is an exemption for the **instrument**, not for the page — which is a
 * distinction worth keeping visible. SplitText replaces a headline's text node
 * with one span per word, so "elements that own text directly" measures word
 * fragments rather than the headline, and the gaps between words read as empty
 * column. Measured: `/en` reports 58% width used, which is not a fact about
 * the page.
 *
 * Left here rather than silently skipped so the limitation is countable, and
 * so the day someone teaches the collector about SplitText they can find the
 * routes that were waiting for it.
 */
export const WIDTH_EXEMPT: readonly { route: string; because: string }[] = [
  {
    route: '/en',
    because:
      'SplitText fragments the headline into per-word spans, so the collector measures words and reports the spaces between them as empty column. The number is an artefact of the instrument, not a measurement of the page',
  },
  {
    route: '/id',
    because: 'same hero, same SplitText, same artefact as /en',
  },
]

export interface WidthProfile {
  /** Share of the viewport width any content box covers. */
  readonly usedPct: number
  /** The widest run of columns carrying nothing. */
  readonly widestGap: number
  readonly at: string
}

export function widthProfile(
  columns: readonly Band[],
  width: number
): WidthProfile {
  if (width <= 0) return { usedPct: 0, widestGap: 0, at: '' }
  const merged = mergeBands(columns)
  const used = merged.reduce(
    (total, band) => total + (band.bottom - band.top),
    0
  )

  let widest = 0
  let at = ''
  const consider = (from: number, to: number) => {
    if (to - from > widest) {
      widest = to - from
      at = `x ${Math.round(from)}–${Math.round(to)}`
    }
  }
  const first = merged[0]
  if (!first) return { usedPct: 0, widestGap: width, at: `x 0–${width}` }
  consider(0, first.top)
  for (let index = 1; index < merged.length; index += 1) {
    const previous = merged[index - 1]
    const current = merged[index]
    if (previous && current) consider(previous.bottom, current.top)
  }
  const last = merged.at(-1)
  if (last) consider(last.bottom, width)

  return {
    usedPct: Math.round((100 * used) / width),
    widestGap: Math.round(widest),
    at,
  }
}

/**
 * The least of its width a first screen may actually use.
 *
 * Derived, not chosen: five of seven routes measure 95–97%, and the two that
 * do not are the SplitText artefact above. 60% is comfortably clear of the
 * working figure and still catches the 42% this was written for.
 */
export const WIDTH_MIN_PCT = 60

/** Every screen that leaves most of its width bare. */
export function widthFaults(
  screens: readonly Screen[],
  minPct: number = WIDTH_MIN_PCT
): string[] {
  const faults: string[] = []
  for (const screen of screens) {
    if (screen.width === undefined || screen.columns === undefined) continue
    if (WIDTH_EXEMPT.some((entry) => entry.route === screen.route)) continue
    const profile = widthProfile(screen.columns, screen.width)
    if (profile.usedPct >= minPct) continue
    faults.push(
      `${screen.route} at ${screen.viewport}: uses ${profile.usedPct}% of its width, leaving ${profile.widestGap}px bare (${profile.at})`
    )
  }
  return faults
}
