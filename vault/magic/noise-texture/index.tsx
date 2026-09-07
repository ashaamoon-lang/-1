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
 * ## The grain is zero-mean, and it was not — Tahap 55
 *
 * Upstream's chain ends at `feComponentTransfer`, and the result is painted
 * as a translucent layer. That is not grain; it is **a veil**, and the
 * measurement is unambiguous. `feTurbulence` gives noise on [0,1] with a mean
 * of 0.5. The linear slope multiplies the *colour* by `slope` — mean 0.075 —
 * and leaves the *alpha* as noise with a mean of 0.5. And with
 * `color-interpolation-filters` at its `linearRGB` default, linear 0.075
 * reaches the screen as sRGB ≈ 0.30, i.e. **#4d4d4d**. So the layer is a
 * mid-grey wash at ~6-9% effective alpha, and it drags every ground toward
 * that one grey:
 *
 *     paper #f4f3ef (244) → 232.7    ink #110f0d (17) → 21.6
 *
 * Measured on the production build, a 180x150 patch of empty ground, the
 * same patch with the layer switched off as the control. The site declares
 * two colour modes; the veil was quietly merging them. That is the defect
 * the repo owner named — "one of the colour modes merges with the
 * background" — and `docs/stages/TAHAP-55.md` §1 has the full table.
 *
 * Worse than the shift is the ratio: the veil moved the ground by 11.1 (light)
 * and 4.5 (dark) levels while the grain it exists to deliver measured only
 * 3.63 and 1.81 levels of standard deviation. **Two and a half to three times
 * more veil than texture.** Tahap 53 swept `opacity` from 0.75 to 0.18, which
 * shrank both sides equally and left that ratio untouched.
 *
 * Four changes make the layer's mean equal the ground's:
 *
 * 1. `color-interpolation-filters="sRGB"`, declared rather than inherited.
 *    This project's design values live in sRGB; letting the default stand is
 *    the whole reason 0.075 arrived on screen as #4d4d4d.
 * 2. The `<rect>` is filled with `--color-primary` — the layer is now *the
 *    ground colour*, so it has the same mean as what sits behind it.
 * 3. `feFuncA` pins alpha to 1, so the noise lives in the colour rather than
 *    in the transparency.
 * 4. `feComposite operator="arithmetic"` adds the grain and subtracts its
 *    own mean back out: `k2=1` keeps the ground, `k3=1` adds the grain, and
 *    `k4 = -slope / 2` removes `mean(grain) = slope x 0.5`.
 *
 * The mean is then the ground colour **by construction, at any layer
 * opacity** — which finally makes `opacity` mean what its name says, a
 * texture strength, rather than a veil weight wearing a texture's name.
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
      /*
       * A stable handle for `e2e/palette-integrity.e2e.ts`, which measures
       * this layer by photographing a page twice — once with it, once
       * without. CSS-module class names are hashed and change with the file,
       * so a gate that reached for one would be a gate that silently stopped
       * finding anything.
       */
      data-noise-texture=""
      className={cn(s.noise, className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        `sRGB`, declared. The default is `linearRGB`, and under it the slope
        below lands on screen three times lighter than it reads here — see the
        header. Every number in this chain is chosen in the space the rest of
        the design system is authored in.
      */}
      <filter id={id} colorInterpolationFilters="sRGB">
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
        <feComponentTransfer result="grain">
          <feFuncR type="linear" slope={slope} />
          <feFuncG type="linear" slope={slope} />
          <feFuncB type="linear" slope={slope} />
          {/*
            Opaque. Left alone, alpha stays as turbulence wrote it — noise
            with a mean of 0.5 — and the layer becomes a translucent wash of
            whatever colour the transfer produced. The noise belongs in the
            colour channels; the alpha is not where texture goes.
          */}
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        {/*
          ground + grain - mean(grain).

          `SourceGraphic` is the rect, and the stylesheet fills it with
          `--color-primary`, so `k2="1"` carries the ground through unchanged.
          `k3="1"` adds the grain, whose mean is `slope x 0.5` because
          `fractalNoise` is centred on 0.5, and `k4` subtracts exactly that.

          What is left has the ground's mean and the grain's variance, which
          is what "grain" was supposed to mean all along.
        */}
        <feComposite
          in="SourceGraphic"
          in2="grain"
          operator="arithmetic"
          k1={0}
          k2={1}
          k3={1}
          k4={-slope / 2}
        />
      </filter>
      <rect
        className={s.field}
        width="100%"
        height="100%"
        filter={`url(#${id})`}
      />
    </svg>
  )
}
