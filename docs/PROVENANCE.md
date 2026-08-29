# PROVENANCE

Origin and licence of every piece of third-party material in this repository.

**The rule that governs this file:** if a licence could not be verified by
reading the source's own `LICENSE` file (or an explicit published licensing
policy), **its code does not enter this repository.** Studying it is fine.
Copying it is not.

All licences below were verified on **2026-08-29** by fetching the raw file
from the source repository, not by trusting a summary, a README badge, or a
search result.

---

## 1. The foundation

### Satūs — vendored as the base of this repository

|           |                                                                     |
| --------- | ------------------------------------------------------------------- |
| Source    | https://github.com/darkroomengineering/satus                        |
| Version   | `3.0.0`, commit `8cdce31`                                           |
| Licence   | **MIT** — verified from `LICENSE`                                   |
| Copyright | Copyright (c) 2024 darkroom.engineering                             |
| Status    | **Vendored.** Whole repository copied without upstream git history. |

The MIT licence requires the copyright notice and permission text to be
retained in all copies or substantial portions. **`LICENSE` at the repository
root is darkroom.engineering's, unmodified, and must stay that way.** It is
not a leftover from scaffolding and must not be replaced with a project
licence. If this project later needs its own licence terms, add a separate
file and keep this one intact.

`THIRD-PARTY-NOTICES.md` (also from upstream) is retained for the same reason.

Modifications made after vendoring are in git history, starting from the
pristine vendor commit, so the diff against upstream is auditable at any time.

---

## 2. Dependencies that arrived with Satūs

All are ordinary npm dependencies, used unmodified via `package.json` — no
source copied into this repository. Licences verified from each project's
own `LICENSE`:

| Package                            | Licence                    | Notes                                         |
| ---------------------------------- | -------------------------- | --------------------------------------------- |
| `lenis`                            | MIT — darkroom.engineering | smooth scroll; the de-facto industry standard |
| `tempus`                           | MIT — darkroom.engineering | shared RAF loop                               |
| `hamo`                             | MIT — darkroom.engineering | React utility hooks                           |
| `@react-three/fiber`               | MIT — pmndrs               | React renderer for three.js                   |
| `@react-three/drei`                | MIT — pmndrs               | R3F helpers                                   |
| `three`                            | MIT                        |                                               |
| `postprocessing`                   | MIT                        |                                               |
| `@theatre/core`, `@theatre/studio` | **Apache-2.0**             | animation sequencer — see note below          |
| `gsap`, `@gsap/react`              | _see note_                 |                                               |
| `next`, `react`, `react-dom`       | MIT                        |                                               |
| `tailwindcss`                      | MIT                        |                                               |
| `zustand`, `zod`, `clsx`           | MIT                        |                                               |

**Theatre.js is Apache-2.0, not MIT.** For use as an unmodified dependency
this makes no practical difference. It matters if Theatre source is ever
copied or modified: Apache-2.0 requires stating changes and preserving
`NOTICE`. Do not copy Theatre source into `vault/`.

**GSAP licensing — read before shipping.** GSAP's standard licence is free
for most uses, but some plugins have historically been Club-GreenSock-only,
and the terms have changed more than once (including a move to make more of
the toolset free). This project uses GSAP as a dependency, which is the
normal path. **Before production launch, confirm the current terms for the
specific plugins used** (`ScrollTrigger`, `SplitText`, `Draggable`) at
https://gsap.com/licensing/. This is flagged rather than asserted because it
depends on the licence version in force at ship time, which I cannot verify
for a future date.

---

## 3. Skills vendored into `.claude/skills/`

### `ui-ux-pro-max`

|              |                                                                          |
| ------------ | ------------------------------------------------------------------------ |
| Source       | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill                  |
| Version      | `2.13.0`, commit `8bd29e7`                                               |
| Licence      | **MIT** — Copyright (c) 2024 Next Level Builder, verified from `LICENSE` |
| Installed at | `.claude/skills/ui-ux-pro-max/`                                          |
| Licence copy | `.claude/skills/ui-ux-pro-max/LICENSE` — retained as MIT requires        |

Vendored as files (not installed as a plugin) so it is committed with the
repository: any agent that opens this repo inherits it with no setup step.

Contents per its own `SKILL.md`: 79 searchable styles (50 active), 192 product
palettes with reasoning profiles, 74 font pairings, 119 UX guidelines, 105
icons, 17 GSAP presets, 25 chart types, 22 technology stacks — including
`data/stacks/threejs.csv`, which is directly relevant here.

> Note on a discrepancy, for accuracy: the repository's `skill.json` advertises
> "84 UI styles … 98 UX guidelines" while `SKILL.md` in the same commit says
> "79 searchable styles … 119 UX guidelines". The `SKILL.md` figures are the
> ones the search data actually exposes and are what is quoted above.

Only the `ui-ux-pro-max` skill was vendored. The upstream repo also ships
`design`, `design-system`, `ui-styling`, `brand`, `banner-design` and
`slides` (≈11 MB total); they were left out to keep repository weight and
agent context focused. They are available at the same MIT terms if wanted.

