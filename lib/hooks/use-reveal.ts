'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Reveal-on-scroll primitive.
 *
 * Attaches an IntersectionObserver to the returned ref and flips a
 * `data-reveal` attribute (`"hidden"` → `"visible"`) when the element enters
 * the viewport. The actual animation lives in CSS — animate `transform` and
 * `opacity` on `[data-reveal-item]` children so it runs on the compositor
 * thread, unaffected by main-thread work during hydration. This is the
 * off-main-thread alternative to driving entrance animations with GSAP.
 *
 * Children that should stagger carry `data-reveal-item`; the hook sets a
 * `--reveal-index` custom property on each so CSS can derive a
 * `transition-delay`. The visual treatment (distance, axis, duration, easing)
 * stays in the component's CSS module — this hook only owns the mechanism.
 *
 * Degrades gracefully: with JS disabled the `data-reveal` attribute is never
 * set, so the CSS hidden state (scoped under `[data-reveal]`) never applies and
 * content renders visible. Under `prefers-reduced-motion` the element is
 * revealed immediately and the observer is skipped.
 *
 * The reveal CSS contract lives once, globally, in `lib/styles/css/global.css`;
 * per-section knobs are set on the container in its own CSS module:
 * `--reveal-transform` (hidden offset), `--reveal-stagger`, `--reveal-duration`.
 *
 * @example
 * ```tsx
 * const ref = useReveal<HTMLDivElement>()
 * return (
 *   <div ref={ref} className={s.grid}>
 *     {items.map((item) => (
 *       <div key={item.id} data-reveal-item className={s.card}>{item.name}</div>
 *     ))}
 *   </div>
 * )
 * ```
 *
 * ```css
 * .grid {
 *   --reveal-transform: translateY(32px);
 *   --reveal-stagger: 120ms;
 * }
 * ```
 */

// Layout effect on the client (avoids a hidden→visible flash for elements
// already in view on mount), plain effect on the server (no-op, no SSR warning).
const useIsomorphicLayoutEffect =
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
  typeof window === 'undefined' ? useEffect : useLayoutEffect

interface UseRevealOptions {
  /** IntersectionObserver threshold (0–1). Default 0. */
  threshold?: number
  /**
   * IntersectionObserver rootMargin. The default bottom inset of -25% mirrors
   * a GSAP ScrollTrigger `start: 'top 75%'` — reveal once the element is a
   * quarter into the viewport.
   */
  rootMargin?: string
  /** Reveal only once, then disconnect. Default true. */
  once?: boolean
  /**
   * Observe each `[data-reveal-item]` on its own instead of the container.
   *
   * The default is one event for the whole block: the container crosses the
   * line, and every item inside it arrives on the staggered clock. That is
   * right for a masthead — three lines that are one thought — and wrong for a
   * long list, where it spends the page's entire animation budget in the
   * first screen.
   *
   * Measured in Tahap 54: `/en/work` is **five screens** and had **two**
   * reveal blocks, both crossing the line inside the first one. Four screens
   * of catalogue then scrolled past with nothing happening at all.
   *
   * In this mode the container stays `hidden` (so the base rule still hides
   * what has not arrived) and each item flips its own
   * `data-reveal-item="visible"`. `--reveal-index` becomes the item's index
   * **within its row**, so a row of three still staggers and the next row
   * staggers again when the reader reaches it.
   */
  perItem?: boolean
}

