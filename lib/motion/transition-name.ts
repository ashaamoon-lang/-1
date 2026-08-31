/**
 * The name that pairs a work's cover across a navigation.
 *
 * React's `<ViewTransition>` matches elements by `name`: the catalogue card's
 * cover and the project page's hero cover carry the same one, so the browser
 * animates between their positions instead of swapping one for the other.
 *
 * It lives here rather than being written out at each site because the whole
 * mechanism is a string match — a typo on either end produces no error, no
 * warning, and no morph. Nothing would fail; the transition would simply stop
 * happening, which is the least detectable kind of broken.
 *
 * Scoped with a prefix because the name has to be unique within a document:
 * an unprefixed slug could collide with a name given to something else later.
 */
export function transitionName(slug: string): string {
  return `work-cover-${slug}`
}
