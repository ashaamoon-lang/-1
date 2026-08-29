# MOTION SPEC

Binding rules for every animation in this project. Derived from measured
production CSS of ten award-winning sites — see `TEARDOWN.md` for the
evidence and `teardown-data.json` for raw counts.

The single most important idea: **motion quality comes from a small set of
consistent decisions, not from more animation.** A site with three timings
and two curves, applied consistently, reads as expensive. A site with
fifteen ad-hoc `gsap.to()` calls reads as cheap regardless of effort spent.

---

## 1. Easing — pick from tokens, never author a curve

All curves live in `lib/styles/css/easings.css` as Tailwind v4 `@theme`
tokens, so `--ease-*` custom properties and `ease-*` utilities both work.

**Never write a raw `cubic-bezier()` in a component. Never use bare
`ease`, `ease-in-out`, or `linear` for meaningful motion.**

### The four you will actually use

| Token                 | Curve                    | Use for                                           | Measured on                                         |
| --------------------- | ------------------------ | ------------------------------------------------- | --------------------------------------------------- |
| `--ease-out-quart`    | `(0.165, 0.84, 0.44, 1)` | **default for entrances**, reveals, most UI       | Minh Pham (60×), Iventions                          |
| `--ease-out-expo`     | `(0.19, 1, 0.22, 1)`     | large/hero moves, dramatic settle                 | Lando Norris                                        |
| `--ease-gleasing`     | `(0.4, 0, 0, 1)`         | darkroom's house curve; scroll-linked, transforms | Lusion (exact + 64× near-variants), basement.studio |
| `--ease-in-out-quart` | `(0.77, 0, 0.175, 1)`    | only when an element leaves **and returns**       | By-Kin                                              |

### Rules

- **Out-easing by default.** Elements arrive fast and settle slow. Almost
  every curve measured ends in `…,1)`.
- **In-easing only for exits** — something leaving toward the viewer's
  attention, never for an entrance.
- **In-out only for round trips.** A modal that opens and closes along the
  same path. Using in-out as a general default is the amateur tell.
- `linear` is correct for exactly two things: continuous marquees and
  progress indicators. Nothing else.

---

## 2. Duration — three bands, one default

| Band              | Range       | Default     | Applies to                                         |
| ----------------- | ----------- | ----------- | -------------------------------------------------- |
| **Micro**         | 150–250 ms  | **200 ms**  | hover, focus ring, colour change, small toggles    |
| **Standard**      | 300–600 ms  | **400 ms**  | element enter/exit, text reveal, menu open         |
| **Choreographed** | 800–1200 ms | **1000 ms** | page transition, hero sequence, full-viewport move |

**400 ms is the default.** It is the most-declared duration across the
measured sites (Lusion 40×, Minh Pham 39×, Iventions 21×).

**Never 300 ms as a global default.** It is the generic value that ships in
UI kits, and it is the reason a site reads as templated.

**Scale duration with distance and size.** A 24px nudge at 1000 ms feels
broken; a full-viewport panel at 200 ms feels cheap. Larger travel → longer
duration, within the band.

---

## 3. Stagger — the highest-value cheap trick

A group of elements animating in unison reads as one flat block. The same
group staggered reads as choreography. This is the biggest perceived-quality
gain per line of code in the whole spec.

| Context                    | Stagger      | Notes                                          |
| -------------------------- | ------------ | ---------------------------------------------- |
| Words / lines in a heading | **40–60 ms** | 50 ms default                                  |
| Characters                 | 15–25 ms     | only for short display text; never a paragraph |
| Cards in a grid            | 60–80 ms     | cap total at ~600 ms                           |
| Nav items                  | 40 ms        |                                                |
| List rows                  | 30–50 ms     |                                                |

**Cap the total.** `stagger × count` must not exceed ~600 ms for UI or
~900 ms for a hero. Twenty cards at 80 ms is 1.6s of waiting — that is not
elegance, it is latency. Use GSAP's `stagger: { each, from, amount }` and
prefer `amount` (total time) over `each` for large sets, so the total stays
fixed as the count grows.

---

## 4. What to animate

**Animate only `transform` and `opacity`.** These are the two properties the
compositor handles without layout or paint.

