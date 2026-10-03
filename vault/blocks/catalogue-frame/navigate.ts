/**
 * Where an arrow key moves focus in the catalogue's frame — pure, so the
 * stepping is testable without a table.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The frame is a grid of bays — one per practice and year — and a bay holds
 * any number of works, often none. An arrow key moves the way the eye reads
 * the drawing: left and right along the practice's row to the nearest bay
 * that holds a work, up and down through the works stacked in a bay and then
 * on to the nearest bay in the same year. An empty bay is passed over, never
 * landed in; at the edge of the frame the key does nothing.
 */

export interface Place {
  row: number
  column: number
  /** Which work in the bay, from the top. */
  item: number
}

export type Step = 'left' | 'right' | 'up' | 'down'

/** How many works each bay holds: `counts[row][column]`. */
export type Counts = readonly (readonly number[])[]

function countAt(counts: Counts, row: number, column: number): number {
  return counts[row]?.[column] ?? 0
}

export function step(counts: Counts, at: Place, direction: Step): Place | null {
  if (direction === 'left' || direction === 'right') {
    const by = direction === 'right' ? 1 : -1
    const width = counts[at.row]?.length ?? 0
    for (
      let column = at.column + by;
      column >= 0 && column < width;
      column += by
    ) {
      if (countAt(counts, at.row, column) > 0)
        return { row: at.row, column, item: 0 }
    }
    return null
  }

  const by = direction === 'down' ? 1 : -1
  const inBay = at.item + by
  if (inBay >= 0 && inBay < countAt(counts, at.row, at.column)) {
    return { ...at, item: inBay }
  }
  for (let row = at.row + by; row >= 0 && row < counts.length; row += by) {
    const held = countAt(counts, row, at.column)
    if (held > 0) {
      return {
        row,
        column: at.column,
        item: direction === 'down' ? 0 : held - 1,
      }
    }
  }
  return null
}
