# `vault/magic/` — the one door for vendored UI

Everything in this directory derives from **Magic UI**. Nothing from that
source reaches a page except through a file here.

|          |                                                                      |
| -------- | -------------------------------------------------------------------- |
| Source   | https://github.com/magicuidesign/magicui                             |
| Registry | https://magicui.design/r/registry.json — 250 items, 78 UI components |
| Licence  | **MIT**, Copyright (c) Magic UI                                      |
| Verified | by reading that repository's own `LICENSE.md` — HTTP 200             |
| Recorded | `docs/PROVENANCE.md` §Magic UI                                       |

`LICENSE` without an extension returns **404** on that repository. Someone
checking the conventional path would conclude it carries no licence, and that
conclusion is wrong. `LICENSE.md` is the file.

---

## The five transformations, all mandatory

A file is not in this directory until it has been through all five. The gate
is `lib/styles/scripts/vendor-rules.test.ts`.

| #   | Transformation                                                                | Rule            |
| --- | ----------------------------------------------------------------------------- | --------------- |
| 1   | Provenance header: source, licence, how verified, and **Code copied: yes/no** | `CLAUDE.md` #17 |
| 2   | Tailwind classes → CSS Module + tokens                                        | #8, #9, #10     |
| 3   | Its own `requestAnimationFrame` → `useTempus`, with the `order` argued        | #6              |
| 4   | Animate only `transform` and `opacity`                                        | #4              |
| 5   | A `@media (--reduced-motion)` block, and content ends **fully visible**       | #5              |

### Transformation 2 is not a style preference

`lib/styles/css/tailwind.css` resets four namespaces to `initial`:

```css
--breakpoint-*: initial;
--color-*: initial;
--spacing-*: initial;
--font-*: initial;
```

**Tailwind's default colour, spacing, type and breakpoint scales do not exist
in this repository.** `bg-white`, `text-neutral-400`, `p-4`, `gap-2`, `md:` —
none of them resolve. A Magic UI component pasted as-is renders **unstyled**.

So the saving this source offers is not a drop-in component. It is the
**technique**: a tuned `feTurbulence` filter chain, `<pattern>` geometry, mask
arithmetic, a pixel-reveal algorithm. That is a real saving — not having to
rediscover the geometry is most of the work — but it is not `add` and done,
and estimating it as though it were produces a schedule that is wrong.

---

## Installed

| Directory        | From                                                         | Code copied | Notes                                                                         |
| ---------------- | ------------------------------------------------------------ | :---------: | ----------------------------------------------------------------------------- |
| `grid-pattern/`  | Magic UI `grid-pattern`                                      |   **yes**   | `<pattern>` structure and the `d` path                                        |
| `noise-texture/` | Magic UI `noise-texture`                                     |   **yes**   | The `feTurbulence`/`feColorMatrix`/`feComponentTransfer` chain and its tuning |
| `dot-pattern/`   | technique from `grid-pattern`, parameters from `dot-pattern` |   **no**    | Rewritten — see below                                                         |

### Why `dot-pattern` is original work

Upstream's `dot-pattern` renders **one `<circle>` element per dot**, computed
in JavaScript from `getBoundingClientRect()`, behind a `resize` listener, each
wrapped in `motion.circle`. At 1440×900 with 16px spacing that is **5,130 SVG
nodes**.

`grid-pattern` — another component in the same repository — does the
equivalent job with **one** `<pattern>` and **one** `<path>`, and lets the
browser tile it.

So the dots take the technique from `grid-pattern` and the parameters from
`dot-pattern`. The header says exactly that. "Adapted from" would have been a
provenance record you cannot act on; what MIT requires depends on whether
bytes were copied, so that is the sentence the gate demands.

### A correction to how these were counted

The registry's `dependencies` field is **not** the same as what the source
imports. `dot-pattern` is listed with no dependencies and its source reads
`import { motion } from "motion/react"`.

