/**
 * Optional Features for Root Layout
 *
 * Conditionally loads optional features based on usage.
 */

'use client'

import dynamic from 'next/dynamic'
const LazyWebGLCanvas = dynamic(
  () =>
    import('@/webgl/components/canvas').then((mod) => ({
      default: mod.Canvas,
    })),
  { ssr: false }
)

const isDevelopment = process.env.NODE_ENV === 'development'

// Lazy imports to avoid loading unused features
const OrchestraTools = dynamic(
  () => import('@/dev').then((mod) => ({ default: mod.OrchestraTools })),
  { ssr: false }
)

const GSAPRuntime = dynamic(
  () =>
    import('@/components/effects/gsap').then((mod) => ({
      default: mod.GSAPRuntime,
    })),
  { ssr: false }
)

type OptionalFeaturesProps = {
  /**
   * Mount the GSAP runtime, which hands GSAP's clock to Tempus so tweens share
   * one frame loop with Lenis and WebGL.
   *
   * Off by default because mounting it downloads the GSAP core (~43KB
   * gzipped), and a site that never animates should not pay for it. Opt in
   * from the layout when any page under it uses `useGSAP`/`gsap`:
   *
   * ```tsx
   * <OptionalFeatures gsap />
   * ```
   *
   * Without it, GSAP still works wherever it is imported — it just runs on
   * GSAP's own ticker rather than in Tempus order, so scrubbed ScrollTriggers
   * can render a frame behind the scroll position.
   */
  gsap?: boolean
  /**
   * Mount the persistent root WebGL canvas here, in the shared layout.
   *
   * Off by default, and that default is a measured decision. It used to be
   * mounted unconditionally, which put three.js and react-three-fiber into
   * every page's graph — **859KB uncompressed** downloaded by `/en/ai`, a
   * page of plain text with no canvas on it.
   *
   * Two strategies, and only one may be used at a time (two root canvases
   * race to claim primary — see `lib/webgl/store.ts`):
   *
   *   - here, for a canvas that survives route changes; or
   *   - per page via `<Wrapper webgl>`, for a site where one page uses WebGL.
   *
   * This site takes the second: only the home hero has a scene.
   */
  webgl?: boolean
}

/**
 * Conditionally loads optional root layout features
 *
 * Note: React Compiler handles memoization automatically.
 * No manual useMemo/useCallback needed.
 */
export function OptionalFeatures({
  gsap = false,
  webgl = false,
}: OptionalFeaturesProps) {
  return (
    <>
      {/* GSAP runtime — opt-in, see the `gsap` prop */}
      {gsap && <GSAPRuntime />}
      {/* Persistent root WebGL canvas (no-op on non-WebGL devices) */}

      {/* Development tools - only in development */}
      {isDevelopment && <OrchestraTools />}
      {webgl && <LazyWebGLCanvas root />}
    </>
  )
}
