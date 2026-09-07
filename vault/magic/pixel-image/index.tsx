import cn from 'clsx'
import type { CSSProperties } from 'react'

import s from './pixel-image.module.css'

/**
 * PixelImage — a plate that assembles out of blocks instead of fading in.
 *
 * ## Provenance
 *
 * Technique adapted from **Magic UI**, component `pixel-image`.
 *
 * - Source: `github.com/magicuidesign/magicui`, `registry/magicui/pixel-image.tsx`,
 *   read from `https://magicui.design/r/pixel-image.json` (HTTP 200).
 * - Licence: **MIT**, Copyright (c) Magic UI.
 * - Verified by reading that repository's own `LICENSE.md` (`CLAUDE.md` #18).
 * - **Code copied: no.** The idea is theirs and it is the valuable part; the
 *   implementation here is different in the one way that matters, and the
 *   difference is recorded below and in `vault/magic/README.md`.
 *
 * ## What upstream does, and why the shape had to change
 *
 * Upstream stacks `rows x cols` absolutely-positioned `<div>`s, each holding
 * **its own full copy of the `<img>`** and one static `clip-path` polygon that
 * shows a single cell. Every copy starts at `opacity: 0` and fades in on a
 * random delay. The insight worth taking is that the *clip is static* — only
 * opacity animates — so a mosaic reveal costs nothing that `CLAUDE.md` #4
 * forbids.
 *
 * What could not come with it is the twenty-four copies of the image. Each
 * carries `alt="Pixel image piece N"`, so one photograph arrives in the
 * accessibility tree as twenty-four named images; and with `next/image` each
 * copy is a separate element carrying a separate `srcset`.
 *
 * So this inverts the layer. The real image renders once, normally, with its
 * own `alt` and its own sizing — this component knows nothing about it. What
 * this renders is a **veil of ground-coloured tiles above it**, and the
 * reveal is those tiles going away. Same static clip-path, same
 * opacity-only stagger, same look; one image, one alt, no duplication.
 *
 * ## The other six changes, each of them a hard rule
 *
 * | upstream                            | here                                        |
 * | ----------------------------------- | ------------------------------------------- |
 * | `transition-all`                    | `opacity` alone (#4)                        |
 * | bare `ease-out`                     | `--ease-out-quart` (#2)                     |
 * | `1000` / `1200` / `1300` ms         | `--duration-choreographed`, `--stagger-items` (#3, #8) |
 * | `Math.random()` delays              | a deterministic hash — see `scatter` below  |
 * | `rounded-[2.5rem]`, `h-72 md:h-96`  | none; the caller owns the box (#8)          |
 * | `filter: grayscale` transition      | dropped (#4)                                |
 * | `useEffect` + `setTimeout` on mount | the site's own reveal contract (#5)         |
 *
 * `Math.random()` is worth naming separately because it is not a taste
 * problem. This component renders on the server; a delay drawn from
 * `Math.random()` differs between the server's HTML and the client's first
 * render, which is a hydration mismatch. It has to be a function of the index.
 *
 * ## It is a veil, not content
 *
 * `aria-hidden`, `pointer-events: none`, and the image underneath is complete
 * and correct before a single tile has moved. Under `prefers-reduced-motion`
 * the veil is not rendered at all — there is nothing to strand at
 * `opacity: 1` (`CLAUDE.md` #5).
 */

/**
 * The grids, named by columns x rows so the string reads the way a designer
 * would say it. Upstream's set, minus the ones no page here has a use for.
 */
const GRIDS = {
  '6x4': { cols: 6, rows: 4 },
  '8x8': { cols: 8, rows: 8 },
  '4x6': { cols: 4, rows: 6 },
} as const

export type PixelGrid = keyof typeof GRIDS

/**
 * A tile's place in the dissolve order: deterministic, and scattered enough
 * not to read as a sweep.
 *
 * `Math.imul` with a large odd constant (Knuth's 2654435761) mixes the low
 * bits into the high ones; taking it modulo the tile count spreads the
 * indices without any pattern the eye can follow. Two tiles occasionally
 * share an order, which is fine — the delays are a rhythm, not a sequence.
 *
 * The point is that it depends on nothing but `index` and `total`, so the
 * server and the browser compute the same number and hydration is quiet.
 */
function scatter(index: number, total: number): number {
  return (Math.imul(index + 1, 2654435761) >>> 0) % total
}

interface PixelImageProps {
  /** Tile grid. More tiles is finer and slower; 6x4 is the shipped default. */
  grid?: PixelGrid | undefined
  className?: string | undefined
}

export function PixelImage({ grid = '6x4', className }: PixelImageProps) {
  const { cols, rows } = GRIDS[grid]
  const total = cols * rows

  return (
    <div aria-hidden="true" className={cn(s.veil, className)}>
      {Array.from({ length: total }, (_, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        const x0 = (col * 100) / cols
        const x1 = ((col + 1) * 100) / cols
        const y0 = (row * 100) / rows
        const y1 = ((row + 1) * 100) / rows

        return (
          <span
            // The tiles are a fixed-length, index-addressed grid that never
            // reorders, which is the one case where the index is the identity.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={index}
            className={s.tile}
            /*
             * SAFETY: `CSSProperties` has no index signature for custom
             * properties, so a style object carrying `--pixel-order` cannot
             * be typed without this cast. React passes unknown keys straight
             * to `element.style.setProperty`, which is exactly what a custom
             * property needs; the value is a number this file computed, not
             * anything from the CMS or the caller.
             */
            style={
              {
                /*
                 * Static. It never animates — it is the cell's shape, not its
                 * state — which is what keeps a mosaic reveal inside
                 * `CLAUDE.md` #4.
                 *
                 * A hair of overlap on the far edges would hide the sub-pixel
                 * seams that `clip-path` leaves between neighbours, but it
                 * would also make each tile bleed over the next one's fade
                 * and turn the dissolve muddy. Seams it is.
                 */
                clipPath: `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`,
                '--pixel-order': scatter(index, total),
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
