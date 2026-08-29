# vault/motion

## Read this before writing any animation

### The frame loop is already correct. Do not rebuild it.

The single most common way a site assembled from excellent parts still feels
cheap is **desynchronised animation loops**. Lenis interpolates scroll on its
own `requestAnimationFrame`; GSAP advances tweens on its own ticker. Left
independent, a scroll-linked animation renders the _previous_ frame's scroll
position. The result is a subtle lag between what the user scrolls and what
moves — jitter that persists at a solid 60fps and that profilers do not flag,
because nothing is slow. It just feels wrong.

Tempus exists to solve this, and **Satūs already wires it correctly**:

| Order | Who                                 | What it does                                              |
| ----- | ----------------------------------- | --------------------------------------------------------- |
| `5`   | `components/layout/lenis/index.tsx` | Lenis writes scroll state                                 |
| `6`   | `components/ui/marquee/index.tsx`   | reads `lenis.velocity`, now current                       |
| `10`  | `components/effects/gsap.tsx`       | `gsap.updateRoot()` reads scroll, renders scrubbed tweens |

`GSAPRuntime` also calls `gsap.ticker.remove(gsap.updateRoot)` so GSAP's own
rAF stops advancing the root clock — one loop drives everything — and restores
it on unmount so in-flight tweens do not freeze.

**Therefore:**

- **Never call `requestAnimationFrame` directly** in this project. Use
  `useTempus` from `tempus/react` and pass an explicit `order`.
- Without an explicit `order`, Tempus defaults to `0` and sequencing becomes
  mount-order luck — the exact bug this system prevents.
- Reading scroll state? Order **above 5**. Writing it? You should not be.
- Mount `<OptionalFeatures gsap />` in the layout for any page that uses GSAP,
  or tweens run on GSAP's own ticker and fall out of Tempus order.

The plan for this project called for building this wiring in `vault/`.
On inspection the foundation already had it, done properly and with the
reasoning written out — so it is documented here instead of duplicated. A
second implementation would have been a second RAF loop: the precise defect
the pattern exists to avoid.

### Use `useGSAP`, never a bare `useEffect`

`useGSAP` from `@gsap/react` scopes selector strings to a ref and reverts
every tween, timeline, and ScrollTrigger created inside it on unmount. Leaked
ScrollTriggers are the standard memory-leak-and-jank source in React + GSAP
projects.

```tsx
const scope = useRef<HTMLDivElement>(null)
useGSAP(
  () => {
    gsap.to('.card', { y: 0 })
  },
  { scope }
)
```

Animations started from an event handler run outside that scope — wrap them
with `contextSafe` to keep them under the same cleanup.

### Reach for CSS before GSAP

`lib/hooks/use-reveal.ts` drives entrance reveals with an IntersectionObserver
and CSS transitions on `transform`/`opacity`. That runs on the compositor
thread, unaffected by main-thread work during hydration, and ships no GSAP.
GSAP core is ~43KB gzipped — worth it for choreography and scrubbing, not for
fading a card in.

Use GSAP when you need: a timeline with multiple sequenced steps, scroll
scrubbing, text splitting, or programmatic control. Otherwise use CSS.

### Tokens, not numbers

Import from `vault/motion/tokens.ts`. Never type a `cubic-bezier()` or a
millisecond value into a component. The token file also documents where each
curve was measured, so a reviewer can check the choice rather than argue taste.

Full rules: [`docs/MOTION-SPEC.md`](../../docs/MOTION-SPEC.md).
