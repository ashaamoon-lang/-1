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
6. **A morph requires the destination to open at the top.** This is not a
   preference, it is the condition React imposes: a `<ViewTransition>` is only
   given a `view-transition-name` when the element it wraps is **inside the
   viewport** at commit time, and the name is stripped again when it is not
   (`applyViewTransitionToHostInstancesRecursive` returns whether any host
   instance is in view; its caller restores the name otherwise). So a link that
   carries the reader's scroll offset into the next page silently downgrades
   every morph on the site to a cross-fade — `::view-transition-old(name)` with
   no group and no `new` half.

   Measured in Tahap 15b: `components/ui/link` had shipped `scroll={false}`
   since the fork, so pressing a practice from the home page at scroll 3520
   opened its page at 1522 with the heading 1136px above the fold. Both the
   landing and the morph were fixed by the same one-line change.
   `e2e/navigation-landing.e2e.ts` holds the cause; `e2e/motion.e2e.ts` holds
   the effect, now from a link far down the page as well as one near the top.

7. **A navigation the reader starts with the browser's own controls is dressed
   too, and faster.** Back and forward press no link, fire no `onNavigate`, and
   until Tahap 16a ran **no transition at all** — measured, zero
   pseudo-elements, the overlay never leaving `idle`. The reader got
   choreography one way and a jump-cut the other.

   They get the cover, never a morph: the destination is restored to a scroll
   position of its own, so the paired element may sit anywhere including
   outside the viewport, where rule 6 says the name is dropped. Promising a
   morph that silently degrades to a cross-fade is the defect Tahap 15b just
   removed.

   And it is quicker — 150ms + 200ms against a link's 200ms + 400ms. That
   asymmetry is the one piece of guidance `ui-ux-pro-max` carries about
   travelling backwards: _"exit should always resolve faster than entrance
   (asymmetric timing) so back/forward feels snappy"_. Its database says
   nothing at all about whether a back navigation should move, and
   `docs/stages/TAHAP-16.md` §2.4 records that rather than dressing a default
   as research.

   The signal comes from the Navigation API, not `popstate`: by the time a
   `popstate` listener here runs, the router has already committed and React
   has already re-rendered, so intent cannot be recovered. `navigate` fires
   before the commit and marks a hash press with `hashChange`, which is what
   keeps an in-page anchor from being swept by a full-viewport panel.

### 9.5 The epic-moment budget

Award sites do not make everything epic. They make **one or two** things epic
and keep everything else quiet.

**At most two choreographed-band movements per page, and both are named.**

The list, kept current as routes are added. A page missing from it has no
choreographed movement, and that is a legitimate answer — the journal _entry_
page is deliberately on this list at zero (`docs/stages/TAHAP-27.md` §5).

| Page                | Moments                                                                                                                                           | Added             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `/`                 | 1. **hero arrival** — once per load<br>2. **card → project page** — TRANSPORT plus SETTLE in full                                                 | Tahap 12e         |
| `/practice/<value>` | 1. **practice morph** — the home page's practice name becoming the hero<br>2. **the scrubbed passage** — `ProgressText`                           | Tahap 15          |
| `/studio`           | 1. **`studio-statement`** — the scrubbed passage<br>2. **`studio-process`** — the held index                                                      | Tahap 24, 25      |
| `/journal`          | 1. **`journal-index`** — the row being read leads                                                                                                 | Tahap 27          |
| `/journal/<slug>`   | _none, deliberately_ — it is a long read                                                                                                          | Tahap 26          |
| `/work`             | 1. **card → project page** — the same transition, `ProjectGrid` renders here too<br>2. **`catalogue-sift`** — the list rearranging under a filter | Tahap 11d, 39     |
| `/work/<slug>`      | 1. **`project-arrival`** — the receiving half of that transition, via `transitionName`. Marked in the DOM since Tahap 40; the name is older       | Tahap 11d, 19, 40 |

Everything else is micro or standard. A filter chip does not get 1200ms —
and `catalogue-sift` is not the chip. The chip's own acknowledgment is the
200ms INTENT treatment every pressable noun gets under §9; the moment is what
the **grid** does afterwards, which is a movement with a start, a resolution
and an end, and therefore exactly what this budget counts.

`/work` is now at two, which is the ceiling. Nothing else may be added to it.

**A page's heading arriving is not one of the two, and Tahap 40 is where that
was settled.** `vault/motion/text-reveal` ran at `duration.slow` — 800ms, the
choreographed band — on every `<h1>` on the site. The budget never saw it
because the sampler only ever ran on `/en`; widening it to all seven pages
turned **five** of them red on the same element, each page's own title.

The fix was not five new names. Award sites make one or two things epic and
keep everything else quiet, and a movement that happens identically on seven
pages is a default, not a moment. `TextReveal` takes a `pace` prop now:
`arrival` (400ms, the standard band) is the default every masthead gets, and
`epic` (800ms) is spent only where the heading arriving **is** the named
moment — the home hero and the project hero, both of which this table already
listed and both of which sit inside a `data-epic`.

