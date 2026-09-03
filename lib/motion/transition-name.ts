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
 *
 * ## The prefix says `morph`, and it used to say `work-cover`
 *
 * When this was written there was one pair on the site — a work's cover
 * travelling from the catalogue card to its detail page — and the prefix
 * described it exactly. Tahap 15 added a second pair that is not a cover and
 * not a work: a practice's *name*, travelling from the home page's disclosure
 * to that practice's own page. `work-cover-practice-consulting` is a string
 * that describes none of those three things.
 *
 * A name that lies about what it holds is the defect Tahap 13 renamed three
 * schema fields to remove — a field called `medium` holding "Retainer, six
 * months" never failed a gate and was wrong every time it was read. Same
 * class, smaller blast radius, fixed for the same reason.
 *
 * Renaming is safe precisely because both ends of every pair compose this
 * helper rather than typing the string out: the two sides cannot disagree.
 */
export function transitionName(slug: string): string {
  return `morph-${slug}`
}
