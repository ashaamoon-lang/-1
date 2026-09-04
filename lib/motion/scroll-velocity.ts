/**
 * The reader's scroll velocity, shared between the stylesheet and the GPU.
 *
 * `components/layout/lenis` publishes it once per frame — as a CSS custom
 * property for anything that styles itself, and here for anything that cannot
 * read CSS. A shader is the second kind: `lib/webgl/components/postprocessing`
 * needs the number as a uniform, and `getComputedStyle` every frame to fetch a
 * value the same frame already computed would be a read-back for nothing.
 *
 * A plain mutable holder rather than a store: there is exactly one writer, the
 * readers want the value at the moment they draw rather than when it changes,
 * and a subscription that fires sixty times a second is a subscription doing
 * the opposite of its job.
 *
 * Normalised to roughly -1..1, positive downward. Zero means still — and the
 * effects that read it are written so that zero means *nothing happens at
 * all*, which is what lets them sit on a page of artwork without touching it.
 */
export const scrollVelocity = { current: 0 }
