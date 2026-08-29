# vault/ — provenance

**Every file in `vault/` is original work written for this project.**
No third-party source was copied into it.

Verified by construction, not by assertion: each file was written against the
public APIs of its dependencies, and each carries a header stating its origin
and licence. `docs/PROVENANCE.md` §6 is the canonical log.

| File                      | Origin   | Built on                                                                     | Code copied? |
| ------------------------- | -------- | ---------------------------------------------------------------------------- | ------------ |
| `motion/tokens.ts`        | original | curve values re-exported from `lib/styles/css/easings.css` (Satūs, MIT)      | no           |
| `motion/text-reveal/`     | original | GSAP + SplitText public API; structure follows Satūs's `progress-text` (MIT) | no           |
| `motion/page-transition/` | original | `usePathname` + GSAP timelines                                               | no           |
| `primitives/magnetic/`    | original | `gsap.quickTo`                                                               | no           |
| `primitives/cursor/`      | original | `gsap.quickTo` + DOM events                                                  | no           |
| `webgl/scene-shell/`      | original | R3F, three, Satūs's `WebGLTunnel` (MIT)                                      | no           |
| `blocks/project-grid/`    | original | Satūs's `useReveal` + `components/ui/link` (MIT)                             | no           |
| `blocks/hero/`            | original | composes the vault primitives above                                          | no           |

## On "built on" versus "copied from"

Using a library's documented API is not copying, whatever the licence. Copying
a library's implementation is, and needs the licence to permit it.

Everything in the "Built on" column above is the former. Where a file
implements a _technique_ seen elsewhere — the magnetic button and the masked
line reveal are both widely reproduced and owned by no one — the header says
so and states that no implementation was consulted.

## If you add a file here

1. Write the provenance header first. If you cannot state the origin
   confidently, that is the signal to stop.
2. Add a row to this table and to `docs/PROVENANCE.md` §6.
3. If any code was copied, name the source, its licence, and the commit or
   URL — and confirm the licence permits it (`docs/PROVENANCE.md` §7).
4. No `LICENSE` file at the source means **do not copy.**
