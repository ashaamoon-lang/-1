'use client'

import { Dialog } from '@base-ui/react/dialog'
import cn from 'clsx'
import { useTranslations } from 'next-intl'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { Icon } from '@/vault/primitives/icon'
import { arrowLeft } from '@/vault/primitives/icon/paths/arrow-left'
import { arrowRight } from '@/vault/primitives/icon/paths/arrow-right'
import { close } from '@/vault/primitives/icon/paths/close'
import { zoomIn } from '@/vault/primitives/icon/paths/zoom-in'
import { zoomOut } from '@/vault/primitives/icon/paths/zoom-out'

import s from './lightbox.module.css'

/**
 * The lightbox for a project's gallery.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on Base UI's Dialog and the browser's own Pointer Events.
 *
 * ## Where it lives, and who decided that
 *
 * `vault/blocks/project-gallery` shipped with a paragraph titled "No
 * lightbox, deliberately" that closed by naming where one would belong if it
 * were ever added: `components/ui/`, beside the other Base UI dialogs. The
 * approved scaffold's Fase 5 asked for it, so here it is, in the place that
 * component nominated. Its paragraph has been rewritten rather than left to
 * contradict the code.
 *
 * ## Why zoom comes before pan, and why that is the feature
 *
 * Dragging a picture that already fits the screen does nothing. So panning is
 * only live **after** a zoom, and that ordering is what makes it information
 * rather than decoration: this site sells commissioned work, and the thing a
 * prospective client actually wants is to fill the screen with a piece and
 * then look closely at part of it.
 *
 * ## Why Pointer Events and not GSAP Draggable, measured
 *
 * The scaffold asked for `Draggable`, and the reason it is not here is *not*
 * the one that was expected. Tahap 28 established that a module shared
 * between an eager chunk and an async one makes webpack duplicate the whole
 * chunk group — 43KB shipped twice — and this route has 22KB of headroom, so
 * `Draggable` looked like the same trap. It was measured rather than assumed,
 * and it is not: with `Draggable` imported here the route stayed at **879KB**,
 * because GSAP itself already arrives through a `dynamic()` boundary in
 * `components/layout/wrapper`, so it was never in an eager chunk to be
 * duplicated *from*. The Tahap 28 rule is about chunk-group membership, not
 * about when a library happens to arrive.
 *
 * So the weight argument does not apply, and what decides it is behaviour.
 * What `Draggable` adds over the handlers below is inertia on a flick — and
 * that needs `InertiaPlugin`, which is not in the free package. Without it,
 * the two do the same thing, and one of them is forty lines with no plugin to
 * register and no lifecycle to unwind. A pan with bounds is two subtractions
 * and a clamp.
 *
 * ## Accessibility
 *
 * Focus enters on open and returns to **the image that was clicked**, not to
 * the first one — `finalFocus` is set from the trigger the gallery passes in.
 * Arrow keys move between works, Escape closes, and the zoom control carries
 * a spoken name and `aria-pressed`. The counter is `aria-hidden`: the dialog
 * is labelled with the same position in words, and hearing both is
 * duplication.
 */

export interface LightboxImage extends ImageSource {
  _key: string
  alt?: string | null | undefined
}

export interface LightboxProps {
  images: readonly LightboxImage[]
  /** Which image is on the stage. Owned by the gallery, so it survives close. */
  index: number
  onIndexChange: (index: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The gallery figure that was clicked, so focus goes back to it. */
  finalFocus: React.RefObject<HTMLElement | null>
}

/**
 * How far a zoom step goes.
 *
 * One step, not a continuous scale: the question a reader has is "let me see
 * that part closely", and a single decisive step answers it without turning
 * the viewer into a control panel. 2.2 is enough to read brush and print
 * detail on a 1440-wide stage while keeping the whole work reachable by
 * dragging.
 */
const ZOOM = 2.2

/**
 * How far a finger travels before it counts as a swipe rather than a tap.
 *
 * In real pixels, not a viewport unit: this is about the hand, and a hand is
 * the same size on every screen. 48px is roughly a thumb's width — far enough
 * that a tap with a little wobble is never mistaken for a swipe, close enough
 * that a deliberate flick always registers.
 */
const SWIPE_PX = 48

/** `1` -> `01`. Two digits, the counter shape `step-sequence` established. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Keeps the pan inside the picture, so it can never be dragged off-stage. */
function clamp(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value))
}

