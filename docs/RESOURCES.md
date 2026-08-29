# RESOURCES

Curated dossier for this project. Everything here was verified on
**2026-08-29** by reading the source directly — repository `LICENSE` files,
`package.json` manifests, and live production CSS — not from articles or
search summaries.

Licence status for every entry is in `docs/PROVENANCE.md`. The short version:
**if the licence was not verifiable, the code does not enter this repository.**

---

## 1. The foundation

### Satūs — `darkroomengineering/satus`

The base of this repository. MIT, v3.0.0, commit `8cdce31`.

Not a tutorial template: it is the production starter of **darkroom.engineering**,
the studio that wrote **Lenis** — the smooth-scroll library measured on
three of the ten award sites in `TEARDOWN.md`, including two we did not
choose for that reason.

What it brings, verified from its `package.json`:

```
next 16.3.3 · react 19.2.8 · typescript 7.0.2 · tailwindcss 4.3.3
gsap 3.15 + @gsap/react · lenis 1.3.26 · tempus · hamo
@react-three/fiber 9.7 · @react-three/drei 10.7 · three 0.185 · postprocessing 6.39
@theatre/core + @theatre/studio · zustand · zod · @base-ui/react
storybook 10 · playwright 1.62 + @axe-core/playwright · oxlint/oxfmt
react-compiler · next-sanity · @vercel/analytics
```

Why it is the right base, beyond the dependency list:

- **WebGL sits behind a feature flag** (`lib/webgl` + `lib/features`) — the
  starter already treats 3D as an accent, which is the architecture this
  project wants.
- **Design tokens are real and enforced.** `lib/styles/colors.ts` is authored
  in `oklch()`; `contrast.test.ts` fails the build if a palette change breaks
  WCAG AA. Accessibility is checked, not claimed.
- **Its easing tokens are the award vocabulary.** `--ease-out-quart` is
  exactly the curve Minh Pham ships 60×; `--ease-out-expo` is exactly Lando
  Norris's. See `TEARDOWN.md` §1.
- **Storybook + Playwright + axe-core preinstalled.**
- **Agent infrastructure included** — `AGENTS.md` (28 KB of engineering
  standards), `@storybook/addon-mcp`, `deslop-cli`, and a custom oxlint
  anti-slop plugin.

**As pruned here:** kept Sanity, WebGL, Theatre; removed Shopify, HubSpot,
Mailchimp, the example routes, and the starter's own landing page. Done with
the starter's own `setup:project` script so the registry, CSP composer, env
schemas, and barrel exports stayed consistent. 13 dependencies dropped.

---

## 2. Cleared for code reuse

Licence verified; nothing extracted yet. Any extraction gets logged in
`PROVENANCE.md` §6 and in the file header.