**The spine is not counted either.** `vault/blocks/project-spine` responds to
reading position continuously: it has no band, no beginning and no end, which
is the same test that excludes the material layer below. `/work/<slug>` still
has one moment and one slot spare.

**The material layer is not counted here, and this is where that is decided.**
`vault/webgl/material-image` renders on the home page beside the two moments
above, which would read as a third. It is not a choreographed-band movement:
it has no band, no beginning and no end — it is a continuous response to
pointer and scroll that is _always_ running while the plate is on screen, and
§11 governs it. A reader meets it rather than watches it happen. The budget in
this section counts movements that start, resolve, and are over.

---

## 11. The material layer

`vault/webgl/material-image`, added in Tahap 14a. This section exists because
the layer breaks two assumptions the rest of this document makes, and both
break silently.

### 11.1 When an image may become a mesh

Only when all four hold:

1. The route is allowed to pay for three.js. `e2e/route-budget.e2e.ts` names
   exactly one, and it is not a number to raise.
2. There is a **non-WebGL path that is the same design**, not a placeholder.
   For the work plates that path is the plain `<img>` — the thing that
   shipped in Tahap 12a — which is why this was a safe place to start.
3. The engine is fetched **inside an effect**, never at module scope. A
   static import puts three.js in the page graph and Next emits it as a
   parser-initiated script, downloaded by phones and by reduced-motion
   visitors who then see the fallback. Measured at 245.6 KB gzip.
4. The mesh is an accent on content that already reads. `CLAUDE.md` #13.

### 11.2 Never hide the DOM element on the assumption that a mesh replaced it

This is the rule the stage was written to earn.

Standing in a mesh for an `<img>` means hiding the `<img>`. Every DOM-shaped
check then passes whether or not a single pixel is drawn: the wrapper is
there, the attribute is there, the image is correctly at `opacity: 0`. Tahap
14a shipped that arrangement twice with four blank rectangles on the home
page, a green build, a green typecheck, a green lint, and every existing gate
passing — once because a full-viewport background quad was writing depth over
the plates, once because the mesh was placed from Lenis' _eased_ scroll
instead of the document's real one and sat 660px off screen.

So the contract is inverted: **the scene reports the first frame it could
have been drawn in — texture bound, rect measured, matrix written — and only
then may the DOM element be hidden.** A material that fails to draw is then a
no-op, not a missing work.

Two corollaries, both learned the same way:

- A background mesh scaled to the viewport declares itself one:
  `renderOrder={-1}` and `depthWrite={false}`. Otherwise it occludes every
  DOM-anchored mesh, which all sit at `z = 0` with it.
- A DOM-anchored mesh computes its placement **every frame** from
  `window.scrollY`, not from a scroll event and not from a smooth-scroll
  library's animated value. `lib/webgl/hooks/use-webgl-rect.ts` recomputes
  only on an event, which is enough for a page scrolled by a wheel and not in
  general.

### 11.3 The material stands down at COMMIT

A `<ViewTransition>` photographs real DOM. While a mesh is drawing, the
`<img>` behind it is at `opacity: 0`, so a morph that started in that state
would carry an empty box to the destination.

The fix is the grammar in §9, not a special case. The material lives in
**REST** and **INTENT**; at **COMMIT** it hands the surface back, before the
navigation, so **TRANSPORT** morphs real pixels. Both COMMIT paths raise it —
`pointerdown` and `keydown` for Enter or Space — because a keyboard user
reaches TRANSPORT without ever producing a pointer event.

### 11.4 A reveal marker never goes on a pressable noun

Added in Tahap 14b, and it is a cascade rule rather than a WebGL one.

`[data-reveal] [data-reveal-item]` in `global.css` sets a `transition`
shorthand, and a shorthand **replaces** an element's own rather than joining
it. Marked directly on the contact address, the reveal's 400ms silently
overwrote that link's 150ms COMMIT; `e2e/interaction-grammar.e2e.ts` measured
it as `email/commit: 400ms`, outside the micro band. Mark the container, never
the control.

The same section adds the other half: **a noun marked `data-press` must be
reachable at rest.** A control that only exists once a disclosure is opened is
not hoverable, not focusable, and has no computed transition — so it cannot
answer the grammar, and marking it there makes the gate report a silent noun
whose CSS is perfect. In `vault/blocks/practice-list` the `<summary>` is the
marked noun, because opening a practice is the interaction the block adds; the
link inside the panel is ordinary navigation.

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
- [ ] No DOM element is hidden because a mesh is _assumed_ to have replaced it — §11.2
- [ ] A mesh standing in for content hands it back at COMMIT — §11.3
- [ ] No `data-reveal-item` sits on an element that carries `data-press` — §11.4
- [ ] Every `data-press` noun is reachable without opening a disclosure — §11.4
