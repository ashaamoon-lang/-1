'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
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
import { PixelImage } from '@/vault/magic/pixel-image'
import { Horizontal } from '@/vault/motion/horizontal'
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

/** The twelve-column desktop grid, in the units the spans are written in. */
const COLUMNS = 12

/**
 * Which half-width plates end up alone in their row.
 *
 * ## The hole this exists to close, and why the last rule did not close it
 *
 * `isFullWidth` above fixed a real defect in Tahap 44 — the box and its track
 * disagreed, so a picture ignored the column it was given. Its own note
 * records what that looked like: *"A portrait sat with 836px of empty page
 * beside it."*
 *
 * Measured on the production build at 1440×900, `/en/work/arus-balik`,
 * 2026-09-13 — after that fix:
 *
 * ```
 * span=half   x=16  w= 572  top= 404   h=715
 * span=full   x=16  w=1161  top=1234   h=675
 * span=half   x=16  w= 572  top=1957   h=786
 * ```
 *
 * The spans run `half, full, half`, so **neither half ever meets another**:
 * each one opens a row, the full cannot join it, and 572px of ground sits
 * beside each picture. Roughly 860 thousand square pixels of empty page, on
 * the one route that exists to sell a piece of work.
 *
 * So the rule fixed the *track* and left the *row*. 836px became 572px, and
 * stayed.
 *
 * ## Why the flow is simulated rather than guessed from neighbours
 *
 * "A half pairs when the next item is a half" is wrong on three halves in a
 * row: the first two fill a row and the third opens its own. The only answer
 * that is right for every sequence is the one the browser computes — walk the
 * items, fill rows to twelve columns, and report any row that holds exactly
 * one half.
 *
 * @param spans `true` for a full-width plate, `false` for a half.
 * @returns One boolean per plate: `true` where a half stands alone in its row.
 */
export function loneHalves(spans: readonly boolean[]): boolean[] {
  const lone = spans.map(() => false)

  let row: number[] = []
  let used = 0

  const close = () => {
    const only = row.length === 1 ? row[0] : undefined
    if (only !== undefined && spans[only] === false) lone[only] = true
    row = []
    used = 0
  }

  for (const [index, full] of spans.entries()) {
    const width = full ? COLUMNS : COLUMNS / 2
    if (used + width > COLUMNS) close()
    row.push(index)
    used += width
  }
  close()

  return lone
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
  /**
   * Render the plates as a pinned horizontal run rather than a column.
   *
   * Opt-in rather than the default because `vault/` is a library and a
   * gallery in a Storybook frame has no scroll container to pin against.
   * `/work/<slug>` is the one caller that turns it on — see
   * `docs/stages/TAHAP-64.md` §1.2 for why that route and not `/` or
   * `/work`, both of which a gate rules out.
   */
  run?: boolean | undefined
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
 * How far a gallery plate's picture travels across its own pass, as a
 * percentage of its height — Tahap 57.
 *
 * Inside the 5-15 the parallax preset names, and above the hook's quiet
 * default of 6 because these plates are the whole middle of the longest inner
 * route: `docs/stages/TAHAP-56.md` measured that middle as two of twelve
 * scroll steps carrying any event at all.
 *
 * One constant, read by both the hook and the stylesheet, so the travel and
 * the overshoot that has to cover it cannot come apart.
 */
const PLATE_DRIFT = 10

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
  /*
   * Explicit, and matched to the stylesheet — Tahap 57.
   *
   * This called the hook with no arguments, so the travel was the hook's own
   * default of 6, while `project-gallery.module.css` wrote the overshoot as a
   * hardcoded `-4%` / `108%`. Those two numbers have to agree — the layer has
   * to be taller than its frame by exactly the travel it is given, or the
   * frame shows its own background at the ends of the pass — and nothing
   * connected them.
   *
   * That is the same failure `vault/blocks/project-card` had before Tahap 43,
   * where `e2e/continuous-motion.e2e.ts` caught 2 exposed plates at three of
   * four scroll positions once `work-constellation` changed one number and
   * not the other. The card's fix was to derive the CSS from a custom
   * property set here; the gallery now does the same, and the distance is
   * stated once rather than inherited from a default nobody was reading.
   */
  useParallax(parallaxRef, { distance: PLATE_DRIFT })

  return (
    <div
      className={s.media}
      /*
       * SAFETY: `CSSProperties` has no index signature for custom properties,
       * so an object carrying `--plate-drift` cannot be typed without this
       * cast. The value is `PLATE_DRIFT`, a module constant declared in this
       * file — not anything from the CMS or from a caller — and React
       * forwards unknown keys straight to `style.setProperty`, which is what
       * a custom property needs.
       */
      style={
        {
          ...ratioStyle(ratio),
          '--plate-drift': PLATE_DRIFT,
        } as CSSProperties
      }
    >
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
      {/*
        The plate assembles out of blocks — Tahap 56.

        `vault/magic/pixel-image` renders a veil of ground-coloured tiles over
        this box; they dissolve on a staggered delay when the figure's own
        `[data-reveal-item]` turns `visible`. It sits *outside* `.parallax` on
        purpose: the veil is a property of the frame, not of the picture
        travelling inside it, so it must not drift with the parallax or the
        seams would slide across the plate.

        `--pixel-ground` is `--surface-2` rather than the page ground because
        that is what `.media` paints while the image is still arriving. A tile
        the colour of the page would announce itself as a tile against the
        box; one the colour of the box is invisible until it goes.
      */}
      <PixelImage className={s.pixels} />
    </div>
  )
}

