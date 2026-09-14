/**
 * How many things a hero says at once, and which heroes that rule governs.
 *
 * ## The rule, and the hole it had — Tahap 77
 *
 * `e2e/taste-preflight.e2e.ts` has enforced *"the hero is a single moment,
 * not a feature list"* since Tahap 34, with a ceiling of four. It ran on
 * `/en` and `/id`. **This site has seven heroes.**
 *
 * Measured at 1440x900 before any of this was written:
 *
 * ```
 * route                                 beats   h1 a beat?   stack   text leaves
 * /en                                       3   no               4             6
 * /en/studio                                7   no               8            18
 * /en/work                                  2   no               3             2
 * /en/work/arus-balik                       2   no               3             8
 * /en/journal                               1   no               2             2
 * /en/journal/scope-is-the-deliverable      1   no               2             4
 * /en/practice/consulting                   5   YES              5             7
 * ```
 *
 * Only the first row was ever measured by a gate.
 *
 * ## Three stages found the same hole and none of them closed it
 *
 * | stage | where                              | what it wrote                                     |
 * | ----- | ---------------------------------- | ------------------------------------------------- |
 * | 69    | `app/[locale]/studio/page.tsx`      | the rule "cannot see this header, which makes it guidance here rather than a gate" |
 * | 76    | `docs/stages/TAHAP-76.md` §4        | the formula double-counts the `h1` on this block   |
 * | 77    | this file                           | —                                                 |
 *
 * Three comments compensating for one missing declaration. That is the same
 * defect class as `[data-epic]` naming a moment with no element (Tahap 50,
 * 52), §7's five wrong numbers (Tahap 73), and `results.incomplete` that
 * nobody read (Tahap 72): **an invariant stated in prose with no instrument
 * that can see it.**
 *
 * ## Why the ceiling is not simply applied to all seven
 *
 * Measured first: extending it as-is turns `/studio` (8) and
 * `/practice/<v>` (5) red. Both are decisions taken *with* measurement —
 * Tahap 69 moved the capability band out of 85% page depth, Tahap 75 filled
 * 824px of empty first screen. Reddening them for a number would overturn two
 * measured decisions with taste, which is the Tahap 75 error inverted, one
 * stage after Tahap 76 corrected it.
 *
 * Four is an *arrival hero* number, from `ui-ux-pro-max`. The rule's own
 * sentence — "not a feature list" — is not something one integer can express
 * across seven heroes with different jobs. So the ceiling keeps its scope,
 * the scope becomes data, and `unclassifiedHeroes` below makes sure no hero
 * can quietly escape being one or the other.
 */

/** One hero, as the browser found it. */
export interface HeroReading {
  readonly route: string
  /** Elements inside the hero carrying `[data-reveal-item]`. */
  readonly beats: number
  /**
   * Whether the headline is itself one of those beats.
   *
   * The reason this field exists at all: the original formula added the
   * headline unconditionally, because on the home hero it reveals through
   * SplitText and carries no beat marker. That assumption held on five heroes
   * and broke on `PracticeHero`, which marks its own `h1` — so the gate
   * reported 6 for a stack of 5, on the one route it never ran.
   */
  readonly headlineIsBeat: boolean
  readonly hasHeadline: boolean
}

/**
 * The ceiling, and it governs arrival heroes only.
 *
 * Adopted in Tahap 34 from `ui-ux-pro-max`'s pre-flight, where its baseline
 * was **5** — index, headline, subline, CTA, cue — and the scroll cue was the
 * element removed to meet it.
 */
export const STACK_MAX = 4

/**
 * Heroes the ceiling does **not** govern, each with the measurement that
 * earned it. Same shape as `STORY_EXEMPT` (Tahap 73) and `VOID_EXEMPT`
 * (Tahap 74): a reason per entry, in data, rather than prose scattered across
 * three files.
 *
 * An exemption here is not a free pass — it is a claim that this hero's job
 * differs from an arrival hero's, and the `because` has to say how.
 */
