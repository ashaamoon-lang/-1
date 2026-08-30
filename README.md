# Studio Foundation

Foundation for a commissioned-artwork studio website: Next.js 16 App Router,
WebGL as an accent, motion built on measured decisions rather than borrowed
taste.

**This is the foundation, not the finished site.** Pages are designed and built
after this is reviewed. What exists today is the stack, the research, the
design system, and a vault of installable patterns.

---

## Where it came from

Built on **[Satūs](https://github.com/darkroomengineering/satus)** (MIT), the
production Next.js starter by **darkroom.engineering** — the studio that wrote
[Lenis](https://github.com/darkroomengineering/lenis), the smooth-scroll
library that turns up in the shipped source of award-winning sites across the
industry.

Starting there means starting from the same line as the studios doing this work
professionally, legally, rather than assembling a stack from tutorials.

`LICENSE` at the root is darkroom.engineering's and stays that way — MIT
requires it. Full detail in [`docs/PROVENANCE.md`](docs/PROVENANCE.md).

## What has been added

|                       |                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Measured research** | Ten award-winning sites analysed from their live production CSS. Raw counts committed.  |
| **Design system**     | Colour, type, spacing, and grid rules mapped onto the existing token files.             |
| **Motion spec**       | Easing tokens, duration bands, and a mandatory reduced-motion contract.                 |
| **`vault/`**          | Installable, tokenised patterns — motion, primitives, WebGL, blocks.                    |
| **`ui-ux-pro-max`**   | Design skill vendored to `.claude/skills/`, so any agent opening this repo inherits it. |
| **Hard rules**        | `CLAUDE.md` — what agents may and may not do here.                                      |

## Stack

```
next 16.3 · react 19.2 · typescript 7 (strict) · tailwind v4
gsap + lenis + tempus · @react-three/fiber + drei + three + postprocessing
theatre.js · zustand · zod · sanity (optional CMS)
storybook 10 · playwright + @axe-core/playwright · oxlint + oxfmt · bun
```

Shopify, HubSpot and Mailchimp were removed via the starter's own
`setup:project` script. WebGL and Theatre.js were kept; Sanity is optional.

## Quick start

Requires **Bun ≥ 1.3.5** and **Node ≥ 24.20**.

```bash
bun install
bun dev            # http://localhost:3000
```

| Command             |                                |
| ------------------- | ------------------------------ |
| `bun run build`     | production build               |
| `bun run check`     | everything CI runs             |
| `bun test`          | unit tests                     |
| `bun run test:e2e`  | Playwright + axe accessibility |
| `bun run storybook` | component catalogue            |
| `bun run typecheck` | `tsc --noEmit`                 |
| `bun run lint`      | oxlint                         |

`lefthook` runs oxlint and typecheck on every commit.

## Read these in this order

| Document                                         |                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| [`CLAUDE.md`](CLAUDE.md)                         | Hard rules for this project. Short.                                      |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)             | What gets built and in what order. Structure, workflow, six stages.      |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)       | Clone to live domain. Env vars, Vercel, Sanity CORS, webhook, checklist. |
| [`AGENTS.md`](AGENTS.md)                         | Engineering standards, from Satūs. The reference.                        |
| [`docs/TEARDOWN.md`](docs/TEARDOWN.md)           | Measured evidence. Real numbers.                                         |
| [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) | Colour, type, spacing, grid.                                             |
| [`docs/MOTION-SPEC.md`](docs/MOTION-SPEC.md)     | Binding rules for animation.                                             |
| [`docs/PROVENANCE.md`](docs/PROVENANCE.md)       | Licensing. Read before copying anything.                                 |
| [`docs/RESOURCES.md`](docs/RESOURCES.md)         | The dossier, and the known gaps.                                         |
| [`vault/README.md`](vault/README.md)             | What is in the vault — and what not to rebuild.                          |
| [`references/`](references/)                     | Architecture notes on code we may **not** copy.                          |

## The one finding worth reading first

The easing curves award-winning studios actually ship are **already named
tokens in this repository**. The curve used 60 times on one measured site is
exactly `--ease-out-quart`; another site's is exactly `--ease-out-expo`. The
most common duration across the field is **400ms** — not the 300ms that ships
as a default in most component libraries.

And seven of the ten sites measured ship **no `prefers-reduced-motion`
handling at all**. Every component here honours it.

Evidence: [`docs/TEARDOWN.md`](docs/TEARDOWN.md), raw counts in
`docs/teardown-data.json`.

## Known gaps

Stated plainly rather than left to be found:

1. **No licensed typeface.** Every measured award site self-hosts a commercial
   face. No free substitute reads the same. Highest-leverage upgrade available,
   and a purchasing decision.
2. **No real performance measurement.** Every performance figure in these docs
   is a budget, not a profiler result.
3. **Art direction is open** — accent colour, typeface, and voice are
   deliberately undecided. The system is built to accept them.
4. **Confirm GSAP plugin licensing before launch** — see `docs/PROVENANCE.md` §2.

---

_Built on [Satūs](https://github.com/darkroomengineering/satus) by
[darkroom.engineering](https://darkroom.engineering) — MIT._
