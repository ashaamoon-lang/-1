'use client'

import {
  type ComponentType,
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react'

import Orchestra from '@/lib/dev/orchestra'
import { useDeviceDetection } from '@/lib/hooks/use-device-detection'
import {
  claimPrimary,
  getDOMTunnel,
  getPrimaryClaimId,
  getServerPrimaryClaimId,
  getWebGLTunnel,
  registerRootCanvasMount,
  releasePrimary,
  subscribePrimaryClaim,
} from '@/lib/webgl/store'
import type { tunnel } from '@/webgl/utils/tunnel'

type WebGLCanvasComponent = ComponentType<
  Omit<CanvasProps, 'root' | 'force' | 'children'>
>

/**
 * Loads the WebGL surface **after** the client has decided it will be shown.
 *
 * This was `next/dynamic(() => import('./webgl'), { ssr: false })`, which is
 * lazy about *evaluating* the module and not about *fetching* it: the import
 * sits at module scope in a client component that is in the page graph, so
 * Next emitted the chunk as a parser-initiated `<script async>` in the HTML.
 * Measured on `/en`: 245.6 KB gzip (931 KB raw) of three.js and R3F — 47% of
 * the page's script bytes — downloaded by phones and by
 * `prefers-reduced-motion` visitors, both of whom render no `<canvas>` at all.
 * What those bytes buy is a two-colour gradient that the CSS fallback already
 * draws identically (`docs/AUDIT-2026-08.md` §1.4).
 *
 * A bare `import()` inside an effect has no module-scope reference, so nothing
 * is fetched until `isMounting` is true. `e2e/webgl-budget.e2e.ts` holds it.
 */
function useWebGLCanvasComponent(
  enabled: boolean
): WebGLCanvasComponent | null {
  const [component, setComponent] = useState<WebGLCanvasComponent | null>(null)

  useEffect(() => {
    if (!enabled || component) return

    let cancelled = false
    import('./webgl')
      .then(({ WebGLCanvas }) => {
        // Wrapped in a thunk: `setState` calls a bare function argument as an
        // updater, and a component *is* a function.
        if (!cancelled) setComponent(() => WebGLCanvas)
      })
      .catch(() => {
        // Degrade, do not throw. `component` stays null, nothing mounts, and
        // the page keeps whatever non-WebGL path it already renders —
        // `CLAUDE.md` #14: the site must never depend on 3D to be usable.
      })

    return () => {
      cancelled = true
    }
  }, [enabled, component])

  return component
}

/**
 * Reads the Orchestra dev panel's 🧊 WebGL toggle (persisted in the same
 * `orchestra` localStorage store every other panel toggle uses). Defaults to
 * `true` — matches the toggle's own `defaultValue` in `lib/dev/cmdo.tsx` and
 * the "on by default" behaviour documented in `lib/dev/README.md`.
 *
 * Collapses to a constant `true` in production: `process.env.NODE_ENV` is
 * inlined at build time, so the subscription never runs and minification
 * drops the dead branch — no persisted dev-panel state leaks into what
 * production visitors render.
 */
const NOOP_UNSUBSCRIBE = () => {
  // Production: nothing is subscribed, so nothing to tear down.
}

const subscribeToWebGLToggle = (onChange: () => void) =>
  process.env.NODE_ENV === 'development'
    ? Orchestra.subscribe((state) => state.webgl, onChange)
    : NOOP_UNSUBSCRIBE

const getWebGLToggle = () =>
  process.env.NODE_ENV === 'development'
    ? (Orchestra.getState().webgl ?? true)
    : true

// The toggle only exists in the browser; SSR always renders as enabled so the
// server and the first client paint agree.
const getWebGLToggleServerSnapshot = () => true

function useWebGLDevKillSwitch(): boolean {
  return useSyncExternalStore(
    subscribeToWebGLToggle,
    getWebGLToggle,
    getWebGLToggleServerSnapshot
  )
}

type TunnelInstance = ReturnType<typeof tunnel>

type CanvasContextValue =
  | { active: false }
  | { active: true; WebGLTunnel: TunnelInstance; DOMTunnel: TunnelInstance }

type CanvasProps = PropsWithChildren<{
  /**
   * Mount the WebGL canvas, backed by the shared store tunnels. Mount it once
   * — either in the shared layout (persists across routes) or per page via
   * `<Wrapper webgl>`. Without it, children fall back to whichever root canvas
   * is mounted, via {@link useCanvas}.
   */
  root?: boolean
  /** Force WebGL even on mobile/non-WebGL devices */
  force?: boolean
  /**
   * Composite the scene through `lib/webgl/components/postprocessing`.
   *
   * Off by default, and deliberately per-route rather than global: a pass is
   * a full-screen draw every frame, and Tahap 32 measured what a careless one
   * does to artwork. The one shipped here is an identity operation while the
   * page is still — see that module for the measurement that decided both.
   *
   * Not destructured below: `{...props}` forwards it to `WebGLCanvas`, which
   * is the component that owns the composer.
   */
  postprocessing?: boolean
  /**
   * Which GPU simulations `FlowmapProvider` mounts (root canvas only).
   * Defaults to none (opt-in) — pass the sims you actually use, e.g.
   * `['flowmap']`, to avoid paying for a GPU pass and window listeners with
   * no consumer.
   */
  simTypes?: ('fluid' | 'flowmap')[]
}>

export const CanvasContext = createContext<CanvasContextValue>({
  active: false,
})

/**
 * Canvas component that provides WebGL context and the tunnel system.
 *
 * `root` mounts the actual canvas; mount exactly one across the app (in the
 * layout for a persistent canvas, or per page via `<Wrapper webgl>`). A
 * non-root `<Canvas>` mounts nothing and just lets children reach the root
 * canvas through {@link useCanvas}.
 *
 * @example
 * ```tsx
 * // Shared canvas, mounted once in the root layout
 * <Canvas root />
 *
 * // Portal content from anywhere
 * <WebGLTunnel>
 *   <My3DScene />
 * </WebGLTunnel>
 * ```
 */
export function Canvas({
  children,
  root = false,
  force = false,
  simTypes,
  ...props
}: CanvasProps) {
  const { isWebGL, isReducedMotion } = useDeviceDetection()
  const webglDevToggleEnabled = useWebGLDevKillSwitch()

  // Only a root canvas mounts the WebGL surface; it uses the shared store
  // tunnels so content portals into it from anywhere. A non-root <Canvas> is a
  // passthrough whose children fall back to the root canvas via useCanvas().
  const WebGLTunnel = root ? getWebGLTunnel() : undefined
  const DOMTunnel = root ? getDOMTunnel() : undefined

  // `force` is an explicit escape hatch — it bypasses both the WebGL
  // capability check and the reduced-motion preference.
  //
  // ⚠ Because reduced-motion (and non-WebGL devices) means the canvas may
  // never mount, anything that puts CONTENT in WebGL — not just decoration —
  // must account for a fallback for this state: render a static image / DOM
  // equivalent when the canvas is absent, or mount with `force` and damp
  // motion inside the scene.
  //
  // The Orchestra panel's 🧊 toggle is a dev-only kill switch on top of all
  // of that (including `force`) — useful for isolating perf work to the DOM
  // side of a page without physically deleting `<Canvas root>`.
  const shouldRender =
    webglDevToggleEnabled && root && ((isWebGL && !isReducedMotion) || force)
  const contextValue: CanvasContextValue =
    WebGLTunnel && DOMTunnel
      ? { active: true, WebGLTunnel, DOMTunnel }
      : { active: false }

  // Guard against two <Canvas root> instances both mounting the WebGL surface
  // at once (e.g. layout canvas + <Wrapper webgl> on the same page). Two
  // instances rendering in the same commit both read `primaryClaimId ===
  // undefined` from a post-commit-only source, so both would optimistically
  // mount a full r3f Canvas + WebGLRenderer for that one commit — the claim
  // below is decided synchronously in the render body instead (a token, not
  // the GL resource itself, which still only ever mounts via normal
  // JSX/effects), so the second instance in the same commit already sees the
  // first instance's claim. `claimPrimary` is idempotent per id, so React
  // Strict Mode's double-render of a single instance is safe. Subscribing via
  // useSyncExternalStore exists only to re-render this instance when the
  // claim changes elsewhere (e.g. the primary unmounted and a survivor was
  // promoted) — its return value isn't used, `claimPrimary` is the source of
  // truth for `isPrimary`. Release happens in the mounting effect's cleanup,
  // never from render, and promotes the next registered candidate.
  const id = useId()
  useSyncExternalStore(
    subscribePrimaryClaim,
    getPrimaryClaimId,
    getServerPrimaryClaimId
  )
  const canMount = contextValue.active && shouldRender
  const isPrimary = canMount && claimPrimary(id)
  const isMounting = isPrimary
  const WebGLCanvas = useWebGLCanvasComponent(isMounting)

  useEffect(() => {
    if (!canMount) return
    const unregister = registerRootCanvasMount(id)
    return () => {
      unregister()
      releasePrimary(id)
    }
  }, [canMount, id])

  return (
    <CanvasContext.Provider value={contextValue}>
      {isMounting &&
        WebGLCanvas && (
          /*
           * Not created during render. This is the module's own export,
           * fetched once and held in state, so its identity is stable across
           * every subsequent render — holding it is exactly what keeps the
           * import() out of the page's initial graph.
           */
          // oxlint-disable-next-line react/static-components
          <WebGLCanvas {...props} {...(simTypes && { simTypes })} />
        )}
      {children}
    </CanvasContext.Provider>
  )
}

/**
 * Hook to access the Canvas context (tunnels for WebGL and DOM content).
 */
export function useCanvas() {
  const localContext = use(CanvasContext)
  if (localContext.active) return localContext
  // Fall back to the root singletons — always present once the store is loaded.
  return {
    active: true as const,
    WebGLTunnel: getWebGLTunnel(),
    DOMTunnel: getDOMTunnel(),
  }
}
