import cn from 'clsx'
import { useId } from 'react'

import s from './grid-pattern.module.css'

/**
 * GridPattern — the studio's own column logic, made visible.
 *
 * ## Provenance
 *
 * Adapted from **Magic UI**, component `grid-pattern`.
 *
 * - Source: `github.com/magicuidesign/magicui`, `registry/magicui/grid-pattern.tsx`
 * - Licence: **MIT**, Copyright (c) Magic UI
 * - Verified by reading that repository's own `LICENSE.md` (`CLAUDE.md` #18 —
 *   never a badge, never an article). Note that `LICENSE` without an
 *   extension returns 404 there; `LICENSE.md` is the file.
 * - **Code copied: yes** — the `<pattern>` structure, the `d` path, and the
 *   `squares` overlay. Presentation is entirely this project's.
 *
 * See `vault/magic/README.md` and `docs/PROVENANCE.md` §Magic UI.
 *
 * ## What was changed, and why it had to be
 *
 * Upstream paints with `fill-gray-400/30 stroke-gray-400/30`. Those classes do
 * not exist here: `lib/styles/css/tailwind.css` resets `--color-*` to
 * `initial`, so Tailwind's default palette is gone and the component would
 * render with no colour at all. Both now come from `--line`, the derived
 * hairline token (`global.css`: 14% ink into transparent) that every rule and
 * divider on this site already uses. It is theme-aware and already carries a
 * contrast decision, which a grey literal would not.
 *
 * ## Why one `<pattern>` rather than a loop
 *
 * The `d` path is an L — down the left edge of the tile, then along its top.
 * Tiled by `patternUnits="userSpaceOnUse"`, those two strokes meet their
 * neighbours and the full grid appears. Two line segments draw an arbitrarily
 * large grid, and the browser does the tiling.
 *
 * That is worth stating because the sibling component upstream, `dot-pattern`,
 * solves the same problem by rendering one element per cell from JavaScript —
 * 5,130 nodes at 1440x900. `vault/magic/dot-pattern` in this repository is
 * this technique applied to dots instead.
 *
 * ## It is ground, not content
 *
 * `aria-hidden` and `pointer-events: none`, and it must never be the only
 * place something is said. That is the rule `e2e/exploratory-layer.e2e.ts`
 * already holds for the cursor's payload, and it applies to every layer that
 * exists to be looked past.
 */

interface GridPatternProps {
  /** Tile width in px. The visual column rhythm, not the layout grid. */
  width?: number | undefined
  /** Tile height in px. */
  height?: number | undefined
  /** Tile origin. `-1` hides the pattern's own outer edge off-canvas. */
  x?: number | undefined
  y?: number | undefined
  /** SVG dash pattern for the tile stroke. `'0'` is a solid line. */
  strokeDasharray?: string | undefined
  /**
   * Cells to fill, as `[column, row]` tile coordinates.
   *
   * This is what makes the pattern able to say something rather than only
   * sit there — `arth-passage` uses it to light the cells a work is about to
   * land in. Filled cells are still decoration: the work itself is in the
   * DOM either way.
   */
  squares?: [x: number, y: number][] | undefined
  className?: string | undefined
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = '0',
  squares,
  className,
}: GridPatternProps) {
  // `useId` and not a module-level counter: two grids on one page must not
  // share a `<pattern>` id, and an id that differs between server and client
  // renders would break hydration.
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
          {/* The L: down the left edge, then along the top. Offset by half a
              pixel so a 1px stroke lands on the pixel rather than across two. */}
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares && (
        <svg x={x} y={y} className={s.squares}>
          {squares.map(([column, row]) => (
            <rect
              key={`${column}-${row}`}
              strokeWidth="0"
              width={width - 1}
              height={height - 1}
              x={column * width + 1}
              y={row * height + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  )
}
