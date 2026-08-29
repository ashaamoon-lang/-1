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
  /** 200ms — hover, focus, colour, small state flips. CSS: `--duration-fast`. */
  fast: 0.2,
  /** 400ms — the default. Enter/exit, reveals, menus. CSS: `--duration`. */
  base: 0.4,
  /** 800ms — page transitions, hero sequences. CSS: `--duration-slow`. */
  slow: 0.8,
  /** 1200ms — the longest sanctioned move. Measured as By-Kin's dominant value. */
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
