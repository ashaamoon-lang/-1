# AI Agent Guide

## Read first

**Engineering standards live in [AGENTS.md](./AGENTS.md).** Code style,
React 19 / Next.js 16 / Tailwind v4 specifics, lint and type rules,
integrations, commands. That file is the single source of truth for _how to
write code here_ and this file does not restate it.

This file adds the rules specific to **this project**: a commissioned-artwork
studio site that must read as expensive from the first frame.

Supporting documents, in the order they usually matter:

| Document                                           | Covers                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| [`docs/MOTION-SPEC.md`](./docs/MOTION-SPEC.md)     | Every animation. Binding.                       |
| [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) | Colour, type, spacing, grid.                    |
| [`docs/TEARDOWN.md`](./docs/TEARDOWN.md)           | Measured evidence behind both.                  |
| [`docs/PROVENANCE.md`](./docs/PROVENANCE.md)       | Licensing. Read before copying anything.        |
| [`references/`](./references/)                     | Architecture notes on code we may **not** copy. |

A design skill is vendored at `.claude/skills/ui-ux-pro-max/` and is
available without any install step.

---

## Hard rules

These are not preferences. Violating one is a defect.

### Motion

1. **Never write a raw `cubic-bezier()` in a component.** Use an `--ease-*`
   token from `lib/styles/css/easings.css`.
2. **Never use bare `ease`, `ease-in-out`, or the browser default** for
   meaningful motion. The default curve is the clearest amateur tell there
   is; across ten measured award sites it is effectively absent.
   `ease-in-out` is permitted only for a move that leaves _and returns_.
3. **Never use 300 ms as a generic default.** The default here is **400 ms** —
   the most-declared duration on the sites measured. Bands: 150–250 ms micro,
   300–600 ms standard, 800–1200 ms choreographed.
4. **Animate only `transform` and `opacity`.** Never `width`, `height`,
   `top`/`left`, `margin`, or `box-shadow`.
5. **`prefers-reduced-motion` is mandatory**, and under it content must end
   **fully visible** — never stranded at `opacity: 0` because an animation was
   skipped. Seven of ten award sites ship none of this; we are better here.
6. **One RAF loop.** Lenis, GSAP and Tempus share it. Never add a second
   `requestAnimationFrame` loop — desynchronised loops produce jitter that
   reads as cheap even at 60fps.
7. **Always clean up.** `kill()` ScrollTriggers and revert GSAP contexts on
   unmount.

### Tokens

8. **No hardcoded design values.** No raw hex, no `16px`, no `400ms` in a
   component. Colour, spacing, duration, easing, and type come from tokens.
9. **Semantic tokens, not literals.** `var(--color-primary)`, never
   `var(--color-black)` — otherwise theming breaks.
10. **Author colour in `oklch()`** and derive variants with
    `color-mix(in oklab, …)`. Never hand-pick a hex for a tint.
11. **Never silence `contrast.test.ts`.** Fix the colour, or record a
    deliberate baseline with `bun run contrast:accept`.
12. **Grid children use `minmax(0, 1fr)`**, never bare `1fr`.

### WebGL

13. **3D is an accent.** It stays behind the feature flag (`lib/features` +
    `lib/webgl`). No page may depend on WebGL to be usable or readable.
14. **Always ship a non-WebGL path** — and it must look intentional, not
    broken.
15. **Dispose geometries, materials, and textures** on unmount. Leaked GPU
    memory is the standard R3F failure.

### Licensing

16. **No `LICENSE` file in the source → do not copy the code.** A public
    repository without a licence is all rights reserved. Study it, write your
    own implementation, record the distinction.
17. **Every file in `vault/` carries a provenance header** — origin, licence,
    and whether code was copied or the file is original.
18. **Verify licences by reading the source's own `LICENSE`**, never a badge,
    an article, or a search result. This project already caught one
    widely-repeated false MIT claim that way (`PROVENANCE.md` §5).

### Honesty

19. **Never claim a performance number you did not measure.** Say "budget" or
    "estimate" unless a profiler produced it. No browser profiling has been
    possible in this environment.
20. **Never claim accessibility you did not test.** `@axe-core/playwright` is
    installed; run it.
21. **If something was skipped or failed, say so explicitly** rather than
    quietly narrowing scope.

---

## Working here

```bash
bun install
bun dev                # dev server
bun run build          # production build
bun run typecheck      # tsc --noEmit
bun run lint           # oxlint, --max-warnings=0
bun test               # unit tests
bun run test:e2e       # Playwright + axe-core
bun run storybook      # component catalogue
bun run check          # everything CI runs
```

`lefthook` runs oxlint and typecheck on every commit. A commit that trips
them is not ready.

### `vault/` — what it is and is not

`vault/` is a library of **installable, tokenised patterns**: motion wiring,
WebGL shells, primitives, and blocks. It is deliberately deep rather than
broad. Every file must typecheck, use tokens, honour reduced motion, and
carry a provenance header. Primitives carry a Storybook story.

It is **not** the website. Pages are built after the foundation is reviewed.

### The standard that matters

The measured difference between a competent site and an award site is not
component count or effect novelty. It is **restraint applied consistently**:
two typefaces, three weights, one accent colour, three durations, four
easing curves — chosen once and never violated.

When in doubt, do less, and do it more precisely.
