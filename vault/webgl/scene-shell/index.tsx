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
import {
  type ComponentType,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react'

import { useDeviceDetection } from '@/lib/hooks/use-device-detection'
import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { resolveColorToHex } from '@/lib/styles/resolve-color'
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

/**
 * The tokens this wash is made of, named once.
 *
 * `lib/styles/css/global.css` owns the values; this file owns nothing about
 * colour beyond the two names, which is the point — they used to be two hex
 * literals here and were the only raw hex in the shipped codebase.
 */
/**
 * Resolved colour pairs, memoised by their CSS source.
 *
 * `getSnapshot` must return a referentially stable value or React re-renders
 * forever, and resolving through the DOM is not free either. Keyed by the two
 * CSS strings, which is the whole of the input.
 */
const washCache = new Map<string, { a: string; b: string } | null>()

function washSnapshot(
  colorA: string,
  colorB: string
): { a: string; b: string } | null {
  const key = `${colorA}|${colorB}`
  const cached = washCache.get(key)
  if (cached !== undefined) return cached

  const a = resolveColorToHex(colorA)
  const b = resolveColorToHex(colorB)
  const value = a && b ? { a, b } : null
  washCache.set(key, value)
  return value
}

/**
 * A subscription that never fires.
 *
 * `useSyncExternalStore` requires one, and the "external system" here is the
 * resolved cascade, which does not change under a running page: the palette
 * is static and a theme switch remounts the tree. The unsubscribe is empty
 * because there was nothing to attach.
 */
function subscribeNever(): () => void {
  return noop
}

function noop(): void {
  // Nothing to tear down — see `subscribeNever`.
}

/** No DOM on the server, so no colour — and the fallback is what renders. */
function serverWashSnapshot(): null {
  return null
}

const WASH_FROM = 'var(--hero-wash-from)'
const WASH_TO = 'var(--hero-wash-to)'

export function SceneShell({
  colorA = WASH_FROM,
  colorB = WASH_TO,
  grain = 0.014,
  className,
}: SceneShellProps) {
  const { isWebGL } = useDeviceDetection()
  const prefersReducedMotion = usePreferredReducedMotion()

  /*
   * WebGL needs concrete sRGB; CSS gives us `color-mix(in oklab, …)`.
   *
   * `useSyncExternalStore` rather than an effect, which is the shape this
   * repository already uses twice for the same problem — reading a value that
   * only exists in the browser without a mount effect and without a hydration
   * mismatch (`components/ui/link` does it for the Network Information API).
   * The server snapshot is `null`, so the server renders the fallback
   * gradient, which takes the CSS values directly and is therefore already
   * correct; the client resolves them and swaps in the mesh.
   */
  const resolved = useSyncExternalStore(
    subscribeNever,
    () => washSnapshot(colorA, colorB),
    serverWashSnapshot
  )

  // Mirrors the condition inside `<Canvas>`: if the canvas will not mount,
  // this component must render the fallback instead of an empty box.
  const canRenderWebGL = isWebGL && !prefersReducedMotion
  const GradientScene = useGradientScene(canRenderWebGL === true)

  if (!canRenderWebGL || !GradientScene || !resolved) {
    return (
      <div
        className={cn(s.fallback, className)}
        /*
         * Identity, not state — the same split `vault/webgl/material-image`
         * uses. `data-accent-region` says "this area is supposed to carry
         * tone" and is always present; `data-accent-live` below says "a mesh
         * is drawing it right now" and is only present then. Marking one
         * attribute for both would make the marker vanish exactly when it
         * works, which is the trap Tahap 14a recorded.
         */
        data-accent-region=""
        style={{
          // Same two colours, same direction as the shader's diagonal ramp, so
          // the fallback is the same design rather than a placeholder.
          // The CSS values go in unresolved on purpose: this path needs no
          // conversion, so the fallback reads the tokens directly and stays
          // correct if the palette changes under it.
          backgroundImage: `linear-gradient(135deg, ${colorA}, ${colorB})`,
        }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className={cn(s.shell, className)}
      data-accent-region=""
      data-accent-live=""
      aria-hidden="true"
    >
      <WebGLTunnel>
        {/* oxlint-disable-next-line react/static-components -- not created
            during render: the module's own export, fetched once and held in
            state, so its identity is stable. Holding it is what keeps three.js
            out of the initial graph. */}
        <GradientScene
          colorA={resolved.a}
          colorB={resolved.b}
          grain={grain}
          // Belt and braces: the canvas already declines to mount under
          // reduced motion, but a scene must never assume its host checked.
          animate={!prefersReducedMotion}
        />
      </WebGLTunnel>
    </div>
  )
}
