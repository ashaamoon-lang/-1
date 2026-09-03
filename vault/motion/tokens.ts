/**
 * Motion tokens — the bridge between CSS and GSAP.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The curve values are Satūs's own (`lib/styles/css/easings.css`, MIT,
 * darkroom.engineering); this module only re-exports them in a form GSAP can
 * consume. Curve selection is justified by measurement — see
 * `docs/TEARDOWN.md` §1.
 *
 * ## Why this file exists
 *
 * The same motion is expressed twice in a project like this: in CSS (
 * transitions, `@keyframes`) and in JS (GSAP tweens). CSS speaks
 * `cubic-bezier()`; GSAP speaks named eases like `power3.out`. Left to
 * drift, a hover written in CSS and a reveal written in GSAP end up on
 * subtly different curves, and the page reads as if two people built it.
 *
 * This module is the single place the two vocabularies are reconciled.
 * `CLAUDE.md` forbids raw `cubic-bezier()` in components; this is what makes
 * that rule practical to follow.
 *
 * ## On exactness
 *
 * The GSAP names below are **visually equivalent, not mathematically
 * identical**. The CSS values are cubic-bezier approximations of the Penner
 * easing polynomials; GSAP's `power*`/`expo` eases evaluate the polynomials
 * directly. The difference is imperceptible in UI motion and is stated here
 * rather than glossed over. Where an exact match matters (a CSS transition
 * and a GSAP tween running on the same element at the same time), drive both
 * from CSS or both from GSAP — not one of each.
 */

/**
 * Easing tokens.
 *
 * `css` is the custom property to use in a stylesheet; `gsap` is the
 * equivalent to pass as a tween's `ease`; `bezier` is the literal value,
 * exported for documentation and Storybook only — never inline it into a
 * component.
 */
export const easing = {
  /**
   * Default for entrances, reveals, and most UI.
   *
   * Measured as the most-used curve on Minh Pham (60 occurrences) and on
   * Iventions. Exactly Satūs's `--ease-out-quart`.
   */
  outQuart: {
    css: 'var(--ease-out-quart)',
    gsap: 'power3.out',
    bezier: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  },
  /**
   * Large or hero-scale moves that should settle dramatically.
   *
   * Measured on Lando Norris. Exactly Satūs's `--ease-out-expo`.
   */
  outExpo: {
    css: 'var(--ease-out-expo)',
    gsap: 'expo.out',
    bezier: 'cubic-bezier(0.19, 1, 0.22, 1)',
  },
  /**
   * darkroom.engineering's house curve, and the closest single match to what
   * Lusion ships (`.4,0,.1,1` and `.35,0,0,1`, 32 occurrences each) and to
   * basement.studio's `.4,0,.2,1`.
   *
   * Slight ease-in at the start makes it read well for scroll-linked motion
   * and transforms, where a pure out-curve can look like it starts too abruptly.
   */
  gleasing: {
    css: 'var(--ease-gleasing)',
    gsap: 'power2.inOut',
    bezier: 'cubic-bezier(0.4, 0, 0, 1)',
  },
  /**
   * Only for a move that leaves **and returns** along the same path — a modal
   * opening then closing, a drawer.
   *
   * Using in-out as a general default is the clearest amateur tell in web
   * motion. Measured on By-Kin, used sparingly.
   */
  inOutQuart: {
    css: 'var(--ease-in-out-quart)',
    gsap: 'power3.inOut',
    bezier: 'cubic-bezier(0.77, 0, 0.175, 1)',
  },
} as const

export type EasingName = keyof typeof easing

/**
 * Duration tokens, in seconds (GSAP's unit).
 *
 * These mirror the CSS custom properties already declared in
 * `lib/styles/css/global.css` — `--duration-fast`, `--duration`,
 * `--duration-slow`. Keep the two in step: changing one without the other
 * reintroduces exactly the drift this module exists to prevent.
 *
 * Bands are from measurement (`docs/TEARDOWN.md` §2). 400ms is the default
 * because it is the most-declared duration across the sites measured —
 * notably *not* the 300ms that ships as a default in most UI kits.
 */
export const duration = {
  /**
   * 150ms — the micro band's floor. Anticipation on press, and the small
   * state flips in `components/ui/` that want to feel instant rather than
   * merely fast. CSS: `--duration-micro`.
   *
   * It existed in CSS and not here. Ten component stylesheets use
   * `--duration-micro`; this module — whose entire job is to keep the two
   * vocabularies in step — did not know the value, so anything written in
   * GSAP against it had to guess. `tokens.test.ts` now fails on that class of
   * gap rather than leaving it to be noticed.
   */
  micro: 0.15,
  /** 200ms — hover, focus, colour, small state flips. CSS: `--duration-fast`. */
  fast: 0.2,
  /** 400ms — the default. Enter/exit, reveals, menus. CSS: `--duration`. */
  base: 0.4,
  /** 800ms — page transitions, hero sequences. CSS: `--duration-slow`. */
  slow: 0.8,
  /**
   * 1200ms — the longest sanctioned move. Measured as By-Kin's dominant value.
   * CSS: `--duration-choreographed`.
   */
  choreographed: 1.2,
} as const