export function Lightbox({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  finalFocus,
}: LightboxProps) {
  const t = useTranslations('lightbox')
  const [zoomed, setZoomed] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

  /*
   * A pan can legitimately carry the pointer to the very edge of the screen,
   * and releasing there is otherwise indistinguishable from pressing outside
   * the dialog to dismiss it. So a close that arrives while a gesture is
   * running is refused: the reader is holding the picture, not letting go of
   * the dialog.
   */
  function handleOpenChange(next: boolean) {
    if (!next && gesture.current) return
    onOpenChange(next)
  }

  const current = images[index]
  const count = images.length

  const go = useCallback(
    (delta: number) => {
      const next = index + delta
      if (next < 0 || next >= count) return
      onIndexChange(next)
      // A new work arrives unzoomed and centred. Carrying a previous zoom
      // over would drop the reader into the middle of a picture they have
      // not seen whole.
      setZoomed(false)
      setOffset({ x: 0, y: 0 })
    },
    [count, index, onIndexChange]
  )

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        go(1)
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        go(-1)
      }
    }

    /*
     * The capture phase, and that is required rather than tidy.
     *
     * Base UI's dialog stops arrow keys propagating — it treats them as its
     * own composite navigation — so a listener on the bubble phase never
     * runs. Measured: a document listener in the capture phase saw
     * `ArrowLeft`, an identical one on the bubble phase saw nothing at all,
     * and the arrows silently did nothing.
     */
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, go])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
    // `dragging` marks the frame while a pointer is down so its transition is
    // off and it tracks the hand exactly. Set for a swipe too: the frame does
    // not move then, but the flag is what the gate reads to tell a gesture in
    // progress from one that never started.
    setDragging(true)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return

    /*
     * Unzoomed, the same gesture means something else entirely.
     *
     * A picture that already fits the screen cannot be panned, so dragging it
     * would do nothing — and doing nothing in response to a deliberate
     * gesture is how a viewer feels broken on a phone. So at rest the drag is
     * a swipe between works, and only once zoomed does it move the picture.
     * One gesture, two meanings, chosen by whether there is anywhere to go.
     */
    if (!zoomed) return

    /*
     * The travel limit is derived from the zoom, not guessed: at scale `Z` a
     * box is `(Z - 1)` of its own size larger than the stage, and half of
     * that is how far each edge can move before the picture leaves the frame.
     */
    const stage = stageRef.current?.getBoundingClientRect()
    const limitX = stage ? (stage.width * (ZOOM - 1)) / 2 : 0
    const limitY = stage ? (stage.height * (ZOOM - 1)) / 2 : 0

    setOffset({
      x: clamp(active.originX + (event.clientX - active.startX), limitX),
      y: clamp(active.originY + (event.clientY - active.startY), limitY),
    })
  }

  function endGesture(event: ReactPointerEvent<HTMLDivElement>) {
    const active = gesture.current
    if (active?.pointerId !== event.pointerId) return

    if (!zoomed) {
      const travelled = event.clientX - active.startX
      // Left drag goes to the next work, the way a page turns.
      if (Math.abs(travelled) >= SWIPE_PX) go(travelled < 0 ? 1 : -1)
    }

    gesture.current = null
    setDragging(false)
  }

  function toggleZoom() {
    setZoomed((previous) => !previous)
    setOffset({ x: 0, y: 0 })
  }

  if (!current) return null

  const label = t('label', {
    position: index + 1,
    total: count,
    alt: current.alt ?? '',
  })

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={s.backdrop} />
        <Dialog.Viewport className={s.viewport}>
          <Dialog.Popup
            className={s.popup}
            aria-label={label}
            finalFocus={finalFocus}
          >
            <div className={s.head}>
              {/*
                `aria-hidden` because the dialog's own name already says which
                work this is, in words. Hearing "02 / 03" as well is the same
                fact twice.
              */}
              <p className={cn('caption', s.count)} aria-hidden="true">
                <span className={s.countCurrent}>{pad(index + 1)}</span>
                {` / ${pad(count)}`}
              </p>

              <div className={s.actions}>
                <button
                  type="button"
                  className={cn('caption', s.action)}
                  data-press="nav"
                  data-intent=""
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label={t('previous')}
                >
                  <Icon path={arrowLeft} />
                </button>
                <button
                  type="button"
                  className={cn('caption', s.action)}
                  data-press="nav"
                  data-intent=""
                  onClick={() => go(1)}
                  disabled={index === count - 1}
                  aria-label={t('next')}
                >
                  <Icon path={arrowRight} />
                </button>
                <button
                  type="button"
                  className={cn('caption', s.action, zoomed && s.actionPressed)}
                  data-press="nav"
                  data-intent=""
                  onClick={toggleZoom}
                  aria-pressed={zoomed}
                  aria-label={t('zoom')}
                >
                  {/*
                    The glyph says which way the control goes, and the
                    `aria-pressed` above says which state it is in. A plus
                    and a minus were doing that job as text characters, which
                    on a caption-sized control rendered as a hyphen on some
                    platforms.
                  */}
                  <Icon path={zoomed ? zoomOut : zoomIn} />
                </button>
                <Dialog.Close
                  className={cn('caption', s.action)}
                  data-press="nav"
                  data-intent=""
                  aria-label={t('close')}
                >
                  <Icon path={close} />
                </Dialog.Close>
              </div>
            </div>

            <div
              ref={stageRef}
              className={s.stage}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
            >
              <div
                className={s.frame}
                // Read by `e2e/lightbox.e2e.ts`, which proves that panning is
                // only possible once a zoom has happened.
                data-lightbox-frame=""
                data-zoomed={zoomed ? '' : undefined}
                data-dragging={dragging ? '' : undefined}
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoomed ? ZOOM : 1})`,
                }}
              >
                <SanityImage
                  key={current._key}
                  image={toImageSource(current)}
                  alt={current.alt ?? ''}
                  className={s.image}
                  maxWidth={2400}
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            <div className={s.foot}>
              {current.alt && (
                <p className={cn('caption', s.caption)}>{current.alt}</p>
              )}

              <ul className={s.strip}>
                {images.map((image, position) => (
                  <li key={image._key}>
                    <button
                      type="button"
                      className={s.stripButton}
                      aria-current={position === index}
                      aria-label={t('goTo', { position: position + 1 })}
                      onClick={() => {
                        onIndexChange(position)
                        setZoomed(false)
                        setOffset({ x: 0, y: 0 })
                      }}
                    >
                      <SanityImage
                        image={toImageSource(image)}
                        alt=""
                        className={s.thumb}
                        maxWidth={160}
                        sizes="80px"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
