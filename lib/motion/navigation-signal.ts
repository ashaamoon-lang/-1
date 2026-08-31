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
 * Announce that a client-side navigation has begun.
 *
 * No `typeof window` guard, and that is a claim about the call sites rather
 * than an oversight: this is only ever reached from `onNavigate` on a link,
 * which is a user gesture. The server renders the handler as a reference and
 * never invokes it.
 */
export function announceNavigation(): void {
  window.dispatchEvent(new CustomEvent(NAVIGATION_START))
}

/**
 * Subscribe to navigation starts. Returns the unsubscribe function, so it
 * drops straight into a `useEffect` — which is also the only place it is
 * called from, and why it needs no environment guard either.
 */
export function subscribeNavigation(listener: () => void): () => void {
  window.addEventListener(NAVIGATION_START, listener)
  return () => window.removeEventListener(NAVIGATION_START, listener)
}