| Never animate                   | Use instead                                |
| ------------------------------- | ------------------------------------------ |
| `width` / `height`              | `transform: scale()`, or a clip-path       |
| `top`/`left`/`right`/`bottom`   | `transform: translate3d()`                 |
| `margin` / `padding`            | wrapper + transform                        |
| `box-shadow`                    | animate opacity of a shadow pseudo-element |
| `filter: blur()` on large areas | pre-rendered, or accept the cost knowingly |

`will-change` is a **last resort**, applied immediately before the animation
and removed after. Leaving it on permanently costs memory on every element
that carries it and can degrade the whole page.

---

## 5. `prefers-reduced-motion` — mandatory, no exceptions

Seven of ten measured award sites ship **zero** reduced-motion handling.
This project treats that as a defect to avoid, not a norm to copy.

**Reduced motion does not mean "no animation".** It means: no large
translation, no parallax, no scroll-hijacking, no spin or scale-from-zero,
no autoplaying loops. Opacity fades are generally fine and preserve the sense
that something changed.

### The contract every vault component honours

- Reads the preference at runtime, and **reacts to changes** (the user can
  flip it mid-session).
- Under reduced motion: content is **immediately visible and complete** —
  never left at `opacity: 0` because an animation was skipped. This is the
  bug that turns an accessibility feature into a blank page.
- WebGL scenes drop to a static frame or unmount entirely.
- Lenis smooth scroll is disabled; native scrolling takes over.

### CSS baseline

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a safety net, not a substitute for handling it in the component —
a JS-driven GSAP timeline ignores it entirely.

---

## 6. Scroll

**Lenis is the only smooth-scroll implementation.** It is already wired at
`components/layout/lenis`. Do not add a second scroll library, and do not
hand-roll scroll smoothing.

**Lenis, GSAP and Tempus must share one RAF loop.** This is the single most
common way a site built from good parts still feels cheap: two independent
`requestAnimationFrame` loops produce a subtle desynchronisation between
scroll position and scroll-driven animation that reads as jitter even at a
solid 60fps. Tempus exists specifically to solve this. The correct wiring is
in `vault/motion/` with the reasoning written out.

**ScrollTrigger rules**

- `scrub: true` for position-linked motion; a number (e.g. `scrub: 0.5`) adds
  smoothing lag and usually feels better on large moves.
- Never scrub anything that triggers layout.
- Prefer `once: true` for entrance reveals — replaying on every scroll-back
  is noise.
- Always `kill()` triggers on unmount. Leaked ScrollTriggers are the standard
  memory-leak-and-jank source in React + GSAP projects.

---

## 7. Page transitions

Budget: **800–1200 ms total**, out and in combined.

- The outgoing view must not simply vanish — give it a real exit, minimum
  ~300 ms.
- Never block the user from navigating during a transition.
- Under reduced motion: cross-fade only, ~200 ms.
- The transition must not delay data fetching. Overlap them.

---

## 8. Performance budget

| Metric                             | Budget                                               |
| ---------------------------------- | ---------------------------------------------------- |
| Frame time                         | ≤ 16.6 ms (60fps); ≤ 8.3 ms where 120Hz is realistic |
| Dropped frames during a transition | 0                                                    |
| Long tasks during scroll           | none > 50 ms                                         |
| CLS from animation                 | 0 — reserve space, never animate layout              |

**Honesty clause.** These are budgets, not measurements. Nothing in this
repo has been profiled on real hardware yet: the browser could not reach the
network from this environment (see `TEARDOWN.md`). Any performance claim
before `chrome-devtools-mcp` or a real profiling run is an estimate and must
be labelled as one.

---

## 9. Review checklist

Before any motion work is considered done:

- [ ] Every duration comes from a band in §2 — no ad-hoc values
- [ ] Every curve is an `--ease-*` token — no raw `cubic-bezier()`
- [ ] Only `transform` / `opacity` animated
- [ ] Reduced motion tested, and content is fully visible under it
- [ ] ScrollTriggers and GSAP contexts cleaned up on unmount
- [ ] Stagger total ≤ 600 ms (UI) / 900 ms (hero)
- [ ] No second RAF loop introduced
- [ ] Keyboard focus order unaffected by the animation
