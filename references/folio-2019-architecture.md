# Bruno Simon — `folio-2019`

**Repository:** https://github.com/brunosimon/folio-2019
**Licence:** **none.** All rights reserved. **No code copied.**
**Awwwards Developer Site of the Year 2019.**

> **Licence correction.** Research feeding this project claimed this
> repository is MIT-licensed. It is not. `LICENSE` and `LICENSE.md` were
> requested on both `main` and `master` on 2026-08-29; all four returned 404.
> A public repo with no licence is all-rights-reserved. Details in
> `docs/PROVENANCE.md` §5.

**Source of these notes:** its public `package.json` and the live site's CSS.

## The entire dependency list

```
dependencies:  cannon ^0.6.2 · dat.gui ^0.7.9 · gsap ^3.12.5
               howler ^2.2.4 · three ^0.164.1 · vite-plugin-restart
devDependencies: vite ^5.2.11 · vite-plugin-glsl ^1.3.0
```

**Six runtime dependencies.** No React. No framework. No CSS library. No
state manager. A site that won Developer Site of the Year is a Vite build
with three.js, a physics engine, GSAP, and an audio library.

The measured page loads **2 scripts** (`docs/TEARDOWN.md`). Iventions — a
conventional marketing site with no 3D — loads **36**.

## What that proves

**Heaviness comes from script sprawl, not from WebGL.** The most graphically
ambitious site measured is also the leanest. Whenever a build feels slow, the
tag manager, the analytics stack, and the framework surface are the first
suspects — not the canvas.

## Specific observations

- **`vite-plugin-glsl`** — shaders as importable `.glsl` files with `#include`
  support, rather than template literals in JS. Real syntax highlighting,
  real reuse. A genuinely better authoring setup, and adoptable independently:
  the plugin is its own MIT package.
- **`howler`** — audio as a first-class concern. Sound is one of the least
  used and most distinctive quality signals on the web. It must always be
  opt-in and muted by default.
- **`cannon`** — physics _is_ the interaction model here (you drive a car).
  Not decoration. If physics does not carry the core interaction, it is weight.
- **`dat.gui`** — the same dev-time tweaking role as Theatre.js and leva.
  Every serious 3D project has one. Ours is Theatre.js, already in the stack.
- **CSS is minimal**: 8 custom properties, ~40 KB. Measured easings are
  overshoot curves — `cubic-bezier(.4,1.6,.65,1)`, `(.49,2.2,.53,.75)` — with
  y > 1, so they overshoot and settle back. Playful, appropriate to a
  cartoon-physics site, and **wrong for a premium studio portfolio**, where
  the measured house style is decelerating out-curves that never overshoot.
- **`prefers-reduced-motion`: 0 occurrences.** A car-driving site with no
  reduced-motion path. Award-winning and inaccessible are not mutually
  exclusive; we do better here at essentially no cost.

## What we take

1. Aggressively guard script count. Two is achievable; thirty-six is a choice.
2. Consider `vite-plugin-glsl`-style shader authoring — though our Next.js
   build needs a different mechanism.
3. Treat audio as a real, opt-in design surface.
4. Match easing character to brand: overshoot reads playful, decelerate reads
   premium. Our teardown says decelerate.

## What we do not take

- Overshoot easings as a default.
- A framework-free architecture — we need routing, CMS, and SEO.
- Its code, in any amount.
