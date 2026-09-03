/**
 * Keeps the two motion vocabularies in step, and the grammar inside its bands.
 *
 * ## What this catches that nothing else did
 *
 * `tokens.ts` exists for exactly one reason, written at the top of the file:
 * the same motion is expressed twice in a project like this — once in CSS
 * (`--duration-fast`, `--ease-out-quart`) and once in GSAP (`0.2`,
 * `power3.out`) — and left alone the two drift until a hover written in CSS
 * and a reveal written in GSAP run on different curves.
 *
 * Nothing checked that they agreed. `bun run check` runs oxlint, oxfmt, tsc
 * and the unit suite; none of them reads a CSS custom property. And they had
 * already drifted, in both directions:
 *
 *   - CSS declared `--duration-micro: 150ms` and TypeScript did not know the
 *     value, while ten component stylesheets used it;
 *   - TypeScript declared `choreographed: 1.2` and CSS had no token for it,
 *     so a choreographed move written in CSS had nothing to reach for.
 *
 * Neither is visible in a diff. Both are the kind of gap that surfaces as
 * "this feels slightly off" months later.
 *
 * ## Why the CSS is read as text
 *
 * There is no DOM here, so `getComputedStyle` is not available and would be
 * the wrong instrument anyway: it would report what the browser resolved
 * after the cascade, and the claim is about what the source declares. The
 * declaration is the contract.
 */

import { describe, expect, it } from 'bun:test'
import { readFile } from 'node:fs/promises'

import { duration, easing, interaction, material, stagger } from './tokens'

const GLOBAL_CSS = 'lib/styles/css/global.css'
const EASINGS_CSS = 'lib/styles/css/easings.css'

/** Every `--name: value;` declared in a file, as written. */
async function customProperties(path: string): Promise<Map<string, string>> {
  const source = await readFile(path, 'utf8')
  const found = new Map<string, string>()

  // Comments first: a commented-out declaration is not a declaration, and
  // several of these tokens carry long block comments above them that mention
  // other token names in prose.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '')

  for (const match of code.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    const name = match[1]
    const value = match[2]
    if (name && value) found.set(name, value.trim())
  }

  return found
}

/** `var(--x)` → `--x`. Anything else is a mistake worth failing on. */
function nameOf(cssVar: string): string {
  const match = /^var\((--[\w-]+)\)$/.exec(cssVar)
  if (!match?.[1]) throw new Error(`not a bare custom property: ${cssVar}`)
  return match[1]
}

/** The three bands, `MOTION-SPEC.md` §2, in seconds. */
const BANDS: readonly [name: string, low: number, high: number][] = [
  ['micro', 0.15, 0.25],
  ['standard', 0.3, 0.6],
  ['choreographed', 0.8, 1.2],
]

function bandOf(seconds: number): string | null {
  return (
    BANDS.find(([, low, high]) => seconds >= low && seconds <= high)?.[0] ??
    null
  )
}

describe('motion tokens: CSS and GSAP say the same thing', () => {
  it('reads both stylesheets at all', async () => {
    // A gate that examined nothing must not report success.
    expect((await customProperties(GLOBAL_CSS)).size).toBeGreaterThan(10)
    expect((await customProperties(EASINGS_CSS)).size).toBeGreaterThan(3)
  })

  it('every duration in TypeScript has a CSS token with the same value', async () => {
    const css = await customProperties(GLOBAL_CSS)

    /*
     * Written out rather than derived from the names, and as tuples rather
     * than an object.
     *
     * `base` is `--duration`, not `--duration-base` — a convention with one
     * exception is not a convention, so the mapping is stated. Tuples because
     * `Object.entries` on a keyed record widens the key back to `string` and
     * forces an assertion to narrow it again, and an assertion in a test is a
     * place the test can lie.
     */
    const pairs: readonly (readonly [keyof typeof duration, string])[] = [
      ['micro', '--duration-micro'],
      ['fast', '--duration-fast'],
      ['base', '--duration'],
      ['slow', '--duration-slow'],
      ['choreographed', '--duration-choreographed'],
    ]

    const mismatched: string[] = []
    for (const [name, property] of pairs) {
      const declared = css.get(property)
      const expected = `${duration[name] * 1000}ms`
      if (declared !== expected) {
        mismatched.push(
          `${name}: tokens.ts says ${expected}, ${property} says ${declared ?? '(missing)'}`
        )
      }
    }

    expect(mismatched, mismatched.join('\n')).toEqual([])
  })

  it('every stagger with a CSS token agrees with it', async () => {
    const css = await customProperties(GLOBAL_CSS)

    // Only the two that CSS declares. `chars` and `items` are driven from
    // GSAP alone; asserting a CSS token for them would be asserting that a
    // token we deliberately did not add exists.
    const pairs: readonly (readonly [keyof typeof stagger, string])[] = [
      ['words', '--stagger-words'],
      ['cards', '--stagger-cards'],
    ]

    const mismatched: string[] = []
    for (const [name, property] of pairs) {
      const declared = css.get(property)
      const expected = `${stagger[name] * 1000}ms`
      if (declared !== expected) {
        mismatched.push(
          `${name}: tokens.ts says ${expected}, ${property} says ${declared ?? '(missing)'}`
        )
      }
    }

    expect(mismatched, mismatched.join('\n')).toEqual([])
  })

  it('every easing names a curve the stylesheet actually declares', async () => {
    const css = await customProperties(EASINGS_CSS)

    const missing = Object.entries(easing)
      .map(([name, curve]) => ({ name, property: nameOf(curve.css) }))
      .filter(({ property }) => !css.has(property))
      .map(({ name, property }) => `${name} → ${property}`)

    expect(
      missing,
      `easing tokens with no CSS declaration: ${missing.join(', ')}`
    ).toEqual([])
  })

  it('every easing matches the bezier it documents', async () => {
    const css = await customProperties(EASINGS_CSS)

    // `bezier` is exported for Storybook and documentation. If it disagrees
    // with the stylesheet then the catalogue shows one curve and the site
    // ships another, which is worse than not documenting it at all.
    const wrong = Object.entries(easing)
      .filter(([, curve]) => {
        const declared = css.get(nameOf(curve.css))
        return (
          declared?.replace(/\s+/g, '') !== curve.bezier.replace(/\s+/g, '')
        )
      })
      .map(
        ([name, curve]) =>
          `${name}: documents ${curve.bezier}, CSS declares ${css.get(nameOf(curve.css))}`
      )

    expect(wrong, wrong.join('\n')).toEqual([])
  })
})

