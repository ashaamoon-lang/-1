'use client'

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { CSSProperties, Ref, ReactNode } from 'react'
import { useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import s from './horizontal.module.css'

/**
 * Horizontal — a run that travels sideways while the page scrolls down.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on GSAP ScrollTrigger (`docs/PROVENANCE.md` §2 on GSAP licensing).
 * Pinning a section and translating a track inside it is public prior art
 * with no single owner; this is an implementation of it, not a copy of one.
 *
 * ## What this movement communicates
 *
 * The `taste-skill` test this project made its touchstone — *what does this
 * motion communicate?*, with only hierarchy, narrative, feedback or state
 * transition as valid answers.
 *
 * The answer here is **narrative**: a body of work is one thing, not a list of
 * separate things, and travelling through it in a single continuous gesture
 * says that in a way a grid cannot. A grid says "here are six items." A run
 * says "here is the work." That is also why it carries the work rather than
 * decoration — a horizontal track of anything else would be the same gesture
 * saying nothing.
 *
 * ## Why it follows `vault/blocks/passage` rather than inventing a pattern
 *
 * `Passage` is the only other pinned moment in this repo, and every convention
 * below is taken from it deliberately. Two pinned mechanisms that smooth at
 * different rates, or clean up differently, read as two systems disagreeing
 * rather than as one site.
 *
 *   - `scrub: 0.5` — the same figure `passage` and `parallax` use.
 *   - `matchMedia` read **as well as** the hook: the hook's server snapshot is
 *     `false`, so the first commit — the one this effect runs in — would see
 *     `false` even for a reader who has the preference on.
 *   - Under reduced motion **no ScrollTrigger is created at all**, so no pin
 *     spacer exists and the page keeps its natural length.
 *   - `pinSpacing: true`, so the footer stays reachable and `End` stays honest.
 *   - `ease: 'none'`: it is scrubbed, so the easing belongs to the reader's
 *     scroll, not to us.
 *
 * ## Reduced motion needs the stylesheet, not just the guard
 *
 * This differs from `Passage` in the one way that matters. A passage with no
 * animation is still readable prose. A *track* with no animation is work the
 * reader can never see — everything past the first screen sits outside the
 * viewport permanently.
 *
 * So `if (reduced) return` is not sufficient here, and the promise is made in
 * CSS: under `@media (--reduced-motion)` the track stops being a track and
 * wraps into rows in the document flow — justified rows, since the fork, each
 * one height with every plate at its own ratio. This is the same contract
 * `vault/motion/use-active-in-sequence` demands of its consumers, and for the
 * same reason.
 *
 * ## Keyboard, and why the viewport cannot scroll itself
 *
 * The failure this avoids: `Tab` to a card that the transform has moved
 * off-screen, and the browser scrolls the nearest scrollable ancestor to
 * reveal it — fighting the transform the pin controls, so the two disagree
 * about where the card is.
 *
 * Two halves fix it, and neither works alone:
 *
 *   1. The viewport is `overflow: clip`, never `auto`. There is no scrollable
 *      ancestor for the browser to move, so it cannot fight.
 *   2. `focusin` maps the focused card back to the page scroll position that
 *      shows it, and moves *that*. One source of truth — the page's own
 *      scroll — with the transform derived from it as it already is.
 *
 * That is also the difference between this and scroll hijacking, which
 * `docs/DIREKSI.md` §4 rejects outright: nothing here intercepts a wheel or a
 * key. The page scrolls exactly as far as the reader asks; what changes is
 * what that scroll is spent on.
 *
 * ## Without JavaScript
 *
 * The same failure as reduced motion, for a different reason: no script, no
 * ScrollTrigger, no travel — and on `/en/work/pusat-beban` two of four plates
 * sat outside the clipped box where nothing could bring them in. So the
 * stylesheet's reduced-motion unwrap is repeated in a `<noscript>` rule
 * (`NOSCRIPT_STYLE`), the idiom `components/ui/command` and
 * `vault/motion/curtain` already use, for the reason `curtain` writes down:
 * `@media (scripting: none)` is not yet universal.
 */

/**
 * The share of the frame the strip's widest plate may take.
 *
 * Exported because the caller writes `sizes` from it: the stylesheet sizes
 * the plates from this number (`--strip-share`), and a `sizes` written from a
 * different one would ask for the wrong pixels. Below one so that at its
 * widest a sliver of each neighbour stays in view — the strip reads as a
 * strip rather than as one picture filling the box.
 */
export const STRIP_SHARE = 0.86

/**
 * The reduced-motion unwrap, for a reader with scripting off.
 *
 * Static and self-authored, with no interpolation — the same terms as the
 * `<noscript>` rules in `components/ui/command` and `vault/motion/curtain`.
 * It targets the markers below rather than the module's hashed class names,
 * which a string written here cannot know.
 */
const NOSCRIPT_STYLE =
  '[data-run-viewport]{display:block!important;block-size:auto!important;padding-block-start:0!important;overflow:visible!important}' +
  '[data-run-track]{flex-wrap:wrap!important;align-items:start!important;inline-size:auto!important;transform:none!important}' +
  '[data-run-item]{flex:var(--item-ratio,1) 1 calc(var(--row-block) * var(--item-ratio,1))!important;inline-size:auto!important;min-inline-size:0!important;max-inline-size:calc(var(--row-cap) * var(--item-ratio,1))!important}'

interface HorizontalProps {
  /**
   * The moment's name. Becomes `data-epic`, which
   * `e2e/interaction-grammar.e2e.ts` reads to name the moments it reports on
   * every run.
   */
  name: string
  /**
   * One entry per item in the run.
   *
   * Taken as an array rather than as `children` so the `<li>`, its width and
   * its `data-run-item` marker are written **here**, once. A caller that had
   * to remember three things to be focusable inside the track would forget
   * one of them, and the one it forgot would be the keyboard contract.
   */
  items: readonly ReactNode[]
  /** Accessible name for the run, since it is a labelled region. */
  label: string
  /**
   * Attaches to the track itself, so a caller can observe the items.
   *
   * The one caller that needs it hands over `useReveal({ perItem: true })`.
   * Every `<li>` below already carries `data-reveal-item`, which is the half
   * of that contract this component owns; the observer is the caller's.
   */
  listRef?: Ref<HTMLUListElement> | undefined
  /**
   * Each item's width ÷ height, in `items` order — a film strip (the fork).
   *
   * Given, the run holds every item at one shared height on desktop and each
   * takes the width its own ratio asks for (`.strip` in the stylesheet).
   * Omitted, every item takes one width, as before. A `null` entry is an item
   * whose shape is unknown; it is laid out as a square.
   *
   * A set in which **no** shape is known stays a run of one width. A strip
   * exists to hold different shapes at one height; with none known it only
   * turned every item into a square at the full height budget — measured in
   * the gallery's `Run` story, 531px plates where one width gives 435, and a
   * fourth plate `gallery-run.e2e.ts` then found still waiting off-frame.
   *
   * Pass the ratio the item's own box is drawn at, or the heights will not
   * agree.
   */
  ratios?: readonly (number | null)[] | undefined
  className?: string | undefined
}

export function Horizontal({
  name,
  items,
  label,
  listRef,
  ratios,
  className,
}: HorizontalProps) {
  const known = ratios?.filter((ratio): ratio is number => ratio !== null)
  const widest = known && known.length > 0 ? Math.max(...known) : null
  const strip = widest !== null
  const root = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const element = root.current
      if (!element) return

      const reduced =
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) return

      gsap.registerPlugin(ScrollTrigger)

      const viewport = element.querySelector<HTMLElement>(`.${s.viewport}`)
      const track = element.querySelector<HTMLElement>(`.${s.track}`)
      if (!viewport || !track) return

      /*
       * How far the track has to travel, in pixels, and therefore how much
       * scroll this moment costs. Reading it as a function means
       * `invalidateOnRefresh` recomputes it on resize instead of pinning a
       * stale number from first paint.
       */
      const travel = () => Math.max(0, track.scrollWidth - viewport.offsetWidth)

      /*
       * Scroll distance equals travel distance, 1:1. A ratio other than one
       * makes the run feel either faster or slower than the reader's own
       * gesture, and both read as the page taking the wheel away.
       */
      const tween = gsap.to(track, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          end: () => `+=${travel()}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })

      /*
       * Focus follows the page, not the container.
       *
       * `progress` is where along the run the focused card sits; converting it
       * back to a document scroll position and setting that keeps the pin in
       * charge. `ScrollTrigger.scroll()` respects whatever scroller is in use,
       * so this stays correct under Lenis.
       */
      const onFocusIn = (event: FocusEvent) => {
        const trigger = tween.scrollTrigger
        if (!trigger) return

        /*
         * SAFETY: the listener is bound to `track`, an `HTMLElement`, so every
         * `focusin` it receives originated on a descendant element — `Element`
         * is the only node type that takes focus. `closest` then narrows
         * further, and the `if (!target)` below is what actually guards the
         * use: anything that is not inside a `[data-run-item]` is ignored
         * rather than assumed.
         */
        const target = (
          event.target as HTMLElement | null
        )?.closest<HTMLElement>('[data-run-item]')
        if (!target) return

        const distance = travel()
        if (distance === 0) return

        const offset = target.offsetLeft + target.offsetWidth / 2
        const centred = offset - viewport.offsetWidth / 2
        const progress = Math.min(1, Math.max(0, centred / distance))

        trigger.scroll(trigger.start + progress * (trigger.end - trigger.start))
      }

      track.addEventListener('focusin', onFocusIn)

      return () => {
        track.removeEventListener('focusin', onFocusIn)
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    },
    { dependencies: [prefersReducedMotion], scope: root }
  )

  return (
    <section
      ref={root}
      data-epic={name}
      aria-label={label}
      className={cn(s.root, strip && s.strip, className)}
      /*
       * SAFETY: `CSSProperties` has no index signature for custom properties.
       * Both values are numbers — a module constant and the largest of the
       * caller's ratios — and React forwards unknown keys to
       * `style.setProperty`, which is what a custom property needs.
       */
      style={
        strip
          ? ({
              '--strip-share': STRIP_SHARE,
              '--run-max-ratio': widest,
            } as CSSProperties)
          : undefined
      }
    >
      <noscript>
        {/* oxlint-disable-next-line react/no-danger -- a static, self-authored string with no interpolation; `style-src` carries 'unsafe-inline' as the documented base policy (lib/integrations/csp.ts), and the rule must reach markup that no script will unwrap */}
        <style dangerouslySetInnerHTML={{ __html: NOSCRIPT_STYLE }} />
      </noscript>
      <div className={s.viewport} data-run-viewport="">
        <ul ref={listRef} className={s.track} data-run-track="">
          {items.map((item, index) => (
            <li
              // The run's order is the content's order and never reorders.
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={s.item}
              /*
               * SAFETY: as on the section — a number from the caller's
               * `ratios`, handed to CSS as a custom property.
               */
              style={
                ratios?.[index] != null
                  ? ({ '--item-ratio': ratios[index] } as CSSProperties)
                  : undefined
              }
              data-run-item=""
              /*
               * Marked here rather than by the caller, because it is half a
               * contract whose other half — `data-run-item` above — is also
               * here. A caller that had to remember one of the two would
               * remember the one that is visible when it is missing.
               */
              data-reveal-item=""
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
