# TEARDOWN — What Award-Winning Sites Actually Ship

**Measured 2026-08-29.** Every number here was extracted from the live
production CSS of the sites listed, not from articles, opinion, or memory.

**Method.** `docs/teardown-harvest.py` fetches each site's HTML, resolves and
fetches its linked stylesheets, and counts declared values: `cubic-bezier()`
curves, transition/animation durations, `@font-face` families, font weights,
CSS custom properties, `clamp()` expressions, `grid-template-columns`, media
breakpoints, and hex colours. Raw output is committed at
`docs/teardown-data.json` — every claim below is checkable against it.

**What this method sees and does not see.** It reads what the CSS _declares_.
It does not observe runtime behaviour: GSAP timelines, scroll choreography,
and WebGL are driven from JavaScript and are invisible here. Statements about
those are marked as inference, not measurement.

> **A failed attempt, stated plainly.** The first approach was a real browser
> (Playwright + Chromium, both available here) to read _computed_ styles and
> runtime timings. Every navigation died with `ERR_CONNECTION_RESET`; this
> environment's egress proxy closes browser tunnels mid-exchange after ~6s
> (`ws_closed_mid_exchange`, confirmed at the proxy's own status endpoint).
> curl is unaffected, so the harvest is CSS-level. Computed-style and
> real-timing measurement needs an environment with direct egress.

Sites measured: Lusion, basement.studio, By-Kin, Uncommon Studio, Mat Voyce,
Minh Pham, Iventions, Lando Norris, darkroom.engineering, Bruno Simon
folio-2019.

---

## 1. The headline finding: award easings are already in our stack

The curves these studios ship are not exotic. They are a small, shared
vocabulary — and they map onto easing tokens **Satūs already defines** in
`lib/styles/css/easings.css`.

| Site                 | Most-used curve                   | Count   | Already a Satūs token?              |
| -------------------- | --------------------------------- | ------- | ----------------------------------- |
| Minh Pham            | `cubic-bezier(.165,.84,.44,1)`    | 60×     | **exact** — `--ease-out-quart`      |
| Iventions            | `cubic-bezier(0.165,0.84,0.44,1)` | 1×      | **exact** — `--ease-out-quart`      |
| Lando Norris         | `cubic-bezier(.19,1,.22,1)`       | 2×      | **exact** — `--ease-out-expo`       |
| Lusion               | `cubic-bezier(.4,0,.1,1)`         | 32×     | near `--ease-gleasing` `(.4,0,0,1)` |
| Lusion               | `cubic-bezier(.35,0,0,1)`         | 32×     | near `--ease-gleasing`              |
| Lusion               | `cubic-bezier(.4,0,0,1)`          | 2×      | **exact** — `--ease-gleasing`       |
| basement.studio      | `cubic-bezier(.4,0,.2,1)`         | 14×     | gleasing family                     |
| By-Kin               | `cubic-bezier(.76,0,.24,1)`       | 2×      | near `--ease-in-out-quart`          |
| darkroom.engineering | its six in-* curves               | 1× each | **exact** — the `--ease-in-*` set   |

**The pattern.** Almost every curve ends `…,1)` — the second control point's
y is 1. That is out-easing: fast departure, long decelerating settle. The
in-out curves (By-Kin's `.76,0,.24,1`) appear a handful of times, reserved
for moves that leave and return.

**What is absent is the real lesson.** Across ten sites, in tens of thousands
of lines of CSS, there is essentially no bare `ease-in-out` carrying real
motion, and no unmodified browser-default `ease`. The default curve is the
single clearest tell of an amateur site, and these sites simply do not use it.

**Consequence for us:** we do not invent an easing system. Satūs's easing
tokens already _are_ the award vocabulary. The discipline is picking from
them, never typing a raw `cubic-bezier()` or a bare keyword into a component.

---

## 2. Durations cluster into three bands

Counted across all measured sites:

| Band                          | Values seen                                                                                                   | Use                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Micro** 100–250 ms          | basement 150 ms (13×), Lusion 100/200 ms, Bruno Simon 150 ms (15×)                                            | hover, focus, colour, small state flips               |
| **Standard** 300–600 ms       | Lusion 400 ms (40×), 500 ms (25×), 300 ms (24×); Minh Pham 400 ms (39×), 600 ms (14×); Iventions 400 ms (21×) | element enter/exit, reveals, menu                     |
| **Choreographed** 800–1200 ms | By-Kin 1200 ms (32×), 1000 ms (10×); Mat Voyce 1200 ms (6×), 800 ms (5×); Iventions 800 ms (12×)              | page transitions, hero sequences, full-viewport moves |

**400 ms is the single most common duration on the web's best sites**
(Lusion 40×, Minh Pham 39×, Iventions 21×). Not 300 ms — the generic default
that ships in most tutorials and UI kits.

Note the shape of By-Kin's distribution: 1200 ms is its _dominant_ value
(32×), far above its 400 ms (9×). A site that reads as expensive is often
slower than instinct suggests. Confidence is expressed by taking time.

---

## 3. Colour: near-monochrome plus exactly one accent

Top hex colours per site, by declaration count:

| Site                 | Ground               | Accent               | Note                                           |
| -------------------- | -------------------- | -------------------- | ---------------------------------------------- |
| basement.studio      | `#000` / `#fff`      | **`#ff4d00`** (21×)  | accent is the most-declared colour on the site |
| Lando Norris         | `#111112`, `#f4f4ed` | **`#d2ff00`** lime   | plus `#282c20` dark green, `#b2c73a` lime-off  |
| Minh Pham            | `#0d0d0d` (25×)      | **`#eb5939`** (10×)  | `#b7ab98` warm neutral as third                |
| darkroom.engineering | `#000` / `#fff`      | **`#e71419`** (4×)   | `#e5e5e5` as contrast step                     |
| Lusion               | `#000` / `#fff`      | `#c1ff00`, `#1a2ffb` | accents are per-project, not global            |
| Iventions            | `#1e1e1e`            | `#9c93e8`            | pastel set for section grounds                 |
| By-Kin               | `#242527`, `#f4f2ed` | `#b84930`            |                                                |

Two rules fall out, and both are cheap to follow and expensive-looking:

1. **One accent, used sparingly but decisively.** Not a palette of five.
2. **The ground is rarely pure `#000`/`#fff`.** Lando Norris uses `#111112`
   and `#f4f4ed`; Minh Pham `#0d0d0d`; By-Kin `#242527` and `#f4f2ed`.
   The slight warmth or lift off pure black/white is a large part of why
   these sites feel considered rather than default.

**Where Satūs already agrees.** `lib/styles/colors.ts` is authored in
`oklch()`, and darkroom's own production site ships `lab()` with
`color-mix(in oklab, …)`. Perceptual colour space is not decoration — it is
what makes a tint ramp keep its chroma instead of going muddy. Satūs also
ships a contrast test (`lib/styles/scripts/contrast.test.ts`) that pins its
red to `oklch(0.592 …)` so it clears WCAG AA on both grounds. That is the
level of rigour worth keeping.

---

## 4. Typography: restraint, not variety

| Site                 | Families                        | Weights actually used   |
| -------------------- | ------------------------------- | ----------------------- |
| Lusion               | Aeonik, IBMPlexMono, LusionMono | **500, 400** only       |
| basement.studio      | Geist, Geist Mono               | 600, 100, 500, 700, 400 |
| By-Kin               | Apercu Pro, Apercu Mono Pro     | 500, 400, 600, 700      |
| Iventions            | Söhne, ABC Arizona Mix          | **500, 300** dominant   |
| Minh Pham            | Avant Garde, Nunito Sans        | 700, 400, 500           |
| Lando Norris         | Brier, Mona Sans Variable       | 700, 500, 400           |
| darkroom.engineering | therma, sauce, mono             | 700, 400, 200           |

Three consistent moves:

- **Two families, occasionally three** — a display/sans plus a mono. The
  mono is doing real work on nearly every site (Lusion, basement, By-Kin,
  darkroom): labels, captions, metadata. It signals engineering rigour.
  Satūs's own `typography.ts` already pairs a display family with a mono and
  uses mono for `p`, `caption`, `cta`, and `link`.
- **Two to three weights.** Lusion ships an entire award-winning site on
  weights 400 and 500. Weight variety reads as cheap; scale and spacing
  variety reads as expensive.
- **Every site self-hosts a licensed face.** Aeonik, Apercu, Söhne,
  Maisonneue, ABC Arizona, Brier. This is the one thing on this page that
  costs money and cannot be substituted by technique — see the open question
  at the end.

**Fluid type is done with `clamp()`, and conservatively.** Lusion's actual
declarations: `clamp(.875rem, 1vw, 2rem)` (5×), `clamp(.75rem, 1vw, 2rem)`
(4×), `clamp(1rem, 1.5vw, 3rem)` (3×), and for display type
`clamp(7em, 8vw, 20em)`. Note the viewport coefficient is small — `1vw` to
`1.5vw` for body-scale text. Aggressive `vw` scaling is a common amateur
tell; it makes text lurch during resize.

Lando Norris exposes its scale as named tokens outright:
`--text--h1: 4rem`, `--text--impact: 7.9375rem` (127px), `--text--btn-primary: 1rem`.

---

## 5. Layout: 12 columns, and a formula worth stealing

Measured `grid-template-columns`:

- **Lusion** — `repeat(12, minmax(0,1fr))` and `repeat(6, minmax(0,1fr))`
- **basement.studio** — `repeat(12,…)`, `repeat(8,…)`, `repeat(4,…)`
- **By-Kin** — `repeat(6,…)`, `repeat(4,…)`, `repeat(16,…)`
- **Iventions** — `repeat(8, 1fr)`, `repeat(6, 1fr)`
- **Lando Norris** — `1fr 1fr` (39×), and
  `minmax(0,.5fr) minmax(0,1fr) minmax(0,2fr) minmax(0,1fr)`

Note `minmax(0, 1fr)` rather than plain `1fr` — that is the fix for grid
children refusing to shrink below their content width, and it is on the
award sites and not in most tutorials.

Lusion's column formula, verbatim from its CSS:

```css
--grid-space: calc((100% - 11 * var(--grid-gap)) / 12);
```

**Satūs already matches this**: `lib/styles/layout.mjs` declares
`columns: { mobile: 4, desktop: 12 }`, `gap: 16`, `safe: 16`.

**Breakpoints split by tooling, not by taste.**

- Custom-built (By-Kin, Iventions, Mat Voyce): **768 and 1200** dominate —
  By-Kin 1200px×141, 768px×91; Iventions 1200px×122, 768px×48.
- Webflow sites (Uncommon, Lando Norris): 479 / 767 / 991 — Webflow's stock set.
- Tailwind sites (basement.studio): 640 / 768 / 1024 / 1280 / 1536 / 1920.
- Satūs: a single `dt: 800` breakpoint, mobile-first.

The takeaway is that **fewer breakpoints is viable at the top end**. Lusion
concentrates on 812px (130×). Satūs's single-breakpoint stance is defensible
company, not an omission.

---

## 6. `prefers-reduced-motion`: the gap we can win on

Occurrences of `prefers-reduced-motion` in each site's shipped CSS:

| Site                       | Hits  |
| -------------------------- | ----- |
| darkroom.engineering       | 2     |
| basement.studio            | 1     |
| Minh Pham                  | 1     |
| **Lusion**                 | **0** |
| **By-Kin**                 | **0** |
| **Uncommon Studio**        | **0** |
| **Mat Voyce**              | **0** |
| **Iventions**              | **0** |
| **Lando Norris**           | **0** |
| **Bruno Simon folio-2019** | **0** |

Seven of ten award-winning sites ship **zero** reduced-motion handling in CSS.
(Caveat, honestly: some may handle it in JavaScript, which this method cannot
see. But CSS is where the cheap, robust version lives, and it is absent.)

This is the clearest available opportunity. Motion-respectful is not a
consolation prize for being less impressive — it is a place where a
well-built site can be _straightforwardly better_ than the field. Satūs ships
Playwright + `@axe-core/playwright` already, so this is enforceable rather
than aspirational.

`MOTION-SPEC.md` makes reduced-motion support mandatory for every vault
component, and `CLAUDE.md` makes it a hard rule.

---

## 7. Stack fingerprints

| Site                   | Detected                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| darkroom.engineering   | lenis, gsap, three, r3f, webgl, next, sanity, mux, vercel, framer/motion |
| basement.studio        | gsap, next, webgl, motion, sanity, mux, vercel — 31 scripts              |
| Lando Norris           | lenis, motion — **21 `<canvas>` tags**                                   |
| Minh Pham              | lenis, motion — 5 scripts                                                |
| Lusion                 | astro, motion — 3 `<canvas>`                                             |
| Iventions              | next, motion — 36 scripts                                                |
| Mat Voyce              | next, motion                                                             |
| By-Kin                 | next                                                                     |
| Uncommon Studio        | Webflow, 7 scripts                                                       |
| Bruno Simon folio-2019 | three, webgl — 1 `<canvas>`, 2 scripts                                   |

**Lenis is on three of ten sites by name**, including two we did not pick for
that reason. It is the de-facto standard, and Satūs ships it because darkroom
wrote it.

**Script-count spread is the performance story.** Bruno Simon's fully 3D site
loads **2 scripts**; Iventions loads **36**. The heavy-3D site is the lean
one. Weight comes from marketing tags and framework sprawl, not from WebGL.

---

## 8. What this means for our build

1. **Do not design an easing system.** Use Satūs's tokens. `--ease-out-quart`
   and `--ease-out-expo` are literally what Minh Pham and Lando Norris ship.
2. **Duration bands: 150–250 / 300–600 / 800–1200 ms.** Default to 400 ms.
   Never a single global duration.
3. **Palette: off-black ground, off-white type, one accent.** Author in
   `oklch()`, keep the contrast test passing.
4. **Two families, two to three weights.** Sans/display plus mono. Mono earns
   its place on labels and metadata.
5. **12-column desktop / 4-column mobile with `minmax(0,1fr)`.** Already
   Satūs's configuration.
6. **`clamp()` with a small `vw` coefficient** (≈1–1.5vw for body scale).
7. **Ship `prefers-reduced-motion`** — the field mostly does not.
8. **Guard the script count.** Bruno Simon proves 3D is not the tax.

## Open question for the user

**Typefaces are the one gap technique cannot close.** Every site here
self-hosts a commercially licensed face — Aeonik, Apercu, Söhne, Maisonneue,
ABC Arizona. There is no free substitute that reads the same way. The
foundation is built to accept a licensed face by swapping
`lib/styles/fonts.ts`; picking and licensing one is a decision (and a cost)
that belongs to the studio, not to me.

Until then the system runs on high-quality open faces, which is honest and
looks deliberate — but it is the single highest-leverage upgrade available.