Measured from source across the 27 components downloaded: **26 do not import
`motion`, 1 does, and the metadata disagreed on that one.** Any claim about
the other 51 components is unverified until their source is read. The
headline figure of "40 with no dependencies" is an upper bound from metadata,
not a fact.

---

## Rejected, and why

Rejection is the useful half of this file. It is what stops a later stage
installing `meteors` because it looks good.

| Component                                                                                                                                      | Why not                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marquee`                                                                                                                                      | We ship two already (`components/ui/marquee`, `vault/motion/velocity-marquee`), and `taste-skill` forbids two marquees on one page. A third is more choice, not more capability.                                                                                                                                                                                                                                                                                    |
| `aurora-text`, `neon-gradient-card`, `rainbow-button`, `shimmer-button`, `shine-border`, `animated-gradient-text`                              | **Chromatic.** This site is monochrome with zero chromatic accent; `aurora-text` alone carries four hex values.                                                                                                                                                                                                                                                                                                                                                     |
| `retro-grid` (22.9KB), `particles`, `flickering-grid`, `floating-3d-particles`                                                                 | Their own RAF loop **and** the wrong vocabulary — retro, particles, 3D — for a commissioned-artwork gallery.                                                                                                                                                                                                                                                                                                                                                        |
| `meteors`, `orbiting-circles`, `ripple`, `cool-mode`, `confetti`                                                                               | SaaS landing-page vocabulary.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `terminal`, `safari`, `iphone`, `android`, `file-tree`, `code-comparison`, `tweet-card`, `globe`, `dotted-map`, `icon-cloud`, `avatar-circles` | Wrong product. This is not a software site.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Every component that imports `motion` (30 by metadata, at least 31 by source)                                                                  | `motion` runs a scheduler of its own — `CLAUDE.md` #6, one RAF loop. Nineteen of them duplicate something this repo already has: `vault/motion/text-reveal`, `reveal`, `counter`, `parallax`, `flip`, `page-transition`, `vault/primitives/cursor`, `components/ui/marquee` + `--scroll-velocity`. The few genuinely useful remainders — `scroll-progress`, `border-beam`, `light-rays`, `magic-card`'s spotlight — are written on the CSS and GSAP already loaded. |

### `progressive-blur` — deferred in Tahap 47, **rejected** in Tahap 53

It stacks **eight `backdrop-filter: blur()` layers**, each with its own
`mask-image`. Tahap 47 deferred it for two reasons: its cost cannot be measured
here (`CLAUDE.md` #19 forbids shipping "it's cheap" as a claim), and it had no
consumer until the site-wide ambient layer.

The consumer arrived in Tahap 53 — the header's edge, which was a
`border-bottom: 1px solid var(--line)` cutting across the artwork behind a
fixed bar. That is where the decision got made instead of deferred a third
time:

- The header **already** carries one `backdrop-filter: blur(12px)`. What the
  edge needed was not more blur, it was a _fade_.
- One `mask-image` on the layer that already exists gets that. Eight stacked
  layers over a scrolling page is eight composite passes a frame, for the same
  visual result, at a cost still nobody here can profile.

So the technique was taken and the code was not. `docs/PROVENANCE.md` records
the distinction, which is the same shape as `dot-pattern`'s: what MIT requires
depends on whether bytes were copied, so that is the sentence the record has to
answer.

**Rejected, not deferred again.** Deferring something a third time is how an
item moves between plans without ever being decided.

---

## House rules for anything added here

1. Read the source, not the registry metadata.
2. Put it through all five transformations before committing it.
3. If the transformation would rewrite most of the file, write your own and
   say so in the header — a rewritten file logged as "copied" is a provenance
   record nobody can rely on.
4. Ground layers are `aria-hidden` and `pointer-events: none`. They carry no
   information. Anything a reader needs must exist in the DOM as text —
   the rule `e2e/exploratory-layer.e2e.ts` already holds for the cursor.
