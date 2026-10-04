'use client'

/**
 * RouteMarker — the rule under the current item of an index, carried to the
 * next one.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## What the motion says
 *
 * A drawing set's index marks the sheet you are holding. The header names the
 * site's three routes and inks the current one, which tells a reader where
 * they are but not that they are leaving. This is one rule under the current
 * route: press another and the rule slides there, taking that word's width,
 * before the page turns — the change of place read as a move along the same
 * index. Only its `transform` changes, in the standard band.
 *
 * ## What moves it
 *
 * `follows` says, because the two indexes it serves change differently.
 *
 * - `press`, the header's: it slides on a press and at no other time. Each
 *   page renders its own header (`components/layout/wrapper`), so its current
 *   route never changes in place, and a slide on arrival would play under the
 *   page transition's panel — which uncovers the top of the screen last — and
 *   be seen only as a twitch at its end.
 * - `current`, a page's own index (`vault/blocks/project-spine`, Tata &
 *   Gerak stage 4): it slides when the current item changes as the page is
 *   read. A press is left to that change; sliding to the pressed row first
 *   would send the rule back through every row the page then scrolls past.
 *
 * Either way the first paint, a page brought back by Back, a resize and a
 * face arriving put it where it belongs at once.
 *
 * ## Where it finds its place
 *
 * In its parent: the item marked `aria-current` there, and in `press`, the
 * link or button pressed there. So the parent must be positioned — it is the
 * rule's containing block, and the item's layout offset is summed up to it.
 * Layout offsets and not painted boxes, because a pressed link is scaled
 * (`MOTION-SPEC.md` §9, COMMIT) at the moment the click lands. A parent that
 * scrolls carries the rule with its rows.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: `aria-current` on the link says which item is
 * current. Without a script there is no rule, and the link's ink still says
 * it.
 *
 * ## Reduced motion
 *
 * The rule is under the new item at once (§9.4 rule 3).
 *
 * @example
 * ```tsx
 * <nav style={{ position: 'relative' }}>
 *   <ul>…links, one with aria-current…</ul>
 *   <RouteMarker />
 * </nav>
 * ```
 */

import cn from 'clsx'
import { useLayoutEffect, useRef } from 'react'

import s from './route-marker.module.css'

interface RouteMarkerProps {
  /** What slides it: a press (the default), or the current item changing. */
  follows?: 'press' | 'current' | undefined
  className?: string | undefined
}

/** The item `container` marks as current. */
function currentIn(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    '[aria-current]:not([aria-current="false"])'
  )
}

/** How far `target` starts from `container`'s start edge, in layout. */
function offsetWithin(target: HTMLElement, container: HTMLElement) {
  let x = 0
  for (
    let node: Element | null = target;
    node instanceof HTMLElement && node !== container;
    node = node.offsetParent
  ) {
    x += node.offsetLeft
  }
  return x
}

/**
 * Puts the rule under `target`, or takes it away when there is none.
 *
 * A slide starts only from a place the rule already held: from nothing it
 * appears where it belongs, rather than shooting in from the parent's edge.
 */
function place(
  marker: HTMLElement,
  container: HTMLElement,
  target: HTMLElement | null,
  slide: boolean
) {
  if (!target) {
    marker.removeAttribute('data-on')
    return
  }
  marker.toggleAttribute('data-moves', slide && marker.hasAttribute('data-on'))
  marker.style.setProperty('--marker-x', `${offsetWithin(target, container)}px`)
  marker.style.setProperty('--marker-width', String(target.offsetWidth))
  marker.setAttribute('data-on', '')
}

export function RouteMarker({
  follows = 'press',
  className,
}: RouteMarkerProps) {
  const ref = useRef<HTMLSpanElement>(null)

  /*
   * A layout effect, so the rule is in place before the first paint — on a
   * page brought back by Back too, whose rule still stands where the press
   * that left it put it.
   */
  useLayoutEffect(() => {
    const marker = ref.current
    const container = marker?.parentElement
    if (!marker || !container) return

    const settle = () => place(marker, container, currentIn(container), false)
    settle()

    /*
     * The words change width as the face arrives and the viewport scales
     * them — watched on what the parent holds as well as on the parent, since
     * a row that scrolls can widen inside a box that does not.
     */
    const resize = new ResizeObserver(settle)
    resize.observe(container)
    for (const child of container.children) {
      if (child !== marker) resize.observe(child)
    }

    if (follows === 'current') {
      const changes = new MutationObserver(() =>
        place(marker, container, currentIn(container), true)
      )
      changes.observe(container, {
        subtree: true,
        attributeFilter: ['aria-current'],
      })
      return () => {
        resize.disconnect()
        changes.disconnect()
      }
    }

    const onClick = (event: MouseEvent) => {
      // A modified click opens a new tab and leaves the reader here.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const target = event.target
      if (!(target instanceof Element)) return
      const pressed = target.closest<HTMLElement>('a[href], button')
      if (!pressed || !container.contains(pressed)) return
      if (pressed.getAttribute('target') === '_blank') return
      place(marker, container, pressed, true)
    }
    container.addEventListener('click', onClick)

    return () => {
      resize.disconnect()
      container.removeEventListener('click', onClick)
    }
  }, [follows])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-epic="route-marker"
      className={cn(s.marker, className)}
    />
  )
}
