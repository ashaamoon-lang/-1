/**
 * Main page wrapper providing theme, smooth scrolling, and WebGL context.
 *
 * IMPORTANT: This component ALREADY includes <Header> and <Footer>.
 * Do NOT add Header/Footer to layout.tsx or individual pages - they render here.
 *
 * Customize the Header and Footer components for your project needs.
 */
'use client'

import cn from 'clsx'
import type { LenisOptions } from 'lenis'
import dynamic from 'next/dynamic'

import { Footer } from '@/components/layout/footer'
import { Header, type SectionLink } from '@/components/layout/header'
import { Lenis } from '@/components/layout/lenis'
import { Theme } from '@/components/layout/theme'
import type { ThemeName } from '@/styles/config'
import { Canvas } from '@/webgl/components/canvas'

/**
 * GSAP's clock handed to Tempus, so tweens share one frame loop with Lenis and
 * WebGL. Loaded per page rather than from the layout: mounting it globally put
 * GSAP into every page's graph, including pages that never animate.
 */
const GSAPRuntime = dynamic(
  () =>
    import('@/components/effects/gsap').then((mod) => ({
      default: mod.GSAPRuntime,
    })),
  { ssr: false }
)

function isLenisOptions(value: boolean | LenisOptions): value is LenisOptions {
  return typeof value === 'object'
}

/**
 * Props for the Wrapper component.
 */
interface WrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Theme to apply ('dark' | 'light'). Defaults to 'dark'. */
  theme?: ThemeName
  /** Enable smooth scrolling. Can be boolean or Lenis configuration object. Defaults to true. */
  lenis?: boolean | LenisOptions
  /**
   * Mount the WebGL canvas for this page.
   *
   * This is the per-page alternative to the shared root canvas mounted in the
   * layout (see `lib/features`). Pick ONE strategy: either keep the shared
   * canvas in the layout, or remove it and opt pages in with `webgl`. Enabling
   * both mounts two canvases.
   */
  webgl?: boolean
  /**
   * In-page sections this page rendered, in document order, for the header's
   * anchor nav.
   *
   * Omit it on pages that have none — the header then shows just the wordmark
   * and the language switcher, which is the correct header for a project
   * detail page or a 404, not a degraded one. A hardcoded anchor list in the
   * header would put `#work` on every page, including the ones with no work
   * section to reach.
   */
  sections?: readonly SectionLink[] | undefined
  /**
   * Mount the GSAP runtime for this page.
   *
   * Off by default. GSAP only earns its ~69KB on a page that actually uses a
   * timeline — here, the home hero's `TextReveal`. Without it GSAP still works
   * wherever it is imported; it just runs on its own ticker rather than in
   * Tempus order.
   */
  gsap?: boolean
}

/**
 * Main page wrapper component providing theme, smooth scrolling, and WebGL.
 *
 * This component serves as the root container for pages, automatically handling
 * theme application, smooth scrolling, and layout structure.
 * It includes navigation and footer.
 *
 * 3D content is portalled in with `<WebGLTunnel>`. Pass `webgl` to host the
 * canvas here per page instead of using the shared canvas in the layout — pick
 * one of the two strategies, not both.
 *
 * @param props - Component props
 * @param props.theme - Color theme to apply to the page
 * @param props.lenis - Whether to enable smooth scrolling with Lenis
 * @param props.webgl - Whether to mount the WebGL canvas for this page
 * @param props.children - Page content
 * @param props.className - Additional CSS classes
 *
 * @example
 * ```tsx
 * // Basic usage with theme
 * export default function Page() {
 *   return (
 *     <Wrapper theme="dark">
 *       <section>My page content</section>
 *     </Wrapper>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Page-scoped WebGL canvas
 * export default function WebGLPage() {
 *   return (
 *     <Wrapper theme="light" webgl>
 *       <WebGLTunnel>
 *         <My3DScene />
 *       </WebGLTunnel>
 *       <section>Content overlaying 3D</section>
 *     </Wrapper>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Disable smooth scrolling
 * export default function StaticPage() {
 *   return (
 *     <Wrapper lenis={false}>
 *       <section>Content without smooth scroll</section>
 *     </Wrapper>
 *   )
 * }
 * ```
 */
export function Wrapper({
  children,
  theme = 'dark',
  className,
  lenis = true,
  webgl = false,
  gsap = false,
  sections,
  ...props
}: WrapperProps) {
  return (
    <Theme theme={theme} global>
      {/* Header is rendered here - do NOT add another in layout.tsx */}
      <Header {...(sections && { sections })} />
      <Canvas root={webgl}>
        <main
          id="main-content"
          /*
           * `-1` so the skip link can actually land here.
           *
           * Without it `<main>` is not focusable, so following the skip link
           * moved the document's scroll position and nothing else: the next
           * Tab went to the wordmark, and a keyboard user still walked the
           * whole header on every page. Measured — `document.activeElement`
           * never changed (`docs/AUDIT-2026-08.md` §2.3). `-1` keeps it out
           * of the tab order while allowing programmatic and fragment focus.
           */
          tabIndex={-1}
          className={cn('relative flex grow flex-col', className)}
          {...props}
        >
          {children}
        </main>
      </Canvas>
      {/* Footer is rendered here - do NOT add another in layout.tsx */}
      <Footer />
      {gsap && <GSAPRuntime />}
      {lenis && (
        <Lenis
          root
          options={isLenisOptions(lenis) ? lenis : {}}
          syncScrollTrigger
        />
      )}
    </Theme>
  )
}
