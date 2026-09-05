'use client'

import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

/**
 * FLIP for a grid whose contents change under it — `catalogue-sift`.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The technique is FLIP (First, Last, Invert, Play), which is public prior
 * art; this is an implementation of it, not a copy of one.
 *
 * ## Why hand-rolled, and why WAAPI
 *
 * GSAP's `Flip` plugin does this, and it is a Club plugin this repo does not
 * license — `docs/PROVENANCE.md` and `CLAUDE.md` #16 both apply. The Web
 * Animations API needs no dependency, runs on the compositor, and — the rule
 * that actually decided it — **adds no second `requestAnimationFrame` loop**
 * (`CLAUDE.md` #6). `element.animate()` is driven by the browser's own
 * timeline; Lenis, GSAP and Tempus keep the one loop they share.
 *
 * ## Why not the browser's view transitions
 *
 * Measured before writing this, on the production build: pressing a practice
 * chip runs **zero** `document.startViewTransition` calls. Nothing native was
 * animating the change, so there is no native morph to compete with — and
 * making one would have named all six cards at once, against
 * `MOTION-SPEC.md` §9.4's one-morph-per-navigation rule. A native transition
 * also animates every named element on one clock, which is precisely the
 * quality this choreography exists to avoid; see the stagger note below.
 *
 * ## The stagger is by distance, not by index
 *
 * Delay is ranked by how far a card travels, **inverted**: the card with
 * furthest to go leaves first, so the whole grid *lands together*. Index
 * stagger reads as a list being refreshed one row at a time. Distance stagger
 * reads as a set of objects being rearranged — which is what actually
 * happened, and is the difference between a filter that feels mechanical and
 * one that feels considered.
 *
 * ## What it communicates
 *
 * `taste-skill`'s test — *what does this motion communicate?* — answers
 * **state transition**: the same grid, a different subset, and movement that
 * shows the reader which items survived the change rather than replacing the
 * page under them.
 */

/** Marks an element this hook should track. Its value is the item's identity. */
export const FLIP_ID = 'data-flip-id'

/**
 * A position in **document** coordinates, not viewport ones.
 *
 * Measured, because the obvious version is wrong here: a chip navigation
 * resets the scroll position. From `/en/work` at scroll 900, the first card
 * sat at viewport `top: -432`; after filtering it sat at `top: 501`, with the
 * page scrolled back to 0. A viewport-space FLIP would read that as a 933px
 * move and animate the scroll reset as though it were layout — the card
 * flying up the screen for no reason a reader could connect to what they
 * pressed.
 *
 * Adding the scroll offset makes the delta describe what actually changed:
 * where the card sits on the page.
 */
interface Snapshot {
  left: number
  top: number
  element: HTMLElement
}

function positionOf(element: HTMLElement): Snapshot {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    element,
  }
}

/**
 * Below this, a card did not really move.
 *
 * Sub-pixel deltas come from layout rounding, not from a filter, and
 * animating them produces a shimmer on a grid that visually did not change —
 * the exact "nothing happened, but it twitched" tell this project treats as
 * amateur.
 */
const MOVED_PX = 1

/** How many entering cards get a staggered delay before the rest arrive together. */
const MAX_STAGGERED = 8

function cssMs(styles: CSSStyleDeclaration, token: string, fallback: number) {
  const raw = styles.getPropertyValue(token).trim()
  if (raw === '') return fallback
  const value = Number.parseFloat(raw)
  if (Number.isNaN(value)) return fallback
  // `400ms` parses to 400; `0.4s` parses to 0.4 and has to be scaled.
  return raw.endsWith('ms') ? value : value * 1000
}

function cssEase(styles: CSSStyleDeclaration, token: string, fallback: string) {
  const raw = styles.getPropertyValue(token).trim()
  return raw === '' ? fallback : raw
}

