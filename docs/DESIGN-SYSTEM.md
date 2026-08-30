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

### The rule the measurement supports

**An off-black ground, an off-white foreground, and exactly one accent.**

Measured: basement.studio ships `#ff4d00` as the single most-declared colour
on the entire site. Lando Norris pairs `#111112` / `#f4f4ed` with one lime
`#d2ff00`. Minh Pham: `#0d0d0d` ground, `#eb5939` accent. darkroom's own site:
black/white with `#e71419`.

**Pure `#000` on `#fff` is rarer than you would expect at this level.** The
sites that feel most considered sit slightly off pure — `#111112`, `#0d0d0d`,
`#242527` for grounds; `#f4f4ed`, `#f4f2ed` for light. That small offset is
disproportionately responsible for looking deliberate rather than default.

### Authored in oklch, and that matters

`lib/styles/colors.ts` uses `oklch()`. darkroom's production site uses
`lab()` with `color-mix(in oklab, …)`. Perceptual colour space is not
theoretical: tints and shades derived in sRGB lose chroma and go muddy,
while oklch keeps them consistent. Derive every variation with
`color-mix(in oklab, …)`, never by hand-picking a hex.

### Contrast is enforced, not assumed

Satūs pins its red to `oklch(0.592 0.2339 27.95)` because that is inside the
narrow band where one colour clears WCAG AA (4.5:1) as text on **both** black
and white — peaking at only 4.583:1. There is almost no slack.

`lib/styles/scripts/contrast.test.ts` guards this. **Run it after any palette
change.** If a new colour fails, either fix the colour or record a deliberate
baseline with `bun run contrast:accept` — never silence the test.

### The three-theme structure

Satūs ships `light`, `dark`, and `red`, each with `primary` / `secondary` /
`contrast`. Components must reference the semantic role
(`var(--color-primary)`), never the literal (`var(--color-black)`), so theme
switching works without touching components.

### The chosen values

Locked in Tahap 1 (`docs/stages/TAHAP-1.md`), from measurement rather than
taste:

| Role           | Value                                     | Source                          |
| -------------- | ----------------------------------------- | ------------------------------- |
| Ground (dark)  | `oklch(0.145 0 0)` ≈ `#0a0a0a`            | off-black, per `TEARDOWN.md` §3 |
| Ground (light) | `oklch(0.9647 0.0071 106.42)` ≈ `#f4f4ee` | warm off-white                  |
| Accent         | `oklch(0.592 0.2339 27.95)` ≈ `#e71419`   | darkroom.engineering's own red  |

The accent was already in the palette before it was chosen: Satūs _is_
darkroom's starter, and their production red converts to within 0.004
lightness of the value that shipped with it.

### The accent is not body-text colour — a measured constraint

Moving the grounds off pure black and white narrows every contrast ratio with
them. Measured: the accent scores **4.58:1** against `#000`/`#fff`, but
**4.19:1** against these grounds. That clears WCAG AA for large text (3:1) and
misses it for body text (4.5:1).

**No lightness of this hue recovers it.** The best achievable against these
grounds is 4.19, and even against pure white only 4.41 — the band peaks at
4.583 and only pure black/white reaches it. This was computed, not guessed.

So the rule: **use `--color-contrast` for emphasis, borders, hover states and
display type. Never for paragraphs.** Every accent in the measured set is used
exactly that way.

`contrast-baseline.json` records the sub-AA pairs deliberately. Two notes on
reading it honestly:

- The `red/*` entries describe the `red` _theme_, which no page applies —
  only `dark` and `light` are used. `themes.red.primary` serves as the browser
  chrome and PWA manifest colour, which is not text.
- The `dark|light/contrast on *` entries are the accent-on-ground pairs the
  rule above governs.

---

## 2. Typography

### Restraint is the whole technique

Measured: **Lusion ships an entire award-winning site on weights 400 and 500.** Iventions runs on 500 and 300. Variety comes from size, spacing, and
case — not from weight count.

**Rules**

- **Two families.** A display/sans and a mono. A third only with a reason.
  Locked to **Geist + Geist Mono**: `TEARDOWN.md` §4 measured basement.studio
  shipping exactly that pairing, and of every typeface in the measured set it
  is the only open-source one. It replaced Oswald, the starter's placeholder —
  a condensed face, which is a poster register rather than a studio one.
- **Two to three weights.** More than three is a smell.
- **The mono is not decoration.** On Lusion, basement.studio, By-Kin and
  darkroom the mono carries labels, captions, and metadata. It is what makes
  a site read as engineered. Satūs's `typography.ts` already assigns mono to
  `p`, `caption`, `cta`, and `link`.

### The scale Satūs ships

From `lib/styles/typography.ts` (mobile → desktop):

| Style     | Size     | Weight | Line-height | Tracking |
| --------- | -------- | ------ | ----------- | -------- |
| `h1`      | 72 → 120 | 700    | 80%         | −0.05em  |
| `h2`      | 32 → 48  | 700    | 80%         | −0.03em  |
| `p-big`   | 16 → 20  | 400    | 125%        | −0.02em  |
| `p`       | 12 → 14  | 400    | 125% → 120% | −0.01em  |
| `caption` | 8 → 10   | 400    | 125% → 120% | −0.01em  |

Two details here are exactly right and worth stating so nobody "fixes" them:

- **Display line-height of 80%.** Sub-100% leading on large type is the
  signature of considered typography. Default 1.5 line-height on a 120px
  heading looks like a document, not a design.
- **Negative tracking that scales with size.** −0.05em at h1, −0.01em at
  body. Large type needs tightening; small type needs air. A single global
  letter-spacing is wrong at both ends.

> **Flag for review:** `caption` at 8px mobile is below the 12px minimum that
> the accessibility guidance in `.claude/skills/ui-ux-pro-max` sets for body
> text. It is defensible for a non-essential metadata label and indefensible
> for anything a user must read. Do not use `caption` for meaningful content
> at mobile size.

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
   `var(--color-black)`.
3. **Tailwind v4 utilities first**, CSS Modules when a component needs real
   structure. Both read the same tokens, so they cannot drift.
4. **Every primitive gets a Storybook story**, including its reduced-motion
   state.
5. **Accessibility is not a later pass.** Focus states visible, targets
   ≥44×44px, contrast checked. `@axe-core/playwright` is already installed —
   there is no excuse for guessing.