export const STACK_EXEMPT: readonly { route: string; because: string }[] = [
  {
    route: '/en/studio',
    because:
      'Tahap 69 moved the twelve capabilities to the foot of this hero after measuring them at y=4255 of a 5008px page — 160px at 85% depth, the least-read thing on the page that exists to say what the studio does. The move cost no page height, filling slack the hero had already reserved. The page comment conceded the tension in the same breath ("a hero that grew a twelve-item feature list would be the pattern taste-preflight exists to keep out") and called the rule guidance here; this entry is that concession made into data. Stack measured 8',
  },
  {
    route: '/en/practice/consulting',
    because:
      'A nameplate, not an arrival: eyebrow, headline, intro, count, and the practice index Tahap 75 added to fill 824px of empty first screen (45% ink extent before, 97% after Tahap 76 anchored it). It sat at exactly 4 until Tahap 75 and crossed to 5 with nobody watching, which is the finding that produced this file. Five is over the arrival ceiling and the index is two links, not a feature list. Stack measured 5',
  },
  {
    route: '/en/work',
    because:
      'A catalogue header — eyebrow and one line of subtext above the grid. Stack measured 3, under the ceiling anyway; exempt because the ceiling is an arrival-hero rule and this is not one, not because it needs the room',
  },
  {
    route: '/en/work/arus-balik',
    because:
      'A project nameplate whose subject *is* its metadata — client, year, engagement, scope — carried in one definition list that reveals as a single beat. Stack measured 3',
  },
  {
    route: '/en/journal',
    because: 'An index header, eyebrow plus one line. Stack measured 2',
  },
  {
    route: '/en/journal/scope-is-the-deliverable',
    because:
      'An article masthead: date, practice link, headline, standfirst. Stack measured 2',
  },
]

/**
 * The stack a hero presents, counted once.
 *
 * The headline is added only when it is not already one of the beats — the
 * fix for the double-count Tahap 76 recorded and Tahap 77 measured.
 */
export function heroStack(reading: HeroReading): number {
  const headline = reading.hasHeadline && !reading.headlineIsBeat ? 1 : 0
  return reading.beats + headline
}

/** Whether a route is exempt from the ceiling. */
export function isStackExempt(route: string): boolean {
  return STACK_EXEMPT.some((entry) => entry.route === route)
}

/** Every governed hero that says more than `max` things at once. */
export function stackFaults(
  readings: readonly HeroReading[],
  max: number = STACK_MAX
): string[] {
  const faults: string[] = []
  for (const reading of readings) {
    if (isStackExempt(reading.route)) continue
    const stack = heroStack(reading)
    if (stack <= max) continue
    faults.push(
      `${reading.route}: hero stacks ${stack} elements against a ceiling of ${max} — the hero is a single moment, not a feature list`
    )
  }
  return faults
}

/**
 * Heroes that are neither governed nor exempt — the assertion that keeps this
 * hole from reopening.
 *
 * A hero arriving on a new route lands here until somebody decides which it
 * is, instead of waiting for a fourth stage to rediscover it and write a
 * fourth comment.
 */
export function unclassifiedHeroes(
  readings: readonly HeroReading[],
  governed: readonly string[]
): string[] {
  const faults: string[] = []
  for (const reading of readings) {
    if (governed.includes(reading.route)) continue
    if (isStackExempt(reading.route)) continue
    faults.push(
      `${reading.route}: hero is neither governed by the stack ceiling nor listed in STACK_EXEMPT with a reason — classify it in e2e/hero-stack.ts`
    )
  }
  return faults
}

/** Exemptions naming a route the sweep never visits. */
export function staleExemptions(readings: readonly HeroReading[]): string[] {
  const seen = new Set(readings.map((reading) => reading.route))
  return STACK_EXEMPT.filter((entry) => !seen.has(entry.route)).map(
    (entry) =>
      `${entry.route}: listed in STACK_EXEMPT but no hero was measured there`
  )
}