export type DurationName = keyof typeof duration

/**
 * Stagger steps, in seconds.
 *
 * Stagger is the highest perceived-quality gain per line of code in the whole
 * system: a group animating in unison reads as one flat block, the same group
 * staggered reads as choreography.
 *
 * **Always cap the total.** `step * count` must stay under ~0.6s for UI and
 * ~0.9s for a hero, or the effect stops being elegance and becomes latency.
 * For large sets prefer GSAP's `stagger: { amount }` (total time, fixed) over
 * `{ each }` (per-item, grows without bound).
 */
export const stagger = {
  /** Characters — short display text only, never a paragraph. */
  chars: 0.02,
  /** Words and lines in a heading. The most-used value here. */
  words: 0.05,
  /** Nav items, list rows. */
  items: 0.04,
  /** Cards in a grid. */
  cards: 0.07,
} as const

export type StaggerName = keyof typeof stagger

/**
 * The interaction grammar — `docs/MOTION-SPEC.md` §9.
 *
 * ## What this is for
 *
 * Everything above describes **materials**: which curve, how long, how far
 * apart. None of it says what a *moment* is made of. That gap is why a site
 * can obey every rule in this file and still feel like a document — the
 * curves are right and nothing ever answers a press.
 *
 * So this is the one sentence the whole site speaks, and every pressable noun
 * — a project card, the hero's call to action, a discipline chip, a nav item,
 * the contact address — speaks the same one:
 *
 * ```
 * REST ─▶ INTENT ─▶ COMMIT ─▶ TRANSPORT ─▶ SETTLE ─▶ REST′
 *         hover     press      release      arrival
 *         focus     Enter      navigate     assembled
 * ```
 *
 * Five different effects would be five things to keep consistent. One sentence
 * with five nouns is one thing, and it is the same restraint this project
 * already applies to colour and type: two families, three weights, no chromatic
 * accent.
 *
 * ## COMMIT is the state that did not exist
 *
 * `grep -rn ":active" --include=*.css` returned **zero** across the whole
 * project before Tahap 12; eighteen stylesheets used `:hover`. Between "I
 * touched this" and "a new page appeared" the site was silent.
 *
 * COMMIT is a single beat of anticipation — a small compression before the
 * release. That beat is most of what separates game animation from a web
 * transition: without it a movement reads as *announced* rather than *done*.
 *
 * ## Why 150ms and not 120
 *
 * The plan for this stage called for ~120ms. That would have been the first
 * duration in the project outside a declared band (§2 puts micro at 150–250ms),
 * and inventing an out-of-band value is exactly the ad-hoc drift the bands
 * exist to prevent. 150ms is the band's floor, it already exists in CSS as
 * `--duration-micro`, and against `outQuart` most of the movement lands in the
 * first 60ms — so it reads as immediate anyway.
 *
 * ## Overshoot, rejected on the record
 *
 * `ui-ux-pro-max` recommends `back.out(1.4)` and `elastic.out(1, 0.4)` for
 * interactions at this tier. Both are raw curves, which `CLAUDE.md` #1
 * forbids in a component, and a bounce is the wrong register for this site —
 * rejected for the same reason in Tahap 11c. Settling happens through
 * `outExpo`.
 *
 * `css` is the custom property to use in a stylesheet, `seconds` the value to
 * hand GSAP. They are asserted equal by `tokens.test.ts`, so the drift this
 * module exists to prevent is now checked rather than intended.
 */
export const interaction = {
  /** The element declares itself alive. Hover, or `:focus-visible`. */
  intent: {
    seconds: duration.fast,
    css: 'var(--duration-fast)',
    easing: easing.outQuart,
  },
  /** Anticipation. `:active`, which fires for Enter and Space too. */
  commit: {
    seconds: duration.micro,
    css: 'var(--duration-micro)',
    easing: easing.outQuart,
  },
  /** The pressed element becomes the stage. The route swap happens here. */
  transport: {
    seconds: duration.base,
    css: 'var(--duration)',
    easing: easing.outExpo,
  },
  /** The destination assembles around what arrived. */
  settle: {
    seconds: duration.slow,
    css: 'var(--duration-slow)',
    easing: easing.outExpo,
  },
} as const

export type InteractionState = keyof typeof interaction