/**
 * Animate the survivors of a content change from where they were to where
 * they now are.
 *
 * @param ref       the container holding `[data-flip-id]` descendants
 * @param signature a value that changes exactly when the contents change —
 *                  the filter's key, not the render count. Passing something
 *                  that changes every render would re-measure constantly and
 *                  animate nothing, which is worse than not running at all
 *                  because it looks like it works.
 */
export function useFlipGrid(
  ref: React.RefObject<HTMLElement | null>,
  signature: string
) {
  const prefersReducedMotion = usePreferredReducedMotion()
  const previous = useRef<Map<string, Snapshot> | null>(null)
  const lastSignature = useRef<string | null>(null)

  useLayoutEffect(() => {
    const container = ref.current
    if (!container) return

    /*
     * `matchMedia` as well as the hook, for the reason
     * `vault/motion/text-reveal` and `vault/motion/parallax` both record: the
     * hook's server snapshot is `false`, so the first commit — which is the
     * one this effect runs in — reads `false` even for a reader who has the
     * preference switched on.
     */
    const reduced =
      prefersReducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const items = [
      ...container.querySelectorAll<HTMLElement>(`[${FLIP_ID}]`),
    ].flatMap((element) => {
      const id = element.getAttribute(FLIP_ID)
      return id ? [[id, element] as const] : []
    })

    const current = new Map<string, Snapshot>(
      items.map(([id, element]) => [id, positionOf(element)])
    )

    const first = previous.current
    const changed = lastSignature.current !== signature
    previous.current = current
    lastSignature.current = signature

    // Nothing to animate *from* on the first commit, and nothing to animate
    // at all when the contents did not change. Under reduced motion the
    // measurement still runs — so the next real change has a baseline — but
    // no animation is ever played, and every card stays exactly where the
    // layout put it (`CLAUDE.md` #5).
    if (!first || !changed || reduced) return

    const styles = getComputedStyle(document.documentElement)
    const moveMs = cssMs(styles, '--duration-slow', 800)
    const enterMs = cssMs(styles, '--duration-base', 400)
    const exitMs = cssMs(styles, '--duration-fast', 200)
    const stepMs = cssMs(styles, '--stagger-cards', 70)
    const moveEase = cssEase(styles, '--ease-in-out-quart', 'ease-in-out')
    const enterEase = cssEase(styles, '--ease-out-quart', 'ease-out')
    const rise = styles.getPropertyValue('--space-2xs').trim() || '8px'

    /*
     * ScrollTrigger measures positions, and every card's cover is parallaxed
     * (`vault/motion/parallax`). Refreshing while a FLIP is mid-flight makes
     * it record a moving box as the resting one, and the plates end up
     * permanently offset from their captions. Killing the tweens is not an
     * option — they belong to a `useGSAP` context this hook does not own — so
     * the triggers are disabled for the duration and refreshed once at the
     * end, against the layout that actually settled.
     *
     * Imported rather than read off `window`: `ScrollTrigger` is already in
     * this module graph, because every `ProjectCard` calls `useParallax`,
     * which imports it. So this costs no bytes a grid consumer was not
     * already paying, and it is typed — the `window` lookup needed an
     * assertion chain the project's own lint rule rejects, correctly.
     */
    const triggers = ScrollTrigger.getAll()
    // `disable(false)` — do not revert. Reverting would return each plate to
    // its untransformed position mid-flight, which is a second, competing
    // animation of the very elements this one is moving.
    for (const trigger of triggers) trigger.disable(false)

    const survivors: { element: HTMLElement; dx: number; dy: number }[] = []
    const entering: HTMLElement[] = []

    /*
     * Cards that left, animated out of a layer of their own.
     *
     * React has already unmounted them by the time this effect runs, so there
     * is nothing left in the tree to fade — but `first` still holds the
     * element references, and a removed node is intact, just detached. They
     * are re-appended to a fixed overlay at the position they held, faded,
     * and dropped.
     *
     * A separate `aria-hidden` overlay rather than the grid itself: putting
     * them back in the `<ul>` would make a screen reader announce a list of
     * eight while two are shown, and would hand React back nodes it has
     * already released. Nothing in here is reachable, focusable, or read.
     */
    const leaving = [...first]
      .filter(([id]) => !current.has(id))
      .map(([, snapshot]) => snapshot)

    let ghosts: HTMLElement | null = null

    if (leaving.length > 0) {
      ghosts = document.createElement('div')
      ghosts.setAttribute('aria-hidden', 'true')
      ghosts.style.cssText =
        'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0'
      document.body.append(ghosts)

      for (const { element, left, top } of leaving) {
        const width = element.offsetWidth
        const height = element.offsetHeight
        element.style.cssText = `position:absolute;margin:0;width:${width}px;height:${height}px;left:${left - window.scrollX}px;top:${top - window.scrollY}px`
        ghosts.append(element)
      }
    }

    for (const [id, position] of current) {
      const before = first.get(id)
      const element = position.element
      if (!before) {
        entering.push(element)
        continue
      }
      const dx = before.left - position.left
      const dy = before.top - position.top
      if (Math.abs(dx) < MOVED_PX && Math.abs(dy) < MOVED_PX) continue
      survivors.push({ element, dx, dy })
    }

    // Rank by distance travelled, furthest first, so the delays invert and
    // the grid arrives as one object rather than as a sequence of rows.
    const ranked = [...survivors].sort(
      (a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy)
    )

    const animations: Animation[] = []

    /*
     * They leave on the same frame the rest start moving, not after it. A
     * grid that waits for the departures to finish before rearranging reads
     * as two events; starting together reads as one — the list changing.
     */
    for (const { element } of leaving) {
      animations.push(
        element.animate(
          [
            { opacity: 1, transform: 'scale(1)' },
            { opacity: 0, transform: 'scale(0.98)' },
          ],
          { duration: exitMs, easing: enterEase, fill: 'forwards' }
        )
      )
    }

    ranked.forEach(({ element, dx, dy }, rank) => {
      animations.push(
        element.animate(
          [
            { transform: `translate3d(${dx}px, ${dy}px, 0)` },
            { transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: moveMs,
            delay: rank * stepMs,
            easing: moveEase,
            fill: 'backwards',
          }
        )
      )
    })

    // The movement's full span, so arrivals land after the rearrangement
    // rather than during it — two things moving at once reads as a reshuffle,
    // not as a result.
    const moveSpan =
      ranked.length > 0 ? moveMs + (ranked.length - 1) * stepMs : 0

    entering.forEach((element, index) => {
      animations.push(
        element.animate(
          [
            { opacity: 0, transform: `translate3d(0, ${rise}, 0)` },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ],
          {
            duration: enterMs,
            // Capped, for the reason Tahap 26 measured: past eight, axe ends
            // up auditing a frame in the middle of a fade and reports
            // contrast against a half-transparent card.
            delay: moveSpan + Math.min(index, MAX_STAGGERED) * stepMs,
            easing: enterEase,
            fill: 'backwards',
          }
        )
      )
    })

    const cleanUpGhosts = () => {
      ghosts?.remove()
      ghosts = null
    }

    if (animations.length === 0) {
      for (const trigger of triggers) trigger.enable()
      cleanUpGhosts()
      return
    }

    let cancelled = false
    // `void`: nothing awaits this, and `allSettled` cannot reject — a
    // cancelled animation settles as rejected *inside* it, which is exactly
    // why `allSettled` is used rather than `all`. The cleanup below is what
    // handles cancellation, not a rejection handler here.
    void Promise.allSettled(
      animations.map((animation) => animation.finished)
    ).then(() => {
      cleanUpGhosts()
      if (cancelled) return
      for (const trigger of triggers) trigger.enable()
      ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      for (const animation of animations) animation.cancel()
      for (const trigger of triggers) trigger.enable()
      cleanUpGhosts()
    }
  }, [ref, signature, prefersReducedMotion])
}
