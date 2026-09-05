# DESIGN SYSTEM

Token contract for this project. Numbers are grounded in measured production
CSS from ten award-winning sites (`TEARDOWN.md`), and mapped onto the token
system Satūs already ships rather than replacing it.

**Where the tokens actually live** — this document is the rationale; these
files are the source of truth:

| Concern                     | File                                                     |
| --------------------------- | -------------------------------------------------------- |
| Colour                      | `lib/styles/colors.ts`                                   |
| Typography                  | `lib/styles/typography.ts`                               |
| Layout / grid / breakpoints | `lib/styles/layout.mjs`                                  |
| Easing                      | `lib/styles/css/easings.css`                             |
| Generated CSS variables     | `lib/styles/css/root.css` (generated — do not hand-edit) |
| Barrel                      | `lib/styles/index.ts`                                    |

Editing a token means editing these files, then letting
`bun run setup:styles` regenerate. Hardcoding a value in a component is a
defect, not a shortcut.

---

## 0. The dials, and the design read

Added in Tahap 34, from `.claude/skills/taste-skill/` (MIT, provenance in
`docs/PROVENANCE.md` §3). Everything below §1 is a token contract; this
section is the _intent_ those tokens serve, and it exists because "make it
more exploratory" is a feeling until it has a number.

### The design read

> Reading this as: a commissioned-work studio site for clients and curators,
> in a monochrome gallery language, leaning on its own system (`vault/` +
> Base UI) rather than a third-party design system.

### The three dials

`taste-skill` SKILL.md §1 and §7 gate every layout, motion and density
decision on three values. Its baseline is `8 / 6 / 4`. Arth runs **`7 / 9 / 3`**.

| Dial               | Was |    Is | Why                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --: | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESIGN_VARIANCE`  |   3 | **7** | §7 calls 1–3 "predictable: symmetrical CSS Grid, 12-col, equal fr-units", which described `project-grid.module.css` exactly. 7 buys asymmetric offsets and varied ratios. Not 8: §7 puts masonry and `padding-left: 20vw` there, and a grid that stays legible as a grid is how six works get compared to each other. |
| `MOTION_INTENSITY` |   4 | **9** | §7 defines 8–10 as scroll-triggered reveals, parallax and scroll-driven animation via ScrollTrigger — the architecture this repo already had and barely spent. The preset for a studio portfolio is 7; 9 is deliberate, and the owner asked for it.                                                                   |
| `VISUAL_DENSITY`   |   2 | **3** | The one dial that barely moves, on purpose. §7 puts 8–10 at "cockpit: tight paddings, no card boxes, mandatory `font-mono` for all numbers", which would bury the subject. A work site is an art gallery, and 3 keeps it one.                                                                                         |

The numbers are **intent, not measurement**. No gate can prove a page "is at
VARIANCE 7". What is gated is the mechanical half of the skill —
`e2e/taste-preflight.e2e.ts` and `lib/styles/scripts/taste-rules.test.ts` —
and every stage from 34 on names the dial it is spending in its §Hasil.

**Where `DESIGN_VARIANCE` was actually spent — Tahap 43.** The dial was set
to 7 in Tahap 34 and the catalogue went on running at 3 for nine stages. That
is measurable even though the dial is not: at 1440x900 the six works sat at
**two** distinct `x` values and **three** distinct `y` values, with a row
pitch of 935px three times running and three of three rows sharing an
identical top. Every card was 691 x 919 to the pixel.

`work-constellation` gives the catalogue three editorial offsets cycled by
index, so no row runs level, and gives the two columns different parallax
distances (4 and 9) so their relationship changes as the page is read. After:
**six** distinct tops rather than three, and a per-column drift difference
where there was none — measured at `1.863183333333333` against
`1.863183333333333` before, identical to thirteen decimal places.

The ceiling in the same row of the table still holds: the offsets are three
fixed values from the grid step, not masonry, and
`e2e/exploratory-layer.e2e.ts` asserts no two cards ever overlap at any of
twelve scroll positions. A grid that stays legible as a grid is still how six
works get compared to each other.

### What was adopted, and what was refused

`docs/stages/TAHAP-34.md` §5 lists the thirteen rules adopted and the defect
each one closed; §6 lists the five refused. The refusal that matters most
here: §7's own example of fluid motion is
`transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`, which breaks three of
this project's hard rules at once — `all`, a 300ms default, and a raw bezier.
Where the skill and `CLAUDE.md` disagree, `CLAUDE.md` wins.

---

## 1. Colour

### The rule this project follows

**Two warm neutrals, and no chromatic accent at all.**

That is a deliberate departure from what `TEARDOWN.md` measured, and the
reasoning is written out in full in `docs/stages/TAHAP-1.md` §0. The short
version: every site in the measured set is a creative or technology studio
whose content — code, type, 3D — carries no colour of its own, so the accent
_is_ the identity. This site shows commissioned artwork. The work is the
colour, and an accent beside it competes with every image on the page.

Two independent sources in this repo say the same thing:

- the **Museum/Gallery** palette in `.claude/skills/ui-ux-pro-max` sets
  `Accent` to the _same value_ as `Primary` — a gallery has no chromatic
  accent;
- its **Portfolio Grid** pattern states the strategy outright: _"Neutral
  background (let work shine). Accent: Minimal."_

The measured finding that survives unchanged is the one about grounds:
**pure `#000` on `#fff` is rarer than you would expect at this level.** Lando
Norris ships `#111112`/`#f4f4ed`, Minh Pham `#0d0d0d`, By-Kin
`#242527`/`#f4f2ed`. That small offset is disproportionately responsible for
looking deliberate rather than default, and the values below keep it.

