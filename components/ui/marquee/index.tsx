'use client'

import cn from 'clsx'
import { useIntersectionObserver, useResizeObserver } from 'hamo'
import { useLenis } from 'lenis/react'
import { type HTMLAttributes, useId, useRef } from 'react'
import { useTempus } from 'tempus/react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { modulo } from '@/utils/math'

import s from './marquee.module.css'

function getHash(input: string) {
  let hash = 0

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // to 32bit integer
  }
  return hash
}

interface MarqueeProps extends HTMLAttributes<HTMLElement> {
  repeat?: number
  speed?: number
  scrollVelocity?: boolean
  reversed?: boolean
  pauseOnHover?: boolean
}

export function Marquee({
  children,
  className,
  repeat = 2,
  speed = 1,
  scrollVelocity = true,
  reversed = false,
  pauseOnHover = false,
  onMouseEnter,
  onMouseLeave,
  ...props
}: MarqueeProps) {
  const [setRectRef, getEntry] = useResizeObserver({
    lazy: true,
  })

  const id = useId()

  const elementsRef = useRef<(HTMLDivElement | undefined)[]>([])
  const transformRef = useRef(getHash(id) % 10000)
  const isHovered = useRef(false)

  const [setIntersectionRef, intersection] = useIntersectionObserver()

  const lenis = useLenis()

  /*
   * The block this component never had — Tahap 42.
   *
   * A marquee is the purest case of `MOTION-SPEC.md` §0's third category: it
   * has no beginning and no end, so it runs for the whole visit. §0.2 rule 4
   * is explicit that such a thing is **switched off** under the preference
   * rather than slowed — slowing something that never ends produces something
   * that never ends.
   *
   * It shipped from the fork with no consumer, which is why nobody caught it:
   * a component that renders nowhere violates nothing. Tahap 42 gives it a
   * home, so the gap had to close first.
   */
  const prefersReducedMotion = usePreferredReducedMotion()

  // order: 6 — Lenis writes scroll state at order 5 (see
  // components/layout/lenis/index.tsx); without an explicit order here,
  // Tempus defaults this callback to order 0 and sequencing becomes
  // mount-order luck, reading `lenis.velocity` one frame stale.
  useTempus(
    ({ deltaTime }) => {
      const entry = getEntry()

      /*
       * Read from `matchMedia` as well as the hook, the reason
       * `vault/motion/text-reveal` records: the hook's server snapshot is
       * `false`, so the first commit sees `false` even for a reader who has
       * the preference on. Inside the frame callback we are on the client and
       * `matchMedia` is truthful now.
       */
      if (
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return
      }

      if (!intersection?.isIntersecting) return
      if (pauseOnHover && isHovered.current) return

      if (!entry?.borderBoxSize[0]?.inlineSize) return

      let velocity = lenis?.velocity ?? 0
      if (!scrollVelocity) {
        velocity = 0
      }
      velocity = 1 + Math.abs(velocity / 5)

      const offset = deltaTime * (speed * 0.1 * velocity)

      if (reversed) {
        transformRef.current -= offset
      } else {
        transformRef.current += offset
      }

      const width = entry.borderBoxSize[0].inlineSize
      transformRef.current = modulo(transformRef.current, width)

      // Sparse array: shrinking `repeat` removes entries (ref callback fires
      // with null on detach), so iterate defined slots only — no stale nodes.
      for (const node of elementsRef.current) {
        if (!node) continue
        node.style.transform = `translate3d(${-transformRef.current}px,0,0)`
      }
    },
    { order: 6 }
  )

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- hover-to-pause is a progressive enhancement; marquee content stays readable without it
    <section
      ref={setIntersectionRef}
      className={cn(className, s.marquee)}
      /*
       * Names one marquee, so a gate can count instances rather than guess
       * from class names — Tahap 42.
       *
       * `e2e/taste-preflight.e2e.ts` enforces `taste-skill`'s one-marquee
       * rule and counted `[class*="marquee"]`. CSS modules put the source
       * filename into every generated class name, so `.inner` matched too and
       * a single strip with four repeats reported as **five** marquees. The
       * gate was measuring the stylesheet, not the page.
       */
      data-marquee=""
      aria-live="off"
      aria-label="Scrolling content"
      onMouseEnter={(e) => {
        isHovered.current = true
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        isHovered.current = false
        onMouseLeave?.(e)
      }}
      {...props}
    >
      {Array.from({ length: repeat })
        .fill(children)
        .map((_, i) => (
          <div
            // oxlint-disable-next-line react/no-array-index-key -- i can't come up with anything better tbh
            key={`marquee-item-${i}`}
            className={s.inner}
            aria-hidden={i !== 0}
            data-nosnippet={i !== 0 ? '' : undefined}
            ref={(node) => {
              if (!node) {
                // React calls the ref callback with null on detach — clear the
                // slot so the RAF loop above stops animating this stale node
                // (matters when a shrinking `repeat` removes trailing items).
                elementsRef.current[i] = undefined
                return
              }
              elementsRef.current[i] = node

              if (i === 0) setRectRef(node)
            }}
          >
            {children}
          </div>
        ))}
    </section>
  )
}
