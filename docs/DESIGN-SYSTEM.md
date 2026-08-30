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
by hand-picking a hex. The derived tokens in `global.css` (`--surface`,
`--surface-2`, `--line`, `--line-strong`) are all built that way.

### Contrast is enforced, not assumed

`lib/styles/scripts/contrast.test.ts` measures every role pair in every theme
and ratchets in both directions — a new failure fails, and an _improved_ pair
that is still recorded in the baseline also fails, so the baseline cannot go
stale.

Current state: **all 18 measured pairs clear WCAG AA.** The lowest is
`secondary on surface-2` at 14.22:1 against a 4.5 minimum; the lowest APCA is
|Lc| 86.1 against a 60 threshold. `contrast-baseline.json` is empty:

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
| `h1`      | display | 72 → 120 | 700    | 85%         | −0.04em  |
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

Derive spacing from the grid gap (16px) rather than inventing a parallel
scale: 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128.

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
