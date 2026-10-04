/**
 * CropMarks — the trim marks of a print sheet, set at a plate's corners while
 * the work is in hand.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## What the motion says
 *
 * A sheet that leaves a press carries crop marks: two short lines at each
 * corner, outside the picture, that show where it will be cut. The site's
 * covers sit in a grid like plates on a sheet, and hovering one already
 * enlarges its image a little inside its frame. This marks the frame itself:
 * the four corners close in on the plate, one after another round the sheet,
 * and the work reads as the one being cut out from the rest — the one about
 * to be taken. Only `transform` and `opacity` change, in the fast band; the
 * marks leave at once, faster than they came.
 *
 * ## How it is placed
 *
 * In a positioned box that shares the plate's edges, beside the plate rather
 * than inside it: a plate clips what it holds, and the card's plate is also
 * what a view transition photographs, which must not carry the marks to the
 * next page. The lines stay outside the plate by a fifth of a gutter and
 * reach a little further, so they end inside the grid's gutter and above a
 * card's caption.
 *
 * Shown while the link or button the marks sit in is hovered or holds the
 * keyboard focus — CSS alone, so it needs no script.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the link it sits in names the work.
 *
 * ## Reduced motion
 *
 * The marks are there at once, and gone at once (§9.4 rule 3).
 *
 * @example
 * ```tsx
 * <a href="/work/…">
 *   <div style={{ position: 'relative' }}>
 *     <div className="plate">…</div>
 *     <CropMarks />
 *   </div>
 * </a>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './crop-marks.module.css'

/** Round the sheet, from the top left, in the order the marks arrive. */
const CORNERS = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
] as const

interface CropMarksProps {
  className?: string | undefined
}

export function CropMarks({ className }: CropMarksProps) {
  return (
    <span
      aria-hidden="true"
      data-epic="card-crop"
      className={cn(s.marks, className)}
    >
      {CORNERS.map((corner, index) => (
        <span
          key={corner}
          className={s.corner}
          data-corner={corner}
          /*
           * Where it falls in the round, for the stylesheet's stagger. A
           * custom property, which React's `CSSProperties` does not list.
           */
          style={{ '--corner': index } as CSSProperties}
        />
      ))}
    </span>
  )
}