export function ProjectGallery({
  images,
  id,
  'data-region': region,
  run = false,
  className,
}: ProjectGalleryProps) {
  /*
   * Per item — Tahap 56.
   *
   * The gallery is the middle of the longest inner route, and the census that
   * opened `docs/stages/TAHAP-56.md` measured that middle as dead: two of
   * twelve scroll steps on `/en/work/<slug>` produced any arrival at all. One
   * `useReveal` on the `<ul>` is one event for every plate below it, which
   * means the whole gallery had already arrived before the reader reached the
   * second picture.
   *
   * `perItem` is the mode Tahap 54 added for exactly this shape, and it is
   * what turns the mosaic below into one arrival per plate rather than one
   * for the set.
   */
  const ref = useReveal<HTMLUListElement>({ perItem: true })
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

  /*
   * A run has to have somewhere to run — measured, 2026-09-13.
   *
   * The first wiring enabled the track unconditionally on this route, and the
   * production build reported: `items: 2, trackWidth: 1027,
   * viewportWidth: 1161, travel: -134`. Every one of the six seeded projects
   * carries exactly two gallery images, so on all of them the track is
   * *narrower than its own viewport*: `travel()` clamps to zero, and what
   * ships is a pin that holds a full screen and never moves.
   *
   * `vault/blocks/step-sequence`'s doc already names that failure — "a held
   * note that resolves inside one screen is not held; it is a coincidence" —
   * and a pin with zero travel is the same defect with the volume up.
   *
   * So the shape is a property of the **content**, not of the route. Four is
   * the floor because at `34vw` per item a run needs to out-measure its box
   * by about a screen to read as travel rather than as a nudge: three items
   * clear the viewport by roughly 320px, four by roughly 800px.
   *
   * Consequence, stated rather than hidden: **on today's fixtures the run
   * never appears.** Every project falls back to the grid, which is the
   * correct, already-measured design. The moment arrives with the first real
   * project that has a real set of images — which is the fixture-content debt
   * `docs/ROADMAP.md` already carries, not a new one.
   */
  const RUN_MINIMUM = 4
  const travels = run && images.length >= RUN_MINIMUM

  /**
   * Wraps the plates in whichever container this gallery is being.
   *
   * Both branches carry `data-reveal-item` on each item and hand the same
   * `useReveal` ref to the list, so the veil in `GalleryMedia` — which keys
   * off `[data-reveal-item='visible']` — dissolves either way. That is the
   * detail most likely to be lost by a change like this, and it is why the
   * marker is asserted in both branches rather than assumed from one.
   */
  const plates = (
    entries: {
      key: string
      full: boolean
      figure: ReactNode
      note: string | null
    }[]
  ) => {
    /*
     * Only the grid needs this. The run lays its plates out horizontally, so
     * no plate is ever alone in a row there, and asking the question would
     * produce an answer that describes a layout the reader is not looking at.
     */
    const lone = loneHalves(entries.map((entry) => entry.full))

    return travels ? (
      <Horizontal
        name="project-run"
        label={t('run', { count: images.length })}
        listRef={ref}
        items={entries.map((entry) => entry.figure)}
        className={className}
      />
    ) : (
      <ul
        ref={ref}
        className={cn(s.gallery, className)}
        {...(id && { id })}
        {...(region !== undefined && { 'data-region': region })}
      >
        {entries.map((entry, position) => {
          /*
           * A spread needs both halves of itself: a row with a hole in it and
           * something true to put in the hole. A plate with no description —
           * the schema allows it — gets the plain half it has always had,
           * because an empty column beside a picture is the defect this is
           * here to remove, not a smaller version of it worth shipping.
           */
          const spread = lone[position] === true && entry.note !== null

          return (
            <li
              key={entry.key}
              data-reveal-item
              className={s.item}
              data-span={entry.full ? 'full' : 'half'}
              {...(spread && { 'data-spread': '' })}
            >
              {entry.figure}
              {spread && (
                /*
                 * `aria-hidden`, for the reason the position label above is:
                 * this text is already the image's `alt`, so a screen reader
                 * has heard it from the picture itself. Rendering it again in
                 * the tree would read one plate's description twice.
                 *
                 * It is the description Tahap 44 wrote *per plate*, and the
                 * reason it wrote them is the reason this column is worth
                 * having: the gallery plates are not the cover, and until now
                 * the only person told what they were was one using a screen
                 * reader.
                 *
                 * `p-big`, not `caption`, and the two voices are assigned the
                 * way the rest of the site assigns them: mono carries what a
                 * reader *scans* — the `02 / 02` still sitting under the
                 * picture — and the display face carries what a reader
                 * *reads*. At `caption` this column measured 245px of 11px
                 * mono in a 572px track and read as a footnote for a picture
                 * 786px tall.
                 */
                <p aria-hidden="true" className={cn('p-big', s.note)}>
                  {entry.note}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <>
      {/*
        Two shapes, one set of plates — Tahap 64.

        The `<figure>` below is byte-identical in both: same trigger, same
        `GalleryMedia`, same veil, same caption. What differs is only what
        holds it — a twelve-column grid the reader scrolls down, or a pinned
        track the reader scrolls sideways. Keeping the plate out of that
        decision is what makes the run an addition rather than a rewrite of
        three stages of measured work.
      */}
      {plates(
        images.map((image, position) => {
          const ratio = aspectRatioFor(image)
          const full = isFullWidth(ratio)
          /*
           * `01 / 04`, padded, so the counter is the same width on every
           * plate and the column edge below the images stays straight.
           */
          const positionLabel = `${String(position + 1).padStart(2, '0')} / ${String(
            images.length
          ).padStart(2, '0')}`

          const figure = (
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
                /*
                 * The plate's place in the set, carried in the ring —
                 * Tahap 43. Where it is in a sequence is the one thing a
                 * reader cannot see from the picture itself, and until now
                 * it existed only in the `aria-label` above: announced to a
                 * screen reader, invisible to everyone else.
                 *
                 * The same string is rendered below, because
                 * `vault/primitives/cursor` never mounts on a coarse
                 * pointer and information that lives only in the ring does
                 * not exist on a phone.
                 */
                data-cursor="view"
                data-cursor-label={positionLabel}
                onClick={(event) => {
                  void openAt(position, event.currentTarget)
                }}
              >
                <GalleryMedia image={image} ratio={ratio} full={full} />
              </button>
              {/*
                  `aria-hidden`, because the button above already announces
                  "Open image 2 of 4" as its accessible name. Announcing the
                  figure's number again would have a screen reader read the
                  position twice for one plate.
                */}
              <figcaption
                aria-hidden="true"
                className={cn('caption', s.position)}
              >
                {positionLabel}
              </figcaption>
            </figure>
          )

          /*
           * Trimmed to `null` rather than passed through: the schema marks
           * `alt` required, but a whitespace-only string satisfies that and
           * would open a spread column holding nothing.
           */
          const note = image.alt?.trim() ? image.alt.trim() : null

          return { key: image._key, full, figure, note }
        })
      )}

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
