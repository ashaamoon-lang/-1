/**
 * Contrast gate for the theme palette.
 *
 * The accepted baseline lives in `contrast-baseline.json`, not in this file, so
 * a fork that rebrands can re-record it in one step instead of hand-editing a
 * list that describes someone else's colours:
 *
 *   bun run contrast:accept
 *
 * The gate ratchets. A pairing that drops below WCAG AA and is not in the
 * baseline fails; a pairing that improves past its recorded ratio also fails,
 * so the baseline cannot quietly go stale. Both are fixed by re-accepting and
 * reviewing the diff.
 *
 * APCA gets the same ratchet, scoped to text pairs (`min === AA_TEXT`) below
 * Lc 60. WCAG remains the legal, absolute floor; APCA instead gates *changes*
 * — quiet when nothing moved, failing on a new or worsened sub-60 pair.
 *
 * Measurement itself lives in `contrast.ts`, shared with the accept command.
 *
 * Run with: bun test lib/styles/scripts/contrast.test.ts
 */

import { describe, expect, it } from 'bun:test'

import {
  AA_TEXT,
  APCA_MIN,
  MEASURED_TOKENS,
  measureContrast,
  readBaseline,
  readDerivedTokens,
} from './contrast'

const measurements = await measureContrast()
const { accepted, apcaAccepted } = await readBaseline()
const failing = measurements.filter((m) => m.ratio < m.min)
const weakApca = measurements.filter(
  (m) => m.min === AA_TEXT && Math.abs(m.lc) < APCA_MIN
)

describe('WCAG 2.1 AA contrast (blocking)', () => {
  it('measures every theme against every used token pair', () => {
    expect(measurements.length).toBeGreaterThan(0)
    expect(new Set(measurements.map((m) => m.key)).size).toBe(
      measurements.length
    )
  })

  /*
   * Every derived token is accounted for — replaced in the fork.
   *
   * This used to pin the exact list of derived token **names**, so a new token
   * failed the build until someone re-typed the list. Its stated purpose was
   * that "a new derived token cannot arrive without" a contrast decision, and
   * its own comment claimed `--hero-wash-mid` "is measured here anyway, and
   * deliberately."
   *
   * It was not. A name list proves a token was **parsed**, not **measured** —
   * a token is only measured when some entry in `PAIRS` uses it. Checked in
   * the fork, three of the seven were read and never compared against
   * anything: `hero-wash-mid`, `line`, `line-strong`. The pinned list had been
   * reporting a guarantee it did not provide.
   *
   * So this now asks the real question. Every derived token must be either
   * measured by a pair, or named below with the reason it is not — a
   * conscious decision per token, which is what the old list was reaching for.
   * A measured token passes on its own; nobody re-types anything.
   *
   * **Decided, on the repo owner's decision, when the fork went to `main`.**
   * All three are now measured by pairs in `contrast.ts`, so none is listed
   * below:
   *
   *   - `hero-wash-mid` — ink and muted text on it, both above 4.5:1 in both
   *     themes (and muted text on the wash's lightest stop, which no pair
   *     covered).
   *   - `line`, `line-strong` — held to 3:1 where one is a control's only
   *     visual: the command palette's scrollbar thumb, on its track and on
   *     the palette's ground. Both pairs **fail** (about 2:1) and ship as a
   *     recorded floor in `contrast-baseline.json`; the owner's decision was
   *     to measure and record, not to change the palette.
   *
   * Every other use of `--line` / `--line-strong` is **exempt from WCAG
   * 1.4.11**, and why, use by use — checked against each rule, not assumed:
   *
   *   - **Separators**: the hairlines between sections and rows (pages,
   *     footer, spine rows, lists, the palette's head and footer). They mark
   *     layout, not a component; what they separate is identified by its
   *     own text.
   *   - **Region edges**: the palette popup, the 404 panel, the dev-only
   *     not-configured page. Boundaries of regions, not of controls.
   *   - **Controls identified by their text**: the filter chips and the
   *     project page's practice chips (links), the search trigger, the
   *     palette's close button, the studio's closing action. 1.4.11 does not
   *     require a boundary where the text identifies the control, and the
   *     selected chip is shown by fill, not by its border.
   *   - **Controls identified by an icon**: the lightbox actions. The icon,
   *     in `--text-muted`, is what identifies each, and that token is
   *     measured above 4.5:1 on the ground.
   *   - **Decoration**: the breadcrumb separator glyph (the list and the
   *     link texts carry the structure), the ⌘K key frame (`aria-hidden`),
   *     the spine's rail, and the dot and grid textures in `vault/magic`.
   *
   * A new use of either token as a control's only visual belongs in
   * `contrast.ts`, as the scrollbar does.
   */
  it('accounts for every derived token — measured, or unmeasured on the record', async () => {
    const UNMEASURED = {} satisfies Record<string, string>

    const derived = await readDerivedTokens()
    expect(
      derived.length,
      'no derived tokens parsed — the reader is broken'
    ).toBeGreaterThan(0)

    const unaccounted = derived
      .map(({ token }) => token)
      .filter((token) => !MEASURED_TOKENS.has(token) && !(token in UNMEASURED))

    expect(
      unaccounted,
      'a derived token is neither measured by a pair in contrast.ts nor recorded as unmeasured here'
    ).toEqual([])

    // And the record cannot rot: a token listed as unmeasured that a pair now
    // measures, or that no longer exists, is stale and must leave it.
    const stale = Object.keys(UNMEASURED).filter(
      (token) =>
        MEASURED_TOKENS.has(token) ||
        !derived.some((entry) => entry.token === token)
    )
    expect(
      stale,
      'UNMEASURED lists a token that is now measured or gone'
    ).toEqual([])
  })

  it('introduces no contrast failure outside the accepted baseline', () => {
    const unexpected = failing
      .filter((m) => !(m.key in accepted))
      .map((m) => `${m.key} = ${m.ratio.toFixed(2)}:1 (needs ${m.min})`)

    // Run `bun run contrast:accept` if these are intentional.
    expect(unexpected).toEqual([])
  })

  it('keeps the baseline honest — improved pairs must leave it', () => {
    const failingKeys = new Set(failing.map((m) => m.key))
    const stale = Object.keys(accepted).filter((key) => !failingKeys.has(key))

    // Run `bun run contrast:accept` to drop these.
    expect(stale).toEqual([])
  })

  it('never regresses an accepted pair below its recorded ratio', () => {
    const worsened = failing.flatMap((m) => {
      const recorded = accepted[m.key]
      if (recorded === undefined || m.ratio >= recorded - 0.01) return []
      return [`${m.key} fell to ${m.ratio.toFixed(2)}:1 from ${recorded}`]
    })

    expect(worsened).toEqual([])
  })
})