/**
 * The material layer — `docs/MOTION-SPEC.md` §11, `docs/stages/TAHAP-14.md` §5.
 *
 * ## Why these are here and not in CSS
 *
 * Every other token in this file has a CSS twin, because every other kind of
 * motion here is expressible in both vocabularies. These are not: they are
 * shader uniforms, and CSS has no way to say "offset this texture's UV by a
 * velocity field". Putting them in a component would still be a hardcoded
 * design value (`CLAUDE.md` #8), so they live here — the file whose job is
 * being the one place a motion value is written down.
 *
 * ## Why the numbers are this small
 *
 * `ui-ux-pro-max` (`--domain gsap`, "image displacement hover") returns
 * *"Keep displacement under 2px so it reads as feedback not motion"*. That
 * guidance is for translating a DOM element, and it does not transfer
 * literally: warping a texture's UVs by 2px on a 704px plate is
 * sub-perceptual, so obeying the number would produce nothing at all.
 *
 * What does transfer is the principle. `displacement` is expressed in UV
 * space, so its pixel amplitude scales with the plate: at the 704px half-column
 * width this project's grid uses, 0.008 is ~5.6px of maximum warp, and that
 * only at the peak of a fast pointer sweep. The deviation from the skill's
 * literal figure is recorded here rather than silently taken.
 *
 * `MAX_DISPLACEMENT` is the ceiling `tokens.test.ts` enforces. It exists
 * because this is the one value in the project that is tempting to raise: a
 * bigger number is more obviously "doing something", and it is exactly how a
 * material becomes an effect.
 */
export const material = {
  /**
   * Peak UV offset driven by the pointer velocity field, 0–1. The flowmap
   * decays toward zero, so this is a maximum reached only in motion — a still
   * pointer renders the plate undistorted.
   */
  displacement: 0.008,
  /**
   * Ambient UV drift amplitude, 0–1. Roughly a quarter of `displacement`:
   * enough that a plate is not frozen when nobody is touching it, not enough
   * to read as an animation of its own.
   */
  drift: 0.002,
  /** Seconds for one full ambient drift cycle. Slow on purpose. */
  driftPeriod: 12,
  /**
   * Hard ceiling for `displacement`. Above this the warp stops reading as the
   * surface of a material and starts reading as an effect applied to a
   * picture.
   */
  MAX_DISPLACEMENT: 0.012,
  /**
   * Peak UV offset of the plate's **interior** driven by scroll velocity, 0-1.
   *
   * ## Why a second input exists at all
   *
   * `docs/stages/TAHAP-21.md` §2 measured what a reader actually meets. A
   * pointer sweep across a plate moves 2.6% of its pixels; **scrolling moves
   * 0.00%** — the flowmap listens to the pointer and to nothing else
   * (`lib/webgl/utils/flowmaps/index.tsx`), and parks its stamp off screen at
   * zero velocity when the pointer is still. So the one original thing on
   * this site could only be met by a reader who happened to sweep a mouse
   * across an image. A reader who scrolls — which is how a portfolio is
   * actually read — never saw it.
   *
   * This is the fix, and it is deliberately not "more". `displacement` did
   * not change; `MAX_DISPLACEMENT` did not change. What changed is *when* the
   * material is reachable.
   *
   * ## The ladder
   *
   * With this token the material has three inputs, and they are deliberately
   * ordered by how deliberate the gesture that triggers them is:
   *
   * ```
   * drift 0.002  ambient      nobody did anything
   * shear 0.005  scrolling    someone is reading
   * displacement 0.008  pointer   someone reached for it
   * ```
   *
   * Sweeping is a choice; reading is continuous; the drift is neither. An
   * amplitude that is pleasant once, on purpose, is an irritation when it
   * answers every notch of the wheel — so the ladder is the design, not just
   * a safety margin. `tokens.test.ts` asserts the ordering rather than
   * trusting it, and `e2e/visual-substance.e2e.ts` asserts it again in
   * rendered pixels — where the amplitudes are actually comparable, which as
   * numbers they are not: `displacement` scales a velocity field whose own
   * magnitude is not 1, `shear` is the offset itself.
   *
   * Measured on the production build at 1280x800, one 614x767 plate, pixels
   * changed inside a fixed 400x500 window over the plate: **2.12% drifting,
   * 2.94% scrolling, 9.28% under a pointer sweep** — the ladder, in pixels.
   */
  shear: 0.005,
  /**
   * Scroll speed, in CSS pixels per second, at which `shear` reaches its peak.
   *
   * Above it the response saturates rather than growing, so a flick and a
   * programmatic jump land at the same amplitude as brisk reading instead of
   * lurching. Chosen so ordinary wheel reading reaches a real fraction of the
   * peak — a reference so high that only a flick triggers anything would
   * reproduce the exact defect this token exists to remove.
   */
  shearVelocity: 1000,
  /**
   * Exponential decay time constant, in seconds, for the shear.
   *
   * `duration.base / 3` puts ~95% of the recovery inside 400ms — the
   * project's default duration — rather than inventing a fourth number. Same
   * frame-rate-independent form as the cursor's follow in
   * `vault/primitives/cursor`: `factor = 1 - exp(-seconds / tau)`.
   */
  shearTau: duration.base / 3,
} as const
