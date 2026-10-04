'use client'

/**
 * CoverPreview — the cover of the work in hand, carried along the frame.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## What the motion says
 *
 * The catalogue's frame (`vault/blocks/catalogue-frame`) reads the work as a
 * table of names — practice by year — with two hairlines aimed at the work in
 * hand. A name is not a picture, and the covers are a screen above. This is a
 * small plate that holds the cover of the work in hand and glides with the
 * reader from bay to bay, its picture changing as it travels, so the eye
 * stays on the table instead of going back up to the grid.
 *
 * It is anchored to the work and not to the pointer. The crosshair already
 * aims at the work; a second thing chasing the cursor would pull the eye off
 * it. So the keyboard and the pointer get the same plate in the same place.
 * Only its `transform` and `opacity` change, in the crosshair's fast band.
 *
 * ## What it holds
 *
 * The covers are the caller's: one `PreviewCover` per work, named by the
 * work's id, and `current` says which one is shown. Rendering them is the
 * caller's decision too — the frame renders them once the reader first
 * reaches for a work, so a reader who never does downloads nothing.
 *
 * ## Reading it
 *
 * `aria-hidden` decoration: the work's link already names it, and a cover
 * described as well would be read twice. Hidden where nothing can hover — a
 * tap on a phone opens the work.
 *
 * ## Reduced motion
 *
 * The plate is at the work at once, and the covers change at once (§9.4
 * rule 3).
 *
 * @example
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   …the table…
 *   <CoverPreview on x={240} y={32} width={128} current="arus-balik">
 *     <PreviewCover id="arus-balik">…image…</PreviewCover>
 *   </CoverPreview>
 * </div>
 * ```
 */

import cn from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import { createContext, use } from 'react'

import s from './cover-preview.module.css'

/** The id of the cover on show, for each `PreviewCover` to compare with. */
const Current = createContext<string | null>(null)

interface CoverPreviewProps {
  /** Whether a work is in hand and there is room beside it. */
  on: boolean
  /** The plate's left edge, in pixels from its container's. */
  x: number
  /** The plate's top edge, in pixels from its container's. */
  y: number
  /** The plate's width in pixels; its height follows the covers' 4:5. */
  width: number
  /** Which cover to show — a `PreviewCover`'s `id`. */
  current: string | null
  /** One `PreviewCover` per work, or nothing yet. */
  children: ReactNode
  className?: string | undefined
}

export function CoverPreview({
  on,
  x,
  y,
  width,
  current,
  children,
  className,
}: CoverPreviewProps) {
  /*
   * The place reaches the stylesheet as custom properties, which React's
   * `CSSProperties` does not list — the same widening `Crosshair` gives its
   * point.
   */
  const style = {
    '--preview-x': `${x}px`,
    '--preview-y': `${y}px`,
    '--preview-width': `${width}px`,
  } as CSSProperties

  return (
    <span
      aria-hidden="true"
      data-epic="cover-preview"
      className={cn(s.preview, className)}
      style={style}
      {...(on && { 'data-on': '' })}
    >
      <Current value={current}>{children}</Current>
    </span>
  )
}

interface PreviewCoverProps {
  /** The work this cover belongs to — what `CoverPreview`'s `current` names. */
  id: string
  /** The cover itself, an image that fills the plate. */
  children: ReactNode
}

/** One work's cover in the plate, shown while it is the work in hand. */
export function PreviewCover({ id, children }: PreviewCoverProps) {
  const current = use(Current)

  return (
    <span className={s.cover} {...(id === current && { 'data-shown': '' })}>
      {children}
    </span>
  )
}
