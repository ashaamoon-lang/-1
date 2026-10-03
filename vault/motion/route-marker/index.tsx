'use client'

/**
 * RouteMarker — the rule under the route you are on, carried to the one you
 * press.
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
 * It slides on a press and at no other time. The first paint, a page brought
 * back by Back, a resize, a face arriving: each puts it where it belongs at
 * once. Each page renders its own header (`components/layout/wrapper`), so a
 * slide on arrival would play under the page transition's panel — which
 * uncovers the top of the screen last — and be seen only as a twitch at its
 * end.
 *
 * ## Where it finds its place
 *
 * In its parent: the item marked `aria-current` there, and the link or button
 * pressed there. So the parent must be positioned, being the rule's
 * containing block, and nothing positioned may sit between it and its links,
 * whose layout offsets are read against it. Layout offsets and not painted
 * boxes, because a pressed link is scaled (`MOTION-SPEC.md` §9, COMMIT) at
 * the moment the click lands.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: `aria-current` on the link says which route is
 * current. Without a script there is no rule, and the link's ink still says
 * it.
 *
 * ## Reduced motion
 *
 * The rule is under the pressed route at once (§9.4 rule 3).
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
  className?: string | undefined
}

/** The item `container` marks as current. */
function currentIn(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    '[aria-current]:not([aria-current="false"])'
  )
}

/**
 * Puts the rule under `target`, or takes it away when there is none.
 *
 * A slide starts only from a place the rule already held: from nothing it
 * appears where it belongs, rather than shooting in from the parent's edge.
 */
function place(
  marker: HTMLElement,
  target: HTMLElement | null,
  slide: boolean
) {
  if (!target) {
    marker.removeAttribute('data-on')
    return
  }
  marker.toggleAttribute('data-moves', slide && marker.hasAttribute('data-on'))
  marker.style.setProperty('--marker-x', `${target.offsetLeft}px`)
  marker.style.setProperty('--marker-width', String(target.offsetWidth))
  marker.setAttribute('data-on', '')
}

export function RouteMarker({ className }: RouteMarkerProps) {
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

    place(marker, currentIn(container), false)

    // The words change width as the face arrives and the viewport scales
    // them.
    const resize = new ResizeObserver(() =>
      place(marker, currentIn(container), false)
    )
    resize.observe(container)

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
      place(marker, pressed, true)
    }
    container.addEventListener('click', onClick)

    return () => {
      resize.disconnect()
      container.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-epic="route-marker"
      className={cn(s.marker, className)}
    />
  )
}