describe('APCA (ratcheted)', () => {
  it('introduces no sub-60 text pair outside the accepted baseline', () => {
    const unexpected = weakApca
      .filter((m) => !(m.key in apcaAccepted))
      .map((m) => `${m.key} = Lc ${m.lc.toFixed(1)} (needs ${APCA_MIN})`)

    if (unexpected.length > 0) {
      console.warn(
        `\n  APCA regression — run \`bun run contrast:accept\` if intentional:\n    ${unexpected.join('\n    ')}\n`
      )
    }

    // Run `bun run contrast:accept` if these are intentional.
    expect(unexpected).toEqual([])
  })

  it('keeps the APCA baseline honest — improved pairs must leave it', () => {
    const weakKeys = new Set(weakApca.map((m) => m.key))
    const stale = Object.keys(apcaAccepted).filter((key) => !weakKeys.has(key))

    if (stale.length > 0) {
      console.warn(
        `\n  APCA baseline stale — run \`bun run contrast:accept\` to drop:\n    ${stale.join('\n    ')}\n`
      )
    }

    // Run `bun run contrast:accept` to drop these.
    expect(stale).toEqual([])
  })

  it('never regresses an accepted APCA pair below its recorded |Lc|', () => {
    const worsened = weakApca.flatMap((m) => {
      const recorded = apcaAccepted[m.key]
      if (recorded === undefined) return []
      const current = Math.abs(m.lc)
      const currentTenths = Math.round(current * 10)
      const recordedTenths = Math.round(recorded * 10)
      if (currentTenths >= recordedTenths) return []
      return [`${m.key} fell to Lc ${current.toFixed(1)} from ${recorded}`]
    })

    if (worsened.length > 0) {
      console.warn(`\n  APCA worsened:\n    ${worsened.join('\n    ')}\n`)
    }

    expect(worsened).toEqual([])
  })
})
