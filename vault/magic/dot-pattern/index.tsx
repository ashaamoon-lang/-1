import cn from 'clsx'
import { useId } from 'react'

import s from './dot-pattern.module.css'

/**
 * DotPattern — a quieter ground than the grid, for reading surfaces.
 *
 * ## Provenance
 *
 * - Technique from **Magic UI** `grid-pattern` (the `<pattern>` tiling).
 * - Parameters from **Magic UI** `dot-pattern` (spacing, dot offset, radius).
 * - Source: `github.com/magicuidesign/magicui`
 * - Licence: **MIT**, Copyright (c) Magic UI — verified by reading that
 *   repository's own `LICENSE.md` (`CLAUDE.md` #18).
 * - **Code copied: no.** This file is original. It is logged this way on
 *   purpose: what MIT requires depends on whether bytes were copied, so
 *   "adapted from" would be a provenance record nobody can act on.
 *
 * ## Why upstream's implementation was not used
 *
 * `registry/magicui/dot-pattern.tsx` renders **one `<circle>` element per
 * dot**, computed in JavaScript from `getBoundingClientRect()`, behind a
 * `resize` listener, each wrapped in `motion.circle`. At 1440x900 with the
 * default 16px spacing that is **5,130 SVG nodes**, a client component, a
 * layout read on every resize, and a dependency this project does not have
 * (`motion` runs a scheduler of its own — `CLAUDE.md` #6).
 *
 * Its sibling in the same repository already solves this correctly: one
 * `<pattern>`, one shape, and the browser tiles it. So the dots take the
 * sibling's technique. This renders on the server, ships no JavaScript, has
 * no listener, and is two SVG elements at any viewport.
 *
 * The registry also mislabels it — `dot-pattern`'s `dependencies` array omits
 * `motion` while its source imports it. That is why `vault/magic/README.md`
 * says to read the source rather than the metadata.
 *
 * ## Where it is used
 *
 * Reading surfaces — `/practice/<value>` and `/journal`. A grid asserts
 * structure, which is right where the subject *is* structure; dots only say
 * "this is a surface", which is what prose wants behind it.
 *
 * ## It is ground, not content
 *
 * `aria-hidden` and `pointer-events: none`. Nothing may be said only here.
 */

interface DotPatternProps {
  /** Horizontal spacing between dots, in px. */
  width?: number | undefined
  /** Vertical spacing between dots, in px. */
  height?: number | undefined
  /** Origin of the tiling, in px. */
  x?: number | undefined
  y?: number | undefined
  /** Position of the dot inside its tile, in px. */
  cx?: number | undefined
  cy?: number | undefined
  /** Dot radius, in px. */
  cr?: number | undefined
  className?: string | undefined
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
}: DotPatternProps) {
  // Two patterns on one page must not share an id, and an id that differed
  // between server and client renders would break hydration.
  const id = useId()

  return (
    <svg aria-hidden="true" className={cn(s.pattern, className)}>
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  )
}