### The chosen values

Locked in Tahap 1 (`docs/stages/TAHAP-1.md`):

| Token   | Value                   | ≈ hex     | Role                |
| ------- | ----------------------- | --------- | ------------------- |
| `ink`   | `oklch(0.17 0.006 66)`  | `#110f0d` | dark ground / text  |
| `paper` | `oklch(0.964 0.006 92)` | `#f4f3ef` | light ground / text |

Both carry a small warm bias — hue ~66° and ~92° at very low chroma. A pure
grey reads as unconsidered; this reads as paper and pigment. The shift is
subtle enough that no image placed on it picks up a cast.

### The two-theme structure

Satūs shipped `light`, `dark`, and `red`. **`red` is gone** — it described a
theme no page applied, and with no chromatic accent it described nothing.

| Theme   | `primary` | `secondary` | `contrast` |
| ------- | --------- | ----------- | ---------- |
| `light` | paper     | ink         | ink        |
| `dark`  | ink       | paper       | paper      |

Components must reference the semantic role (`var(--color-primary)`), never a
literal. **There is no longer any literal to reference:** `--color-black`,
`--color-white`, `--color-red`, `--color-blue` and `--color-green` no longer
exist, so `bg-black` and friends are dead classes that silently do nothing.
Tahap 1 §3 lists every component that had to be corrected because of it.

### `contrast` is a role, not a third colour

Components use `--color-contrast` for interactive state: focus rings, checked
boxes, switch fills, form errors. Filling that role with the ink itself gives
a focus ring **17.24:1** against its ground — WCAG 2.2 asks 3:1 for non-text
indicators. The token stays so a future brand colour can be introduced in one
place without touching every component.

### Authored in oklch, and that matters

`lib/styles/colors.ts` uses `oklch()`. darkroom's production site uses `lab()`
with `color-mix(in oklab, …)`. Perceptual colour space is not theoretical:
tints and shades derived in sRGB lose chroma and go muddy, while oklch keeps
them consistent. Derive every variation with `color-mix(in oklab, …)`, never
by hand-picking a hex. Six tokens in `global.css` are derived this way — `--surface`,
`--surface-2`, `--line`, `--line-strong`, `--text-muted` and `--hero-wash-to`
— every one of them a `color-mix(in oklab, …)`. `contrast.test.ts` parses
those recipes out of the stylesheet and pins the list, so a seventh cannot
arrive without a contrast decision attached to it.

### Contrast is enforced, not assumed

`lib/styles/scripts/contrast.test.ts` measures every role pair in every theme
and ratchets in both directions — a new failure fails, and an _improved_ pair
that is still recorded in the baseline also fails, so the baseline cannot go
stale.

Current state: **11 role pairs measured in both themes, 22 measurements, all
clear WCAG AA.** The lowest is `muted text on primary` in the dark theme at
**9.08:1** against a 4.5 minimum; the lowest APCA is **|Lc| 60.6**, on the
same pair, against a 60 threshold. Both numbers come from the table
`lib/styles/css/global.css` keeps beside `--text-muted`, which is where the
75% mix was chosen. `contrast-baseline.json` is empty:

```json
{ "accepted": {}, "apcaAccepted": {} }
```

**Run the test after any palette change.** If a new colour fails, fix the
colour or record a deliberate baseline with `bun run contrast:accept` — never
silence the test.

