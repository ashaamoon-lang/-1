'use client'

/**
 * SceneShell — the DOM-side entry point for a WebGL accent.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Uses Satūs's existing canvas/tunnel system (`lib/webgl`, MIT,
 * darkroom.engineering) rather than mounting a second canvas.
 *
 * ## The pattern this demonstrates
 *
 * This is the shape every WebGL feature in this project should take, and the
 * reason it exists is more important than the gradient it draws:
 *
 * 1. **Portal into the shared canvas** with `<WebGLTunnel>`. Never mount a
 *    second `<Canvas>`. One WebGL context, one RAF loop, one GPU budget.
 * 2. **Always render a DOM fallback**, and make it look intentional. The
 *    canvas does not mount on devices without WebGL2, under
 *    `prefers-reduced-motion`, or when the dev kill-switch is off — see
 *    `lib/webgl/components/canvas/index.tsx`. A page whose hero is blank in
 *    any of those cases is broken, not minimal.
 * 3. **Feed the fallback from the same tokens** as the scene, so the two are
 *    the same design rather than a design and an apology.
 *
 * `CLAUDE.md` rules 13–15 are the short version: 3D is an accent, always ship
 * a non-WebGL path, always clean up.
 *
 * ## Exactly one root canvas — do not add another
 *
 * `<WebGLTunnel>` portals into whichever `<Canvas root>` is mounted. In this
 * project that canvas is **already mounted, site-wide**, by `lib/features`
 * (`OptionalFeatures` renders `<LazyWebGLCanvas root />` unconditionally) from
 * `app/[locale]/layout.tsx`. So this component works with no setup.
 *
 * **Do not also pass `webgl` to `<Wrapper>`.** That mounts a second root
 * canvas. The two instances then race to claim "primary" during render —
 * including during a background prefetch render of another route — which
 * produces a setState-during-render error and can break an unrelated page's
 * console-error assertions. Verified the hard way: it turned
 * `e2e/not-found.e2e.ts` red while the homepage itself looked fine.
 *
 * If a page ever genuinely needs its own canvas, remove the shared one from
 * the layout first. One strategy or the other, never both.
 *
 * @example
 * ```tsx
 * <SceneShell className="absolute inset-0" />
 * ```
 */

import cn from 'clsx'
import { type ComponentType, useEffect, useState } from 'react'

import { useDeviceDetection } from '@/lib/hooks/use-device-detection'
import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { WebGLTunnel } from '@/webgl/components/tunnel'

import type { GradientScene as GradientSceneType } from './scene'

import s from './scene-shell.module.css'

interface SceneShellProps {
  /** Gradient start. Any CSS colour string three's `Color` accepts. */
  colorA?: string | undefined
  /** Gradient end. */
  colorB?: string | undefined
  /**
   * Grain amplitude, 0–1. Small values only: this dithers gradient banding,
   * it is not a texture. Above ~0.15 it reads as noise rather than film.
   */
  grain?: number | undefined
  className?: string | undefined
}

/**
 * Fetches the R3F scene only once this component has decided to show it.
 *
 * `./scene` imports `@react-three/fiber` and `three`. A static import here put
 * both into the page's client graph, so `/en` emitted a parser-initiated
 * `<script async>` of 245.6 KB gzip / 931 KB raw — downloaded by phones and by
 * `prefers-reduced-motion` visitors, who then render the CSS fallback below
 * and never see a canvas.
 *
 * `<Canvas>` had the same shape and was fixed the same way; both paths had to
 * change, because either one alone still dragged three.js in. The type import
 * above is erased at build time and does not create a runtime reference.
 *
 * `e2e/webgl-budget.e2e.ts` fails if this regresses.
 */
function useGradientScene(
  enabled: boolean
): ComponentType<React.ComponentProps<typeof GradientSceneType>> | null {
  const [Scene, setScene] = useState<ComponentType<
    React.ComponentProps<typeof GradientSceneType>
  > | null>(null)

  useEffect(() => {
    if (!enabled || Scene) return

    let cancelled = false
    import('./scene')
      .then(({ GradientScene }) => {
        // Thunk: `setState` treats a bare function as an updater.
        if (!cancelled) setScene(() => GradientScene)
      })
      .catch(() => {
        // Degrade to the CSS gradient below, which is the same design. A
        // failed chunk must not leave an empty box where the hero was.
      })

    return () => {
      cancelled = true
    }
  }, [enabled, Scene])

  return Scene
}

export function SceneShell({
  colorA = '#0d0d0d',
  colorB = '#242527',
  grain = 0.06,
  className,
}: SceneShellProps) {
  const { isWebGL } = useDeviceDetection()
  const prefersReducedMotion = usePreferredReducedMotion()

  // Mirrors the condition inside `<Canvas>`: if the canvas will not mount,
  // this component must render the fallback instead of an empty box.
  const canRenderWebGL = isWebGL && !prefersReducedMotion
  const GradientScene = useGradientScene(canRenderWebGL === true)

  if (!canRenderWebGL || !GradientScene) {
    return (
      <div
        className={cn(s.fallback, className)}
        style={{
          // Same two colours, same direction as the shader's diagonal ramp, so
          // the fallback is the same design rather than a placeholder.
          backgroundImage: `linear-gradient(135deg, ${colorA}, ${colorB})`,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div className={cn(s.shell, className)} aria-hidden="true">
      <WebGLTunnel>
        {/* oxlint-disable-next-line react/static-components -- not created
            during render: the module's own export, fetched once and held in
            state, so its identity is stable. Holding it is what keeps three.js
            out of the initial graph. */}
        <GradientScene
          colorA={colorA}
          colorB={colorB}
          grain={grain}
          // Belt and braces: the canvas already declines to mount under
          // reduced motion, but a scene must never assume its host checked.
          animate={!prefersReducedMotion}
        />
      </WebGLTunnel>
    </div>
  )
}
