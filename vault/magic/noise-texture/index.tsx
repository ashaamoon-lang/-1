import cn from 'clsx'
import { useId } from 'react'

import s from './noise-texture.module.css'

/**
 * NoiseTexture — grain, so a flat ground reads as a surface.
 *
 * ## Provenance
 *
 * Adapted from **Magic UI**, component `noise-texture`.
 *
 * - Source: `github.com/magicuidesign/magicui`, `registry/magicui/noise-texture.tsx`
 * - Licence: **MIT**, Copyright (c) Magic UI
 * - Verified by reading that repository's own `LICENSE.md` (`CLAUDE.md` #18).
 * - **Code copied: yes** — the filter chain and its tuning:
 *   `feTurbulence type="fractalNoise"` → `feColorMatrix type="saturate" 0` →
 *   `feComponentTransfer` with a linear slope per channel.
 *
 * The chain is the whole value of this component. Turbulence alone produces
 * coloured noise; the saturate pass takes it to grey, and the linear slope is
 * what stops it reading as television static. Those three passes in that
 * order, at those defaults, are what would otherwise have to be rediscovered.
 *
 * ## What was changed
 *
 * Upstream sets `opacity-50 dark:opacity-[0.75]`. Neither survives here: the
 * arbitrary value is a hardcoded design number (`CLAUDE.md` #8), and `dark:`
 * does not exist in this project, which themes with a `[data-theme]`
 * attribute on a ground element rather than a class on `<html>`
 * (`components/layout/theme` — the reason is in that file's header). The
 * stylesheet carries both weights against the real theme selector.
 *
 * ## Why grain at all, on a site with no texture anywhere else
 *
 * A large flat field of one colour is the cheapest-looking thing a screen can
 * show, and this site has several of them by design — the hero, the studio
 * statement, the passage. Grain costs one SVG element, no JavaScript, and no
 * frame time, and it is the difference between "unpainted" and "paper".
 *
 * It is deliberately the *only* texture in the system. `DESIGN-SYSTEM.md`
 * measures restraint as the thing that separates an award site from a
 * competent one, and a second texture would make this one decoration rather
 * than a material.
 *
 * ## It is ground, not content
 *
 * `aria-hidden` and `pointer-events: none`. It sits behind everything and is
 * never the only place anything is said.
 */

interface NoiseTextureProps {
  /**
   * `baseFrequency` for `feTurbulence` — higher is finer-grained.
   *
   * The upstream default. Coarser than this starts to read as a pattern
   * rather than as grain, which is the failure mode to avoid.
   */
  frequency?: number | undefined
  /** `numOctaves` — more octaves add detail at smaller scales. */
  octaves?: number | undefined
  /** Linear slope per channel after desaturation; the contrast of the grain. */
  slope?: number | undefined
  className?: string | undefined
}

export function NoiseTexture({
  frequency = 0.4,
  octaves = 6,
  slope = 0.15,
  className,
}: NoiseTextureProps) {
  // Two grounds on one page must not share a filter id, and an id that
  // differed between server and client renders would break hydration.
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn(s.noise, className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency}
          numOctaves={octaves}
          stitchTiles="stitch"
        />
        {/* To grey. Turbulence is coloured, and a colour this palette never
            chose is exactly what `token-rules.test.ts` exists to prevent —
            even when it arrives as a filter rather than as a literal. */}
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={slope} />
          <feFuncG type="linear" slope={slope} />
          <feFuncB type="linear" slope={slope} />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  )
}