### If a brand colour is added later

It goes in `themes.*.contrast`, in one place. Before it ships, it must clear
4.5:1 as text on **both** grounds or be restricted to non-text use — the
previous accent failed that test at every lightness of its hue (peak 4.19:1
on these grounds, 4.41:1 even on pure white), which is why it is gone.

---

## 2. Typography

### Restraint is the whole technique

Measured: **Lusion ships an entire award-winning site on weights 400 and 500.**
Iventions runs on 500 and 300. Variety comes from size, spacing, and case —
not from weight count.

**Rules**

- **Two families.** A display face and a mono. A third only with a reason.
  Locked to **Syne + Geist Mono**.
- **Two to three weights.** More than three is a smell. The scale below uses
  400 / 600 / 700.
- **The mono is not decoration.** On Lusion, basement.studio, By-Kin and
  darkroom the mono carries labels, captions, and metadata. It is what makes
  a site read as engineered.

### Why Syne

`Syne` was drawn for **Synesthésie**, a French art centre, and is widely used
in contemporary-art contexts. That provenance is the point: this site sits
around artwork, and a face from the art world reads as belonging there in a
way a general-purpose UI sans does not.

It replaced **Geist**, which Tahap 1 v1 chose because basement.studio ships
it. Geist is a fine face, but it is a neutral technology sans — and
neutrality is what this site cannot afford once the palette gives up its
accent. With no colour carrying identity, the typography has to.

Both families ship a variable `wght` axis (Syne 400–800, Geist Mono 100–900),
so `fonts.ts` declares no explicit `weight`: one file per family covers every
weight the styles use.

### The scale

From `lib/styles/typography.ts` (mobile → desktop):

| Style     | Family  | Size     | Weight | Line-height | Tracking |
| --------- | ------- | -------- | ------ | ----------- | -------- |
| `h1`      | display | 38 → 120 | 700    | 85%         | −0.04em  |
| `h2`      | display | 32 → 48  | 600    | 90%         | −0.025em |
| `p-big`   | display | 16 → 20  | 400    | 125%        | −0.02em  |
| `p`       | display | 12 → 14  | 400    | 125% → 120% | −0.01em  |
| `caption` | mono    | 11 → 12  | 400    | 125% → 120% | −0.01em  |
| `cta`     | mono    | 12 → 14  | 400    | 100%        | −0.01em  |
| `link`    | mono    | 12 → 14  | 400    | 125% → 120% | −0.01em  |

The split is the design: **display carries what is read** (headings, prose),
**mono carries what is scanned** (captions, labels, calls to action).

Three details are deliberate and should not be "fixed":

- **Display line-height below 100%.** Sub-100% leading on large type is the
  signature of considered typography. Default 1.5 on a 120px heading looks
  like a document, not a design. 85% rather than 80% because Syne has taller
  forms than the neutral sans it replaced — at 80% the lines collide.
- **Negative tracking that scales with size.** −0.04em at h1, −0.01em at
  body. Large type needs tightening; small type needs air. A single global
  letter-spacing is wrong at both ends.
- **`caption` is 11px on mobile, not 8px.** The previous scale shipped 8px
  and carried a written flag saying it was below any readable floor. A flag
  is not a fix. 11px still reads as metadata, and is legible.

### Fluid sizing

Use `clamp()` with a **small viewport coefficient**. Lusion's real
declarations: `clamp(.875rem, 1vw, 2rem)`, `clamp(1rem, 1.5vw, 3rem)`, and
for display `clamp(7em, 8vw, 20em)`.

Body-scale text: **1–1.5vw**. Aggressive `vw` scaling makes text lurch on
resize and is a reliable amateur tell. Display type may scale harder.

---

## 3. Layout

### Grid

Satūs (`lib/styles/layout.mjs`), which matches what the award sites ship:

```
columns:  mobile 4  /  desktop 12
gap:      16px
safe:     16px  (page edge inset)
```

Lusion's column-width formula, verbatim from its production CSS:

```css
--grid-space: calc((100% - 11 * var(--grid-gap)) / 12);
```

**Always `minmax(0, 1fr)`, never bare `1fr`.** Measured on Lusion,
basement.studio and By-Kin. Bare `1fr` refuses to shrink below content width
and causes overflow with long words or wide media — the bug that produces
horizontal scroll on mobile.

### Breakpoints