export function useReveal<T extends HTMLElement = HTMLElement>({
  threshold = 0,
  rootMargin = '0px 0px -25% 0px',
  once = true,
  perItem = false,
}: UseRevealOptions = {}) {
  const ref = useRef<T>(null)

  useIsomorphicLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const items = element.querySelectorAll<HTMLElement>('[data-reveal-item]')

    if (perItem) {
      /*
       * Index within the row, not within the block.
       *
       * Each item arrives on its own here, so a block-wide index would make
       * the sixth card wait five steps after crossing the line — a delay with
       * nothing behind it. Bucketing by `offsetTop` keeps the stagger where it
       * still means something: the cards that arrive together.
       */
      let row = -1
      let index = 0
      for (const item of items) {
        if (item.offsetTop !== row) {
          row = item.offsetTop
          index = 0
        }
        item.style.setProperty('--reveal-index', String(index))
        index += 1
      }
    } else {
      // Index staggered children so CSS can offset each via transition-delay.
      items.forEach((item, index) => {
        item.style.setProperty('--reveal-index', String(index))
      })
    }

    // Respect reduced motion: reveal immediately, never observe.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.dataset.reveal = 'visible'
      return
    }

    /*
     * The observer is built **before** the hidden state is committed.
     *
     * `[data-reveal] [data-reveal-item] { opacity: 0 }` (global.css) is live
     * the instant this attribute lands, and only the callback below ever
     * clears it. So a constructor that throws — an old engine, a hardened
     * runtime — used to leave the whole block invisible with nothing left to
     * reveal it. `CLAUDE.md` #5: content must end fully visible, never
     * stranded because an animation was skipped.
     */
    let observer: IntersectionObserver

    /*
     * The safety net, and it is geometry rather than a timer.
     *
     * `rootMargin`'s -25% bottom inset means the root is the viewport shrunk
     * from below, so a block can sit **on screen and still not intersect**.
     * On a page too short to scroll it never will, and the reader is left
     * looking at the space where the content is.
     *
     * `entry.rootBounds` is the observer's own root, margins already applied,
     * so this asks the exact question rather than re-deriving 75% from the
     * option string: at maximum scroll, is the element's top still past the
     * root's bottom edge? If it is, no amount of scrolling reveals it, and
     * the block is shown now.
     */
    const unreachable = (entry: IntersectionObserverEntry) => {
      const root = entry.rootBounds
      if (!root) return false
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      )
      return entry.boundingClientRect.top - maxScroll >= root.bottom
    }

    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            /*
             * In per-item mode the *item* carries the state and the container
             * stays hidden, so the base rule keeps hiding whatever has not
             * arrived. `once` then unobserves that one item rather than
             * tearing down the whole observer — the others have not arrived.
             */
            // SAFETY: in per-item mode the observer is only ever handed
            // elements from `element.querySelectorAll<HTMLElement>` above and
            // from the mutation observer below, which filters on
            // `instanceof HTMLElement`. Nothing else can reach this callback.
            const target = perItem ? (entry.target as HTMLElement) : element
            const key = perItem ? 'revealItem' : 'reveal'

            if (entry.isIntersecting || unreachable(entry)) {
              target.dataset[key] = 'visible'
              if (once) {
                if (perItem) observer.unobserve(entry.target)
                else observer.disconnect()
              }
            } else if (!once) {
              target.dataset[key] = perItem ? '' : 'hidden'
            }
          }
        },
        { threshold, rootMargin }
      )
    } catch {
      // No observer, so no reveal — and a block nobody can reveal is a block
      // that must never have been hidden.
      element.dataset.reveal = 'visible'
      return
    }

    element.dataset.reveal = 'hidden'

    if (!perItem) {
      observer.observe(element)
      return () => observer.disconnect()
    }

    for (const item of items) observer.observe(item)

    /*
     * Items that arrive after mount get observed too.
     *
     * Without this, per-item mode has a trapdoor: a list that re-renders —
     * `/work` under its practice filter is the one that does — replaces its
     * `<li>`s, and the new ones were never handed to the observer. They would
     * sit at `opacity: 0` for good, which is the `CLAUDE.md` #5 failure this
     * hook was just taught to avoid.
     *
     * Container mode has no such hole: the container is already `visible`, so
     * children inherit it whenever they appear.
     */
    const added = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          const fresh = node.matches('[data-reveal-item]')
            ? [node]
            : [...node.querySelectorAll<HTMLElement>('[data-reveal-item]')]
          for (const item of fresh) observer.observe(item)
        }
      }
    })
    added.observe(element, { childList: true, subtree: true })

    return () => {
      added.disconnect()
      observer.disconnect()
    }
  }, [threshold, rootMargin, once, perItem])

  return ref
}
