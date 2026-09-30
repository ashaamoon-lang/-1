# vault/ — provenance

> **Corrected on the repo owner's decision** (`docs/FORK.md` §1.4). This note
> used to open with _"Every file in `vault/` is original work written for this
> project. No third-party source was copied into it."_ Two directories
> contradicted it: `vault/magic/` is vendored from Magic UI, and
> `vault/primitives/icon/` carries path data copied from Phosphor Icons — both
> MIT, and both already recorded correctly in their own files and in
> `docs/PROVENANCE.md`. This note was the one place that disagreed, and it now
> says what the files say.

## What is original, and what is not

| Where                                         | Origin                                                                   | Licence                                    | Code copied?                                                                                                  | Recorded in                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `blocks/*`                                    | original work for this project                                           | —                                          | no                                                                                                            | each file's header                                                 |
| `motion/*`                                    | original work for this project                                           | —                                          | no                                                                                                            | each file's header                                                 |
| `webgl/material-image/`, `webgl/scene-shell/` | original work for this project                                           | —                                          | no                                                                                                            | each file's header                                                 |
| `primitives/cursor/`, `primitives/magnetic/`  | original work for this project                                           | —                                          | no                                                                                                            | each file's header                                                 |
| `primitives/icon/`                            | [Phosphor Icons](https://github.com/phosphor-icons/core), regular weight | **MIT**, Copyright (c) 2023 Phosphor Icons | **yes** — the `d` attribute of each glyph, one per file in `paths/`; everything else original                 | `primitives/icon/index.tsx` header; `docs/PROVENANCE.md` §Phosphor |
| `magic/*`                                     | [Magic UI](https://github.com/magicuidesign/magicui), vendored           | **MIT**, Copyright (c) Magic UI            | per component: `grid-pattern` **yes**, `noise-texture` **partly**, `dot-pattern` **no**, `pixel-image` **no** | `magic/README.md`; `docs/PROVENANCE.md` §Magic UI                  |

`vault/magic/` and `docs/PROVENANCE.md` are the records for the third-party
code; this note points to them rather than restating them, and neither is
edited by the correction. `docs/FORK.md` §3.1 lists which of the original
directories the fork itself edited — `blocks/`, `motion/` and
`webgl/material-image/`; that is a statement about edits, not about origin.

### How this was checked

Every source file outside `vault/magic/`, tests and stories excluded:

- **34** carry the header `Provenance: original work for this project.`
- **8** are `primitives/icon/`, whose headers name Phosphor Icons, its MIT
  licence and what was copied.
- **3** carry no provenance header: `blocks/practice-filter/index.tsx`,
  `motion/reading-progress/index.tsx` and `blocks/project-hero/cover-span.ts`.
  Git shows each first committed in this repository — Tahap 13, Tahap 52 and
  the fork — so they are original work missing a header, not third-party code.
  Recorded here; the headers are not added by this correction.

One discrepancy, recorded rather than fixed: `primitives/icon/index.tsx` says
it copied the `d` attribute of **eight** glyphs, while `paths/` holds **seven**
files and `docs/PROVENANCE.md` says seven.

## On "built on" versus "copied from"

Using a library's documented API is not copying, whatever the licence. Copying
a library's implementation is, and needs the licence to permit it.

The original directories are built on public APIs — GSAP and its plugins,
React Three Fiber and three, and the Satūs starter's hooks and utilities (MIT)
— which is the former. Where a file implements a _technique_ seen elsewhere —
the magnetic button and the masked line reveal are both widely reproduced and
owned by no one — the header says so and states that no implementation was
consulted.

The two copies above are the latter, and MIT permits them as long as the
notice travels with the code: that is why the notice sits in the file header
and not only in this note.

## If you add a file here

1. Write the provenance header first. If you cannot state the origin
   confidently, that is the signal to stop.
2. If any code was copied, name the source, its licence, and the commit or
   URL — and confirm the licence permits it (`docs/PROVENANCE.md` §7). Add a
   row to the table above and to `docs/PROVENANCE.md`.
3. No `LICENSE` file at the source means **do not copy.**
