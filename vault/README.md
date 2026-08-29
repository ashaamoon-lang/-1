# vault/

Installable, tokenised patterns for this project. **Deep, not wide** — a few
components that are genuinely production-ready, not a catalogue of stubs.

`vault/` is **not the website.** Pages are built after the foundation is
reviewed. This is the material they will be built from.

## Every file in here obeys these

1. **Strict TypeScript**, no `any`, no `@ts-ignore`.
2. **Tokens, never literals** — durations, easings, colours, and spacing come
   from `vault/motion/tokens.ts` or `lib/styles`. A raw `400ms` or `#fff` in a
   component is a defect.
3. **`prefers-reduced-motion` honoured**, and under it content ends **fully
   visible** — never stranded at `opacity: 0` because an animation was
   skipped. That bug turns an accessibility feature into a blank page.
4. **A provenance header** naming origin and licence, and stating explicitly
   whether any code was copied. See `docs/PROVENANCE.md`.
5. **Cleanup on unmount** — GSAP contexts reverted, ScrollTriggers killed,
   GPU resources disposed.
6. **A Storybook story** for every primitive, including its reduced-motion state.

## Layout

```
vault/
├─ motion/         tokens, and the patterns that need GSAP
│  ├─ tokens.ts        easing / duration / stagger — the CSS↔GSAP bridge
│  ├─ text-reveal/     one-shot line or word reveal on enter
│  └─ page-transition/ route transition overlay
├─ primitives/     small interactive pieces
│  ├─ magnetic/        pointer-attracted button
│  └─ cursor/          custom cursor with hover states
├─ webgl/          3D, behind the feature flag
│  └─ scene-shell/     R3F scene wrapper + shader material pattern
└─ blocks/         page-level compositions
   ├─ hero/
   └─ project-grid/
```

## What is deliberately **not** here, because Satūs already ships it

This matters more than the list above. The single most common way to ruin a
codebase like this is to rebuild what the foundation already does correctly,
ending up with two competing implementations.

| Already exists                                        | Where                                                          | Do not rebuild                                         |
| ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| Lenis ↔ GSAP ↔ Tempus frame sync                      | `components/layout/lenis/`, `components/effects/gsap.tsx`      | **Especially not this** — see `vault/motion/README.md` |
| Scroll-progress text dimming                          | `components/effects/progress-text/`                            | Different from `text-reveal/`; both are useful         |
| CSS-driven reveal-on-scroll                           | `lib/hooks/use-reveal.ts`                                      | Cheaper than GSAP for simple entrances — prefer it     |
| Marquee                                               | `components/ui/marquee/`                                       |                                                        |
| WebGL canvas, tunnels, device tiering, postprocessing | `lib/webgl/`                                                   |                                                        |
| Reduced-motion hook (reactive)                        | `lib/hooks/use-sync-external.ts` → `usePreferredReducedMotion` |                                                        |
| Header, footer, wrapper                               | `components/layout/`                                           |                                                        |
| Accordion, dialog, tabs, select, toast, tooltip, form | `components/ui/` (Base UI)                                     |                                                        |

**Check this table before adding anything.**
