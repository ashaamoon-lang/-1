'use client'

/**
 * Resolves a CSS colour — including `var()` and `color-mix()` — to `#rrggbb`.
 *
 * ## Why this is needed at all
 *
 * The design system authors colour in `oklch()` and derives variants with
 * `color-mix(in oklab, …)`, which is `CLAUDE.md` #10. WebGL cannot read any of
 * that: `THREE.Color` parses hex, `rgb()`, `hsl()` and named colours, and a
 * modern browser resolves these tokens to `lab(…)` or `color(…)`, which it
 * does not.
 *
 * Before this existed the WebGL layer sidestepped the problem by hard-coding
 * two hex literals — the only raw hex in the shipped codebase, and the reason
 * the hero rendered as a flat black rectangle. This keeps the token as the
 * single source of truth and lets the browser's own colour engine do the
 * conversion, rather than maintaining a second copy of the palette in a form
 * three happens to understand.
 *
 * ## How
 *
 * Two steps, each doing something the other cannot:
 *
 * 1. A throwaway element resolves the cascade. A custom property read straight
 *    off `document.documentElement` comes back as its *specified* text —
 *    `color-mix(in oklab, var(--color-secondary) 12%, …)` — with the nested
 *    `var()`s unresolved, because custom properties are not computed unless
 *    registered with `@property`. Setting it on a real element's `color` and
 *    reading the computed value resolves the whole chain.
 * 2. A 1×1 canvas converts whatever colour space that lands in to sRGB bytes.
 *    `ctx.fillStyle` round-tripping is not enough on its own: Chrome hands
 *    `lab(4.43 0.58 1.35)` straight back. Painting the pixel and reading it
 *    forces a concrete sRGB triple.
 */

/**
 * `#rrggbb`, or `null` when the value will not parse.
 *
 * No environment guard, and that is a claim about the call sites rather than
 * an oversight: this is only reached from a client component's snapshot read,
 * which React does not run on the server. `lib/motion/navigation-signal.ts`
 * documents the same reasoning for the same reason.
 */
export function resolveColorToHex(value: string): string | null {
  const probe = document.createElement('span')
  probe.style.color = value
  // Out of flow and invisible: this must never affect layout or paint, and it
  // lives for less than a frame either way.
  probe.style.position = 'absolute'
  probe.style.pointerEvents = 'none'
  probe.style.opacity = '0'
  document.body.append(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()

  if (!computed) return null

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.fillStyle = computed
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  if (r === undefined || g === undefined || b === undefined) return null

  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}
