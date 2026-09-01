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

They are also re-exported with their GSAP equivalents from
`vault/motion/tokens.ts`, so a tween and a CSS transition can be written
against the same named curve.

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

## 9. The interaction grammar

Sections 1–8 describe **materials**: which curve, how long, how far apart,
what may move. None of them says what a **moment** is made of. A site can obey
every rule above and still feel like a document, because the curves are right
and nothing ever answers a press.

This section is the missing half. It was added in Tahap 12 after one command
made the gap concrete:

```bash
grep -rn ":active" --include=*.css app components vault lib
# → 0
```

Zero. Eighteen stylesheets used `:hover`; not one element in the site changed
when it was pressed. Between "I touched this" and "a new page appeared", the
site was silent.

### 9.1 One sentence, five nouns

Every pressable thing — a project card, the hero's call to action, a
discipline chip, a nav item, the contact address — moves through the **same**
sequence:

```
REST ──▶ INTENT ──▶ COMMIT ──▶ TRANSPORT ──▶ SETTLE ──▶ REST′
         hover      press       release       arrival
         focus      Enter       navigate      assembled
```

| State         | Band (§2)     | Token                      | Curve              | What happens                                               |
| ------------- | ------------- | -------------------------- | ------------------ | ---------------------------------------------------------- |
| **REST**      | —             | —                          | —                  | The rendered state. This is what ships without JavaScript. |
| **INTENT**    | micro         | `--duration-fast` (200ms)  | `--ease-out-quart` | The element declares itself alive.                         |
| **COMMIT**    | micro         | `--duration-micro` (150ms) | `--ease-out-quart` | **Anticipation** — a compression before the release.       |
| **TRANSPORT** | standard      | `--duration` (400ms)       | `--ease-out-expo`  | The pressed element becomes the stage.                     |
| **SETTLE**    | choreographed | `--duration-slow` (800ms)  | `--ease-out-expo`  | The destination assembles around what arrived.             |

Five separate effects would be five things to keep consistent. One sentence
with five nouns is one thing — the same restraint this project already applies
to colour and type.

The tokens live in `vault/motion/tokens.ts` as `interaction`, with the CSS
custom property and the GSAP value side by side. `vault/motion/tokens.test.ts`
asserts they agree, that every duration sits inside a band, and that the
sequence escalates (COMMIT shortest; SETTLE longest).

### 9.2 COMMIT is the state that matters

Anticipation is most of what separates game animation from a web transition.
Without a beat of compression before the release, a movement reads as
**announced** rather than **done**.

It is one beat, not a move: 150ms, the floor of the micro band. The plan for
Tahap 12 called for ~120ms; that would have been the first duration in this
project outside a declared band, which is exactly the ad-hoc drift the bands
exist to prevent. Against `out-quart` most of the movement lands in the first
60ms, so 150ms reads as immediate anyway.

**Write COMMIT in CSS, with `:active`.** It fires for Enter and Space on a
link or a button as well as for a pointer, which makes rule 3 below free
rather than something to remember. A `pointerdown` handler would be a second
state machine to keep in step with the first — the same shape of mistake as a
second RAF loop (§6).

### 9.3 Overshoot, rejected on the record

`ui-ux-pro-max` recommends `back.out(1.4)` and `elastic.out(1, 0.4)` for
interactions at this tier. Both are rejected, for two reasons that each stand
alone: they are raw curves, which rule #1 forbids in a component, and a bounce
is the wrong register for this site — rejected for the same reason in Tahap
11c. Settling happens through `--ease-out-expo`.

### 9.4 Five rules, binding

1. **Interruptible, with a defined resolution.** A double click, or Back
   pressed mid-TRANSPORT, must never leave a stuck screen. This is a failure
   mode this project has already had; `vault/motion/page-transition` carries a
   `maxWait` because of it.
2. **Reachable by keyboard.** `:focus-visible` is INTENT, Enter and Space are
   COMMIT. A moment reachable only by cursor is not grammar, it is decoration.
3. **Reduced motion changes the duration, not the outcome.** States still
   change; the transitions become instant. Content always ends up correct.
4. **REST is the rendered state.** With JavaScript off, REST is what shows.
   The whole grammar is additive — which is what keeps the no-JS gate green.
5. **One shared-element morph per navigation.** More than one pair is not
   legible and is very hard to time.

### 9.5 The epic-moment budget

Award sites do not make everything epic. They make **one or two** things epic
and keep everything else quiet.

**At most two choreographed-band movements per page, and both are named.**

On the home page:

1. **The hero's arrival** — once per load.
2. **A card becoming a project page** — TRANSPORT plus SETTLE in full.

Everything else is micro or standard. A filter chip does not get 1200ms.

---

## 10. Review checklist

Before any motion work is considered done:

- [ ] Every duration comes from a band in §2 — no ad-hoc values
- [ ] Every curve is an `--ease-*` token — no raw `cubic-bezier()`
- [ ] Only `transform` / `opacity` animated
- [ ] Reduced motion tested, and content is fully visible under it
- [ ] ScrollTriggers and GSAP contexts cleaned up on unmount
- [ ] Stagger total ≤ 600 ms (UI) / 900 ms (hero)
- [ ] No second RAF loop introduced
- [ ] Keyboard focus order unaffected by the animation
- [ ] Every pressable element answers a press — §9 COMMIT, not just `:hover`
- [ ] Every moment is reachable with Tab and Enter, not only with a cursor
- [ ] No more than two choreographed-band movements on the page, and both named
- [ ] Interrupting mid-TRANSPORT (double click, Back) leaves nothing stuck