describe('the interaction grammar (MOTION-SPEC.md §9)', () => {
  it('gives every state a duration inside a declared band', () => {
    // The rule that would have caught the plan's own ~120ms COMMIT: it sits
    // below the micro band's floor, and an out-of-band value is how a project
    // ends up with fifteen ad-hoc timings.
    const outside = Object.entries(interaction)
      .filter(([, state]) => bandOf(state.seconds) === null)
      .map(
        ([name, state]) => `${name}: ${state.seconds * 1000}ms is in no band`
      )

    expect(outside, outside.join('\n')).toEqual([])
  })

  it('gives every state a curve from the four tokens', () => {
    const curves = new Set(Object.values(easing))
    const strays = Object.entries(interaction)
      .filter(([, state]) => !curves.has(state.easing))
      .map(([name]) => name)

    expect(
      strays,
      `states on a curve that is not a token: ${strays.join(', ')}`
    ).toEqual([])
  })

  it('keeps each state`s CSS property and seconds in agreement', async () => {
    const css = await customProperties(GLOBAL_CSS)

    const mismatched = Object.entries(interaction)
      .filter(
        ([, state]) =>
          css.get(nameOf(state.css)) !== `${state.seconds * 1000}ms`
      )
      .map(
        ([name, state]) =>
          `${name}: ${state.css} is ${css.get(nameOf(state.css))}, seconds says ${state.seconds * 1000}ms`
      )

    expect(mismatched, mismatched.join('\n')).toEqual([])
  })

  it('escalates: intent ≤ commit-band, and each later state is not faster', () => {
    /*
     * The shape of the sentence, not just its words.
     *
     * COMMIT is deliberately the *shortest* — anticipation is a beat, not a
     * move — and everything after it grows: TRANSPORT carries the reader to
     * another page, SETTLE assembles what they find there. A grammar whose
     * settle is quicker than its transport is not a grammar, it is four
     * unrelated tweens sharing a name.
     */
    const { intent, commit, transport, settle } = interaction

    expect(commit.seconds).toBeLessThanOrEqual(intent.seconds)
    expect(transport.seconds).toBeGreaterThan(intent.seconds)
    expect(settle.seconds).toBeGreaterThan(transport.seconds)
  })
})

describe('the material layer (MOTION-SPEC.md §11)', () => {
  /*
   * `tokens.ts` has said since Tahap 14 that `MAX_DISPLACEMENT` "is the
   * ceiling `tokens.test.ts` enforces". It was not: nothing in this file had
   * ever read `material`. The ceiling was a comment, and a comment does not
   * fail a build. Found while adding the shear below; recorded in
   * `docs/stages/TAHAP-21.md` §8 rather than quietly fixed.
   */
  it('keeps the pointer displacement under its declared ceiling', () => {
    expect(
      material.displacement,
      `displacement ${material.displacement} is above the ${material.MAX_DISPLACEMENT} ceiling — above it the warp reads as an effect applied to a picture, not as the surface of a material`
    ).toBeLessThanOrEqual(material.MAX_DISPLACEMENT)
  })

  it('keeps the ambient inputs quieter than the deliberate one', () => {
    /*
     * Two inputs answer the reader, and they are not equals. A pointer sweep
     * is a choice made once; scrolling and the ambient drift are continuous,
     * and an amplitude that is pleasant on purpose is an irritation when it
     * answers every notch of the wheel.
     *
     * This asserts the *declared relation*, which is the part that can drift
     * in a diff. It is not a claim about rendered pixels — `displacement`
     * scales a velocity field whose magnitude is not 1, while `shear` is the
     * offset itself, so the two numbers are not in the same unit.
     * `e2e/visual-substance.e2e.ts` makes the pixel claim, where they are.
     */
    expect(
      material.shear,
      `shear ${material.shear} is not below the pointer's ${material.displacement}`
    ).toBeLessThan(material.displacement)

    expect(
      material.drift,
      `drift ${material.drift} is not below the scroll's ${material.shear} — the input nobody asked for must be the quietest of the three`
    ).toBeLessThan(material.shear)
  })

  it('decays the shear on a time constant derived from a duration token', () => {
    /*
     * The whole point of this file is that a motion value is written down
     * once. A tau picked as a bare 0.13 would be a fourth number nobody could
     * trace; this one is `duration.base / 3`, so ~95% of the recovery lands
     * inside the project's default 400ms.
     */
    expect(material.shearTau).toBeCloseTo(duration.base / 3, 10)

    // A tau of zero would make the decay instant and the guard a lie; a long
    // one would leave the plate skewed after the reader stopped.
    expect(material.shearTau).toBeGreaterThan(0)
    expect(material.shearTau).toBeLessThan(duration.base)

    // Saturation reference, in CSS px/s. Zero would divide by zero; a huge
    // value would mean only a flick ever triggers anything, which is the
    // defect this token was added to remove.
    expect(material.shearVelocity).toBeGreaterThan(0)
  })
})
