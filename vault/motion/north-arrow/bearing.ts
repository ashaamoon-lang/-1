/**
 * The geometry the north arrow turns by — pure, so it is testable without a
 * page.
 *
 * Provenance: original work for this project. No third-party code copied.
 */

export interface Point {
  x: number
  y: number
}

/** The centre of a box, as `getBoundingClientRect()` reports one. */
export function centre(box: {
  left: number
  top: number
  width: number
  height: number
}): Point {
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

/**
 * Radians clockwise from north (up the screen) from one point to another — the
 * bearing a surveyor would read, so 0 is up and a quarter turn is right.
 */
export function bearingTo(from: Point, to: Point): number {
  return Math.atan2(to.x - from.x, from.y - to.y)
}

/**
 * The same direction as `next`, a whole number of turns away from it, chosen
 * to be within half a turn of `previous` — so a needle never spins the long
 * way round to point a few degrees further on.
 */
export function nearestTurn(previous: number, next: number): number {
  const turn = 2 * Math.PI
  return next + turn * Math.round((previous - next) / turn)
}
