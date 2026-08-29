# basement.studio — `website-2k25`

**Repository:** https://github.com/basementstudio/website-2k25
**Licence:** none. All rights reserved. **No code copied.**
**Source of these notes:** the `dependencies` block of its public
`package.json`, read 2026-08-29, plus CSS measured from the live site
(`docs/TEARDOWN.md`).

This is the production source of a working award-winning agency site. The
dependency list is a factual account of what such a site actually needs.

## The decision worth the most

**`@react-three/offscreen` (`1.0.0-rc.1`)** — R3F rendering moved into a Web
Worker via `OffscreenCanvas`. The 3D scene renders off the main thread, so
React reconciliation, scroll handling, and animation do not compete with it.

This is the answer to the question "why does their heavy 3D site still scroll
smoothly." It is not that their shaders are cheaper — the work is on a
different thread.

**Cost, stated honestly.** Offscreen rendering needs a real fallback:
`OffscreenCanvas` support is not universal, DOM access from the worker is
gone, and event handling (raycasting, pointer events) becomes substantially
harder. It is the correct move for a scene that is _decorative and heavy_,
and the wrong move for one that is _interactive and light_.

**Our position:** not adopted now. Our 3D is an accent behind a feature flag,
so the main thread is not contended in the first place. Revisit only if
profiling shows the canvas starving the main thread — and profile before
adopting, not after.

## The rest of the 3D stack

| Package               | What it indicates                                                                                                    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@react-three/rapier` | Rust/WASM physics. Real physics, not faked motion.                                                                   |
| `maath`               | pmndrs math helpers — damping, easing, random distribution. Small, MIT, and safe to depend on directly.              |
| `meshline`            | Thick lines in three.js. Native `THREE.Line` ignores `linewidth` on most platforms; this is the standard workaround. |
| `leva`                | Runtime GUI for tweaking values. A dev-time tool. Their equivalent of our Theatre.js.                                |
| `r3f-perf`            | In-scene performance HUD. They measure rather than guess.                                                            |
| `three-stdlib`        | Maintained extraction of three's `examples/jsm`.                                                                     |
| `tunnel-rat`          | Render React from inside the canvas tree out to the DOM. Satūs ships the same idea at `lib/webgl/components/tunnel`. |

`maath`, `meshline`, `tunnel-rat` and `r3f-perf` are all MIT and installable
directly if needed. Nothing needs to be copied from this repository to get them.

## Non-3D observations

- **`motion` (Framer Motion) _and_ GSAP.** Both, in one production site.
  A pragmatic split — declarative React transitions in one, timeline and
  scroll choreography in the other. Worth noting because purists claim you
  must choose. Satūs picks GSAP + Lenis; that remains our choice, since two
  animation runtimes is real bundle weight for a portfolio.
- **Mux for video** (`@mux/mux-video-react`, `sanity-plugin-mux-input`).
  Adaptive-bitrate hosting rather than `<video src>`. For a
  commissioned-artwork portfolio with heavy video, this matters more than any
  shader: a 40 MB mp4 on a hero ruins a site that is otherwise perfect.
- **`@million/lint`** — React render-performance linting.
- **Sentry, Supabase, Notion, Sanity.** An agency site with real infrastructure.
- **`jquery` and `js-dos`.** A DOS emulator and jQuery, in 2026. Evidence that
  a site can carry oddities and still win awards — the polish is elsewhere.

## What we take

1. Watch main-thread contention as a first-class concern. Offscreen is the
   escape hatch if we ever need it.
2. Adopt `maath` / `meshline` directly (MIT) rather than reimplementing.
3. Take video hosting seriously — it likely outweighs 3D for our use case.
4. Measure in-scene (`r3f-perf`) instead of asserting frame rates.

## What we do not take

- Two animation runtimes. Bundle cost is not justified here.
- Physics. Nothing in a portfolio needs Rapier.
- Their code, in any amount.
