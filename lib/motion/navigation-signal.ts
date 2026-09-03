'use client'

/**
 * A signal that a client-side navigation has *started*.
 *
 * ## Why this has to exist
 *
 * `vault/motion/page-transition` was built in Phase C and never mounted. Read
 * closely, it could not have worked: it ran its whole cover-then-reveal
 * sequence off a `usePathname()` change, and a pathname change is the moment
 * the **new** route has already committed. The reader would have watched the
 * page they just asked for get progressively covered by an overlay, then
 * uncovered again — 1.2s of hiding the thing they were waiting to see. A
 * transition needs two moments, and React Router-style route events do not
 * exist in the App Router.
 *
 * Next 16 supplies the missing half as `onNavigate` on `<Link>`, which fires
 * only for real client-side navigations — never for a modified click, a
 * new-tab click, or an external href. `components/ui/link` announces through
 * this module; `PageTransition` subscribes. Keeping the two apart means the
 * link component knows nothing about animation and the overlay knows nothing
 * about routing.
 *
 * ## Not a React context
 *
 * A context would force every link into the same provider subtree and make
 * the overlay a parent of the whole app. An event on `window` costs nothing,
 * survives any tree shape, and is inert when no one is listening — which is
 * exactly the state under `prefers-reduced-motion`, where the overlay is not
 * rendered at all.
 */

const NAVIGATION_START = 'arth:navigation-start'

/**
 * How a navigation should be dressed.
 *
 * `cover` is the default: a panel sweeps across and hides the swap, which is
 * right for a link between two unrelated pages.
 *
 * `morph` means the destination shares an element with this page — a work's
 * cover, going from the catalogue card to the project page — and React's
 * `<ViewTransition>` will animate it across. The two are mutually exclusive
 * by construction: a morph is only legible if the reader can *see* both
 * states, and a cover exists precisely to stop them seeing either. Announcing
 * the intent is what lets the overlay stand aside for the handful of
 * navigations that have something better to show.
 */
export type NavigationIntent = 'cover' | 'morph'

/**
 * What started the navigation.
 *
 * `link` is a press on a `<Link>`. `history` is the browser's own back or
 * forward control — which presses no link, fires no `onNavigate`, and is
 * therefore the reason a back navigation ran no transition at all until
 * Tahap 16a.
 *
 * Deliberately not called `back`. `popstate` fires for forward as well, and
 * distinguishing the two means tracking a history index this module has no
 * business owning. The distinction that actually matters for the treatment is
 * link-versus-browser-control, and that is the one measured.
 */
export type NavigationSource = 'link' | 'history'

/** Everything the overlay needs to know about a navigation that just began. */
export interface NavigationStart {
  intent: NavigationIntent
  source: NavigationSource
}

/**
 * Announce that a client-side navigation has begun.
 *
 * No `typeof window` guard, and that is a claim about the call sites rather
 * than an oversight: this is only ever reached from `onNavigate` on a link,
 * which is a user gesture. The server renders the handler as a reference and
 * never invokes it.
 */
export function announceNavigation(
  intent: NavigationIntent = 'cover',
  source: NavigationSource = 'link'
): void {
  window.dispatchEvent(
    new CustomEvent<NavigationStart>(NAVIGATION_START, {
      detail: { intent, source },
    })
  )
}

/**
 * Subscribe to navigation starts. Returns the unsubscribe function, so it
 * drops straight into a `useEffect` — which is also the only place it is
 * called from, and why it needs no environment guard either.
 */
export function subscribeNavigation(
  listener: (start: NavigationStart) => void
): () => void {
  const handler = (event: Event) => {
    // SAFETY: the only dispatcher of this event name is `announceNavigation`
    // above, which always constructs it as a `CustomEvent<NavigationStart>`.
    // The fallback covers a stray same-named event from anywhere else by
    // resolving to the safe, always-correct behaviour: a covered link.
    const custom = event as CustomEvent<NavigationStart>
    listener({
      intent: custom.detail?.intent ?? 'cover',
      source: custom.detail?.source ?? 'link',
    })
  }
  window.addEventListener(NAVIGATION_START, handler)
  return () => window.removeEventListener(NAVIGATION_START, handler)
}