Satūs uses a single `dt: 800`. That is deliberate and has good company:
Lusion concentrates on one breakpoint (812px, 130×). Custom-built award sites
cluster on 768/1200; Webflow sites carry 479/767/991 because Webflow ships
those, not because anyone chose them.

**Mobile-first. Add a breakpoint only when a layout genuinely breaks** — not
per device category.

### Spacing

**Spacing is a multiple of 4**, and 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 is
the preferred subset.

Both halves of that sentence are load-bearing, and the second half used to be
the whole rule. Tahap 37 read the histogram before enforcing it:

```
 8 x51   16 x51   12 x39    4 x32   24 x31   20 x30   32 x18
 6 x16   48 x15   10 x15    2 x13   96 x9    28 x8   160 x8   ...
```

12 ships 39 times and 20 ships 30 times — an author following this system for
36 stages, repeatedly needing the step between 8 and 16 and between 16 and 24,
which the named ladder cannot express. Forcing 69 of those to move would have
shifted real pixels on real pages to satisfy a ladder written before the site
existed. The multiple-of-4 rule still rejects the twenty-nine-arbitrary-values
problem outright, and `lib/styles/scripts/scale-rules.test.ts` enforces it.

**Below one step is not spacing.** 1, 2 and 3px are hairline alignment and
optical inset — a switch's inner padding, a tab's baseline nudge. Rounding a
2px inset to 4px doubles it. The grid governs steps.

**Radius, elevation.** Both were born in Tahap 37 because neither existed:
nineteen distinct `border-radius` declarations and six hand-written
`box-shadow`s, all six of the latter inside Base UI wrappers and none in a
`vault/` block — the shape of a system that never decided it had elevation.
`--radius-hairline|sm|md|lg|full` and `--shadow-sm|md|lg`. Radii are fixed
pixels, not scaled: a corner is an edge treatment, not a measure of space.

**Whitespace is the cheapest expensive-looking asset there is.** The most
common failure in "almost premium" work is sections that are too tight.
Generous vertical rhythm between sections costs nothing and does more for
perceived quality than any component.

---

## 4. Motion

Owned entirely by `MOTION-SPEC.md`. Summary: durations 200 / 400 / 1000 ms
by band, easing from `--ease-*` tokens only, `transform` and `opacity` only,
`prefers-reduced-motion` mandatory.

---

## 5. Imagery and WebGL

- `next/image` for all raster imagery; never a bare `<img>` for content.
- **Always reserve space.** CLS from an unsized image undoes every other
  quality signal on the page.
- WebGL stays behind the existing feature flag (`lib/webgl` + `lib/features`).
  3D is an accent. A hero that cannot render without a GPU is a liability.
- Bruno Simon's fully-3D site loads **2 scripts**; Iventions loads 36. WebGL
  is not what makes a site heavy — script sprawl is. Guard the script count
  before blaming the canvas.

---

## 6. Component rules

1. **No hardcoded values.** Colour, spacing, duration, easing, and type all
   come from tokens. A raw `#fff`, `16px`, or `400ms` in a component is a
   defect.
2. **Semantic tokens, not literals.** `var(--color-primary)`, not
   `var(--color-ink)`. The literals are palette entries that the themes map
   onto roles; referencing one directly breaks theme switching.
3. **Tailwind v4 utilities first**, CSS Modules when a component needs real
   structure. Both read the same tokens, so they cannot drift.
4. **Every primitive gets a Storybook story**, including its reduced-motion
   state.
5. **Accessibility is not a later pass.** Focus states visible, targets
   ≥44×44px, contrast checked. `@axe-core/playwright` is already installed —
   there is no excuse for guessing.

---

## 7. Where this document and the code still disagree

Kept here rather than quietly fixed in prose, because a design document that
describes a system nobody built is worse than no document. Each line names the
stage that closes it; until then, the code is the truth and this is the debt.

| This document says                            | The code does                                                                                                                                                                                                                                                                              | Closes in |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| §2 the seven-class scale                      | `h3` now fills the 20→48 gap and the 404's parallel scale is gone. **Seven stylesheets still hand-write their type** under a `scale-exempt-file:` marker naming the reason: every one has zero consumers and is deleted in Tahap 45c. Six per-line exemptions remain, each with its reason | Tahap 45c |
| §6.4 "every primitive gets a Storybook story" | **25 component directories have none**, including five vault blocks, `parallax`, both `vault/webgl/*` and the lightbox                                                                                                                                                                     | Tahap 46  |

The measurements behind every row are in the curator audit that opened Tahap
34; none of them is an estimate.