| Source                                                                              | Licence                                                        | Why it is here                                                                                                                      |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`basementstudio/scrollytelling`](https://github.com/basementstudio/scrollytelling) | MIT (basement.studio 2023)                                     | Declarative React + GSAP scrollytelling from an award agency. Closest licensed thing to how these sites choreograph scroll.         |
| [`magicuidesign/magicui`](https://github.com/magicuidesign/magicui)                 | MIT                                                            | Animated component patterns. Useful as reference; most need retokenising to our system before use.                                  |
| [`DavidHDev/react-bits`](https://github.com/DavidHDev/react-bits)                   | MIT + **Commons Clause**                                       | Animated React components. Usable in a client site; **may not be resold or redistributed as components.** See the constraint below. |
| [Codrops](https://tympanus.net/codrops/)                                            | MIT via [site policy](https://tympanus.net/codrops/licensing/) | 500+ technique demos. Per-demo repos carry **no** `LICENSE` file — the grant is the site policy, so every extraction must cite it.  |

**The react-bits constraint, because `vault/` is a component collection.**
The Commons Clause permits commercial use inside "an application, website, or
product" but forbids selling or redistributing "the components themselves —
whether alone, in a bundle, or as a ported version." Using a component in the
commissioned site: fine. Publishing `vault/` as a component library: would
require excluding anything react-bits-derived. Worth knowing now rather than
at publication.

---

## 3. Studied, never copied

No `LICENSE` file → all rights reserved. Architectural notes in `references/`,
zero lines of code.

| Source                               | Note                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `basementstudio/website-2k25`        | Production source of an award agency site. Dependency list is a fact sheet on what such a site needs — `@react-three/offscreen` above all. |
| `brunosimon/folio-2019`              | Awwwards Developer Site of the Year 2019. **Widely and wrongly reported as MIT — it is not** (`PROVENANCE.md` §5).                         |
| `basementstudio/basement-laboratory` | Experiment collection.                                                                                                                     |

Closed-source award sites — Lusion, By-Kin, Uncommon Studio, Mat Voyce, Minh
Pham, Iventions, Lando Norris — measured in `TEARDOWN.md` from publicly
served CSS. What makes them read as expensive is art direction and timing
discipline, and both are legal to learn from.

---

## 4. Agent tooling

### Installed in this repository

| Tool                                             | Status                                                                                                                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ui-ux-pro-max`** v2.13.0                      | **Vendored** at `.claude/skills/ui-ux-pro-max/` (MIT). Committed, so any agent opening this repo inherits it. 79 styles, 192 palettes, 74 font pairings, 119 UX guidelines, 17 GSAP presets, and a `data/stacks/threejs.csv`. |
| **`AGENTS.md`**                                  | From Satūs. 28 KB of engineering standards — the single source of truth for code style.                                                                                                                                       |
| **`@storybook/addon-mcp`**                       | Ships with Satūs.                                                                                                                                                                                                             |
| **`deslop-cli`** + custom oxlint anti-slop rules | Ship with Satūs (`bun run deslop`).                                                                                                                                                                                           |

### Requires the user to install — these are user actions, not mine

| Tool                      | Command                                                   | Why it matters                                                                                                                                                                                                                                        |
| ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`frontend-design`**     | `/plugin install frontend-design@claude-plugins-official` | Anthropic first-party; explicitly designed against generic-AI aesthetics.                                                                                                                                                                             |
| **`chrome-devtools-mcp`** | per its own docs                                          | **Without it every performance claim in this repo is an estimate.** Real profiling needs a real browser — and note that the browser in _this_ environment could not reach the network (`TEARDOWN.md`), so profiling has to happen where egress works. |
| **`context7`**            | per its own docs                                          | Version-specific live docs. Next 16 / R3F 9 / Tailwind 4 / TypeScript 7 are all moving fast and model knowledge goes stale.                                                                                                                           |

### Considered and skipped

**`everything-claude-code`** (68 agents, 286 skills, MIT) — too broad. The
context cost outweighs the marginal gain over the four above. Revisit if a
specific need appears.

---

## 5. Reading the docs in this repo

| Document                  | Read it when                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`               | **First.** Engineering standards, code style, framework specifics. |
| `CLAUDE.md`               | Project-specific hard rules for agents. Short by design.           |
| `docs/TEARDOWN.md`        | You want evidence for a design decision. Real measured numbers.    |
| `docs/DESIGN-SYSTEM.md`   | Choosing colour, type, spacing, grid.                              |
| `docs/MOTION-SPEC.md`     | Writing any animation. Binding.                                    |
| `docs/PROVENANCE.md`      | Adding a dependency or copying any external code.                  |
| `references/`             | Architectural context from projects we may not copy.               |
| `docs/teardown-data.json` | Checking a claim in `TEARDOWN.md` against raw counts.              |

---

## 6. Known gaps

Stated plainly rather than left to be discovered.

1. **No licensed typeface.** Every measured award site self-hosts a
   commercial face (Aeonik, Apercu, Söhne, Maisonneue, ABC Arizona). No free
   substitute reads the same. This is the highest-leverage upgrade available
   and it is a purchasing decision, not a technical one.
2. **No real performance measurement.** The browser could not reach the
   network from this environment. Every performance number here is a budget,
   not a result.
3. **Runtime motion of the reference sites was not observed.** The CSS
   harvest cannot see GSAP timelines or scroll choreography. Statements about
   those are labelled as inference in `TEARDOWN.md`.
4. **Art direction is not decided.** Accent colour, typeface, and voice are
   deliberately open — the system is built to accept them.
5. **GSAP plugin licensing needs confirming before launch** — see
   `PROVENANCE.md` §2.
6. **One end-to-end test is flaky against the dev server, and only there.**
   `e2e/not-found.e2e.ts` asserts the 404 page logs no console errors. Under
   `bun run dev`, Next's on-demand route compilation sometimes races its
   `instant` prefetch validation for the homepage, logging
   `Route "/[...slug]": Could not validate 'instant'…`. Against a production
   build — which is how `playwright.config.ts` runs the suite when `CI` is set,
   and how it was verified here — the full suite passes 17/17 with zero console
   errors, repeatedly. Reproduce the CI path locally with
   `CI=true bun run test:e2e`. This is a dev-server artifact, not a defect in
   the page; it is recorded rather than papered over, and the test was left
   asserting exactly what it should.
