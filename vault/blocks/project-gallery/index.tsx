'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import type { ComponentType } from 'react'
import { useCallback, useRef, useState } from 'react'

import type { LightboxProps } from '@/components/ui/lightbox'
import { SanityImage } from '@/components/ui/sanity-image'
import { useReveal } from '@/lib/hooks/use-reveal'
import {
  aspectRatioFor,
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { ratioStyle, trackImageSizes } from '@/lib/utils/image-sizes'
import { useParallax } from '@/vault/motion/parallax'

import s from './project-gallery.module.css'

/**
 * ProjectGallery — the images of one commissioned work.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## The lightbox, and where this file said it would live
 *
 * This paragraph used to be titled "No lightbox, deliberately" and argued
 * that a modal dialog is a component in its own right rather than a detail of
 * a gallery. That argument still holds, and it is why the dialog is **not**
 * in this file: it closed by naming where one would belong if it were ever
 * added — `components/ui/`, beside the other Base UI dialogs — and Tahap 31
 * built it exactly there.
 *
 * What lives here is the trigger and the index. Each figure is a real button
 * that opens the lightbox **at its own image**, and the index is owned here
 * rather than inside the dialog so that closing and reopening does not lose
 * the reader's place.
 *
 * The dialog is imported on first open, not with the page: the project route
 * measured 878KB against a 900KB ceiling, and `components/ui/lightbox`
 * records what that constraint decided.
 *
 * ## Two widths, chosen by the picture's own shape
 *
 * A column of identical full-width images reads as a contact sheet, so there
 * are two spans — and which one an image gets is derived from the asset (see
 * `isFullWidth`), never from an editor's choice, so reordering the gallery in
 * the Studio reflows it rather than breaking it.
 *
 * ## Accessibility
 *
 * Each image carries its own localized `alt` from the CMS, which the schema
 * marks required. The list is a `<ul>` so a screen reader announces how many
 * images there are before walking them.
 */
export interface GalleryImage extends ImageSource {
  _key: string
  /** Localized by GROQ (`gallery[].alt`), required by the schema. */
  alt?: string | null | undefined
}

/**
 * Whether an image of this shape spans the full grid.
 *
 * Landscape and square take the full width; portrait takes half. That is the
 * only rule, and it replaces a positional one (every third image, plus a
 * clause for a trailing odd half).
 *
 * ## Why position was the wrong authority
 *
 * The old rule chose the *track*, but the box did not fill its track: the
 * container capped height at 78svh and let width follow the ratio, so what a
 * reader actually saw was the asset's proportions, not the grid. Measured on
 * `/en/work/panas-sore` at 1440×900 — three images, three widths, all in
 * tracks that were 1398 or 691 wide:
 *
 *   ratio 0.80  ->  562px    ratio 1.33 -> 936px    ratio 1.60 -> 1123px
 *
 * A portrait sat with 836px of empty page beside it. Position decided a track
 * the picture then ignored.
 *
 * Deriving the span from orientation makes the two agree: a portrait is given
 * the half track it fits, a landscape the full one, and the box fills what it
 * is given. It also lands the two on a similar optical height — at 1440, a
 * 1.6 landscape is 874px tall and a 0.8 portrait 864px — so the sequence has
 * a rhythm without any image being cropped to get one.
 *
 * A missing ratio (`null`) takes the full track: without dimensions there is
 * nothing to reason about, and full width is the safe default for artwork.
 */
export function isFullWidth(ratio: number | null): boolean {
  return ratio === null || ratio >= 1
}

interface ProjectGalleryProps {
  /**
   * Anchor target and spine marker — Tahap 40.
   *
   * Declared rather than spread: this block takes no arbitrary props, and a
   * marker `vault/blocks/project-spine` reads to decide which region is being
   * read is worth naming in the type so it cannot be typo'd into silence.
   */
  id?: string | undefined
  'data-region'?: string | undefined
  images: readonly GalleryImage[]
  className?: string | undefined
}

/*
 * The dialog's own props, imported as a type rather than restated here.
 *
 * A structural copy would have needed a cast at the `import()` — and a cast
 * is a claim rather than a check: it would keep compiling after the dialog's
 * props changed, and fail at runtime instead. Importing the type is free
 * (types are erased) and makes the compiler prove the two agree.
 */
type LightboxComponent = ComponentType<LightboxProps>

/**
 * One figure's picture, in its own component so it can hold its own ref.
 *
 * A hook cannot be called inside a `map`, and the alternative — one ref array
 * threaded through — makes the parent own bookkeeping that belongs to the
 * child. This is the smaller shape.
 */
function GalleryMedia({
  image,
  ratio,
  full,
}: {
  image: GalleryImage
  ratio: number | null
  full: boolean
}) {
  const parallaxRef = useRef<HTMLDivElement>(null)
  useParallax(parallaxRef)

  return (
    <div className={s.media} style={ratioStyle(ratio)}>
      {/*
        The travelling layer sits inside the ratio box, which clips it, so the
        picture moves against a frame that holds the grid still.
      */}
      <div ref={parallaxRef} className={s.parallax}>
        <SanityImage
          image={toImageSource(image)}
          alt={image.alt ?? ''}
          className={s.image}
          maxWidth={full ? 1440 : 704}
          /*
           * Matched to the grid track, which the box now actually fills. The
           * derived default assumes an image fills the viewport, so a
           * half-width figure asked for 1440px to render 691 — twice the
           * pixels on the heaviest thing on the page.
           */
          sizes={trackImageSizes(full ? 92 : 48)}
        />
      </div>
    </div>
  )
}

export function ProjectGallery({
  images,
  id,
  'data-region': region,
  className,
}: ProjectGalleryProps) {
  const ref = useReveal<HTMLUListElement>()
  const t = useTranslations('lightbox')
  const [Lightbox, setLightbox] = useState<LightboxComponent | null>(null)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  /*
   * The button that opened it, so focus goes back to the image the reader
   * came from rather than to the top of the gallery. A ref rather than an
   * index because that is what Base UI's `finalFocus` takes.
   */
  const triggerRef = useRef<HTMLElement | null>(null)

  const openAt = useCallback(async (position: number, trigger: HTMLElement) => {
    triggerRef.current = trigger
    setIndex(position)

    const mod = await import('@/components/ui/lightbox')
    // The updater form: React would call a component passed to `setState`
    // as if it were a reducer.
    setLightbox(() => mod.Lightbox)
    setOpen(true)
  }, [])

  if (images.length === 0) return null

  return (
    <>
      <ul
        ref={ref}
        className={cn(s.gallery, className)}
        {...(id && { id })}
        {...(region !== undefined && { 'data-region': region })}
      >
        {images.map((image, position) => {
          const ratio = aspectRatioFor(image)
          const full = isFullWidth(ratio)

          return (
            <li
              key={image._key}
              data-reveal-item
              className={s.item}
              data-span={full ? 'full' : 'half'}
            >
              <figure className={s.figure}>
                {/*
                  A real button, not a div with a click handler: it is
                  reachable by Tab, activates on Enter and Space, and
                  announces itself as something that does a thing. The
                  accessible name says which image and what will happen,
                  because "image" alone tells a screen reader nothing about
                  the difference between three of them.
                */}
                <button
                  type="button"
                  className={s.trigger}
                  data-gallery-trigger=""
                  data-press="nav"
                  data-intent=""
                  aria-label={t('openImage', { position: position + 1 })}
                  onClick={(event) => {
                    void openAt(position, event.currentTarget)
                  }}
                >
                  <GalleryMedia image={image} ratio={ratio} full={full} />
                </button>
              </figure>
            </li>
          )
        })}
      </ul>

      {Lightbox && (
        <Lightbox
          images={images}
          index={index}
          onIndexChange={setIndex}
          open={open}
          onOpenChange={setOpen}
          finalFocus={triggerRef}
        />
      )}
    </>
  )
}
