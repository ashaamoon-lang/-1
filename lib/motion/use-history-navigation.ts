'use client'

/**
 * Announces the navigations that no link starts.
 *
 * ## Why this exists
 *
 * `lib/motion/navigation-signal.ts` is fed from exactly one place:
 * `onNavigate` on a `<Link>`. That covers every navigation a reader begins by
 * pressing something on the page, and none of the ones they begin with the
 * browser's own back and forward controls.
 *
 * Measured in Tahap 16 before this existed: a link ran a transition, and a
 * back press ran **nothing at all** — zero pseudo-elements, the overlay never
 * leaving `idle`. Nobody decided that; it was the shape of the wiring. The
 * reader got choreography going one way and a jump-cut coming back.
 *
 * ## Why the Navigation API and not `popstate`
 *
 * The first version listened for `popstate` and compared
 * `window.location.pathname` against the path it had last seen. It never
 * announced anything, and the reason is worth keeping: **by the time a
 * `popstate` listener registered here runs, Next has already updated the URL
 * and React has already re-rendered with the new pathname.** Measured, with
 * the handler reporting its own comparison:
 *
 *     POP DEBUG: /en/practice/consulting vs /en/practice/consulting
 *
 * Both sides were the destination. Any comparison of "where we are" against
 * "where we were" loses that race, however the second value is kept, because
 * the router's own listener is registered first and commits before ours is
 * called.
 *
 * `navigation`'s `navigate` event fires **before** the commit — measured at
 * 23ms against `popstate`'s 37ms — and carries the two facts this needs as
 * data rather than inference:
 *
 * | Reader action                | `navigationType` | `hashChange` |
 * | ---------------------------- | ---------------- | ------------ |
 * | pressing a `<Link>`          | `push`           | `false`      |
 * | pressing `#work`             | `push`           | `true`       |
 * | back / forward between pages | `traverse`       | `false`      |
 * | back over a hash press       | `traverse`       | `true`       |
 *
 * So the condition is `traverse && !hashChange`, and the hash case — this
 * stage's predicted failure, `docs/stages/TAHAP-16.md` §10.1 — is excluded by
 * a flag the platform sets rather than by a heuristic of ours. Each traverse
 * is followed by a `replace` of Next's own, which is ignored for the same
 * reason: it is not a reader's navigation.
 *
 * `e2e/journey.e2e.ts` presses `#work` and requires the overlay to stay
 * `idle`. That test went red against the earlier unguarded version — overlay
 * states `idle, covering` — which is why the guard is measured rather than
 * assumed.
 *
 * ## Where the API is absent
 *
 * Nothing is announced and a history navigation stays the instant cut it is
 * today. That is a deliberate floor rather than a polyfill: the alternative
 * is inferring intent from `popstate`, which the measurement above shows
 * cannot be done correctly from here.
 */

import { useEffect } from 'react'

import { announceNavigation } from './navigation-signal'

/**
 * The slice of the Navigation API this needs.
 *
 * Hand-written because `lib.dom` does not yet declare `window.navigation`,
 * and because narrowing it here documents exactly which two fields the
 * behaviour depends on.
 */
interface NavigateEventLike extends Event {
  navigationType: 'push' | 'replace' | 'reload' | 'traverse'
  hashChange: boolean
}

interface NavigationLike {
  addEventListener(
    type: 'navigate',
    listener: (event: NavigateEventLike) => void
  ): void
  removeEventListener(
    type: 'navigate',
    listener: (event: NavigateEventLike) => void
  ): void
}

function getNavigation(): NavigationLike | undefined {
  // SAFETY: `navigation` is present on Chromium and absent from the DOM lib
  // types; the caller treats the result as possibly undefined and does
  // nothing at all when it is.
  return (window as Window & { navigation?: NavigationLike }).navigation
}

export function useHistoryNavigation(): void {
  useEffect(() => {
    const navigation = getNavigation()
    if (!navigation) return

    const onNavigate = (event: NavigateEventLike) => {
      // Only the reader's own back and forward, and only when they change the
      // page rather than the fragment. Observation only — nothing here calls
      // `intercept()` or `preventDefault()`, so the router's handling of the
      // same event is untouched.
      if (event.navigationType !== 'traverse' || event.hashChange) return
      announceNavigation('cover', 'history')
    }

    navigation.addEventListener('navigate', onNavigate)
    return () => navigation.removeEventListener('navigate', onNavigate)
  }, [])
}