---

## 4. Sources cleared for code reuse — not yet drawn from

Licences verified; nothing has been copied from these yet. Any future
extraction must be recorded in §6 with the file it landed in.

| Source                          | Licence                                                 | Verified from               |
| ------------------------------- | ------------------------------------------------------- | --------------------------- |
| `basementstudio/scrollytelling` | **MIT** — Copyright (c) 2023 basement.studio            | `LICENSE`                   |
| `magicuidesign/magicui`         | **MIT**                                                 | `LICENSE`                   |
| `DavidHDev/react-bits`          | **MIT + Commons Clause** — Copyright (c) 2026 David Haz | `LICENSE.md`                |
| Codrops / tympanus.net demos    | **MIT**                                                 | published policy, see below |

**react-bits — the Commons Clause restriction, read in full.** The licence
grants use "as part of an application, website, or product" including
commercial use, and forbids selling, sublicensing, or redistributing "the
components themselves — whether alone, in a bundle, or as a ported version."

Using a react-bits component in a commissioned client site is permitted.
Shipping a component library derived from it, or reselling the components, is
not. That distinction is compatible with this project, but note that
`vault/` is a component collection by design — if `vault/` were ever
published as a product in its own right, react-bits material would have to be
excluded.

**Codrops — licence comes from a site policy, not a per-repo `LICENSE` file.**
Individual Codrops demo repositories generally carry **no** `LICENSE` file.
The MIT grant comes from the published policy at
https://tympanus.net/codrops/licensing/, verified on 2026-08-29: demos and
code are MIT, commercial use explicitly permitted, copyright and permission
notice must be included. (Design _freebies_ are separate terms — usable in
commercial projects, but redistribution or sale of the item itself is not
permitted.)

Because the grant is a site policy rather than a file in the repository,
**every Codrops extraction must record the demo URL, the article, and a link
to the licensing page in its file header and in §6.**

---

## 5. Studied, never copied — no licence, all rights reserved

These repositories are public but ship **no `LICENSE` file**. Verified on
2026-08-29 by requesting `LICENSE` and `LICENSE.md` on both `main` and
`master`: all four returned HTTP 404.

| Repository                           | Result                           |
| ------------------------------------ | -------------------------------- |
| `basementstudio/website-2k25`        | no LICENSE on `main` or `master` |
| `basementstudio/basement-laboratory` | no LICENSE on `main` or `master` |
| `brunosimon/folio-2019`              | no LICENSE on `main` or `master` |

**A public repository without a licence is not open source.** Default
copyright applies: no right to copy, modify, or redistribute. GitHub's Terms
of Service permit viewing and forking _within GitHub_; they do not grant a
licence to reuse the code in a separate commercial project.

> **Correcting a claim from the research that fed this project.** Web sources
> asserted that Bruno Simon's `folio-2019` (Awwwards Developer Site of the
> Year 2019) is MIT-licensed. **It is not.** Both branches were checked
> directly; there is no licence file. Had that claim been taken at face
> value, copyrighted code would have entered a commercial deliverable.

**Zero lines from these repositories are in this project.** What was taken
is architectural observation — which is not copyrightable and is recorded in
`references/`. Reading a dependency list and noting _that_ a studio renders
3D in a worker thread is research; copying how they wrote it is infringement.

The same applies to the closed-source award sites measured in `TEARDOWN.md`
(Lusion, By-Kin, Uncommon Studio, Mat Voyce, Minh Pham, Iventions, Lando
Norris). Measuring publicly served CSS to learn that a site uses
`cubic-bezier(.165,.84,.44,1)` at 400 ms is observation of a design decision.
Design decisions — a duration, a curve, a colour relationship, a grid — are
not protected expression. Their code, markup, fonts, and assets are, and none
of it is here.

---

## 6. Vault extraction log

Every file in `vault/` must appear here, and must carry a header comment with
the same information.

| Vault file                                              | Origin | Licence | Notes |
| ------------------------------------------------------- | ------ | ------- | ----- |
| _(see `vault/PROVENANCE-NOTE.md` and per-file headers)_ |        |         |       |

Current status: all `vault/` code is **original work written for this
project**, built against the public APIs of MIT/Apache dependencies
(Lenis, GSAP, Tempus, R3F) and following patterns documented in those
projects' own docs. No third-party source has been copied. Where a file
implements a technique observed elsewhere, the header names the source of the
_idea_ and states explicitly that no code was copied.

---

## 7. Adding anything new — the checklist

1. Find the actual `LICENSE` file in the source repository. Do not trust a
   README badge, a blog post, an article, or a search result.
2. Read it — check for added conditions (Commons Clause, NOTICE requirements,
   non-commercial terms).
3. No licence file → **do not copy.** Study only.
4. Record it here **and** in the file's header comment.
5. If the licence requires attribution, retain the notice verbatim.

When a licence is ambiguous, the answer is not to copy. Judgement calls on
someone else's copyright are the user's to make, not mine — this is
commissioned commercial work and the exposure lands on them.
