'use client'

/**
 * Cursor — custom pointer with hover states.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Written from standard DOM events and the project's own Tempus loop. It used
 * GSAP's `quickTo` until Tahap 18c, when the follow moved onto the single RAF
 * loop `CLAUDE.md` #6 requires — see the note on the `useTempus` call.
 *
 * Mount once, near the root of a layout. Any element in the tree can then
 * change the cursor's appearance by declaring `data-cursor`:
 *
 * ```tsx
 * <Cursor />                                  // in the layout
 * <a data-cursor="link">Work</a>              // grows, blends
 * <div data-cursor="view">…</div>             // shows a label
 * <div data-cursor="hidden">…</div>           // hides it (over video, say)
 * ```
 *
 * ## Why a custom cursor is usually a mistake, and when it is not
 *
 * A custom cursor replaces an OS-level affordance the user already trusts.
 * Done badly it lags, obscures what it points at, or disappears over an
 * `<input>`. Done well it is one of the strongest "this was made on purpose"
 * signals available.
 *
 * The rules this implementation follows:
 *
 * - **The native cursor is never hidden.** It stays visible underneath; this
 *   is an additive ring, not a replacement. Hiding the system cursor is what
 *   makes custom cursors feel broken, and it is unrecoverable if the script
 *   fails.
 * - **Fine pointers only.** Never mounted on touch, where there is no cursor.
 * - **`pointer-events: none`.** It can never intercept a click.
 * - **`aria-hidden`.** It is decoration and must not reach assistive tech.
 * - **Reduced motion still gets a cursor** — it simply stops lagging behind
 *   the pointer. Motion sensitivity is not a reason to remove a visual
 *   affordance, only to stop it moving on its own.
 */

import { useEffect, useRef, useState } from 'react'
import { useTempus } from 'tempus/react'

import {
  usePointerIsFine,
  usePreferredReducedMotion,
} from '@/lib/hooks/use-sync-external'
import { duration } from '@/vault/motion/tokens'

import s from './cursor.module.css'

/** Values recognised in a `data-cursor` attribute. */
export type CursorState = 'default' | 'link' | 'view' | 'hidden'

const CURSOR_STATES = new Set<CursorState>([
  'default',
  'link',
  'view',
  'hidden',
])

/** What the ring is showing: a state, and the payload that goes with it. */
interface CursorReading {
  state: CursorState
  /**
   * The text inside the ring, when the element under the pointer names one.
   *
   * `null` falls back to the mount-wide `viewLabel`, which is what every
   * `data-cursor="view"` element got before Tahap 43.
   */
  label: string | null
}

function readCursor(target: EventTarget | null): CursorReading {
  if (!(target instanceof Element)) return { state: 'default', label: null }
  const match = target.closest<HTMLElement>('[data-cursor]')
  const value = match?.dataset.cursor
  // SAFETY: `value` is arbitrary author-supplied text from a data attribute,
  // so it is checked against CURSOR_STATES before being treated as one. The
  // first cast only lets `Set.has` accept the wider string; the second is
  // reached only when that check passed. Anything unrecognised falls through
  // to 'default', so a typo in markup degrades rather than breaking.
  const state =
    value && CURSOR_STATES.has(value as CursorState)
      ? (value as CursorState)
      : 'default'

  /*
   * The payload is read from the **same element** as the state, not from a
   * second `closest()` call.
   *
   * Two lookups could resolve to different ancestors — a card inside a
   * labelled section would take its state from the card and its text from the
   * section — and the ring would then confidently show a number belonging to
   * something else. One element answers both questions or neither.
   */
  const label = match?.dataset.cursorLabel?.trim()
  return { state, label: label ? label : null }
}

interface CursorProps {
  /** Label rendered inside the ring when an element declares `data-cursor="view"`. */
  viewLabel?: string | undefined
}

/**
 * Time constant for the follow, derived from a token rather than picked.
 *
 * Exponential smoothing covers about 95% of the remaining distance in three
 * time constants, so a tau of `duration.fast / 3` means the ring catches up to
 * the pointer in `--duration-fast` — the same 200ms the rest of the site uses
 * for a small state flip (`CLAUDE.md` #8: the number comes from the token).
 */
const FOLLOW_TAU = duration.fast / 3

/**
 * A delta longer than this is a tab returning from the background, not a slow
 * frame. Left unclamped it makes the smoothing factor 1 and the ring teleports
 * — which is the right outcome, but only by accident. Clamping states it.
 */
const MAX_FRAME_MS = 100

export function Cursor({ viewLabel = 'View' }: CursorProps) {
  const ref = useRef<HTMLDivElement>(null)
  /*
   * Starts `hidden`, not `default`, and that is a real fix rather than
   * caution.
   *
   * The element is `position: fixed; top: 0; left: 0` and only the `hidden`
   * state sets `opacity: 0` on the ring, so a `default` start painted a ring
   * in the top-left corner of every page until the reader happened to move
   * the mouse. Measured in Tahap 18c: `transform: none` before the first
   * pointer event. That is exactly the "custom cursor that appeared at the
   * origin" tell this component's own doc comment warns about.
   *
   * The first `pointermove` promotes it, and `onPointerOut` returns it here
   * when the pointer leaves the window — so the invisible state is the same
   * one, reached the same way, at both ends.
   */
  const [state, setState] = useState<CursorState>('hidden')
  /*
   * The payload, kept apart from `state` so a move between two elements that
   * share a state still swaps the text. Two chips are both `view`; only the
   * number tells them apart.
   */
  const [label, setLabel] = useState<string | null>(null)
  /*
   * A fine pointer is a device capability, not a render-time guess, so it is
   * read through the same `useSyncExternalStore` shape the rest of the
   * codebase uses for preferences. The server snapshot is `false`, so a phone
   * never paints a ring for a pointer it does not have.
   */
  const isEnabled = usePointerIsFine()
  const prefersReducedMotion = usePreferredReducedMotion()

  // Where the pointer is, and where the ring has got to. Refs rather than
  // state: this changes every frame and must never trigger a render.
  const target = useRef({ x: 0, y: 0 })
  const position = useRef({ x: 0, y: 0 })
  const hasPointer = useRef(false)

  useEffect(() => {
    if (!isEnabled) return

    const onPointerMove = (event: PointerEvent) => {
      target.current.x = event.clientX
      target.current.y = event.clientY

      // The first sighting places the ring rather than easing it in from the
      // top-left corner, which is the classic custom-cursor tell on load.
      if (!hasPointer.current) {
        hasPointer.current = true
        position.current.x = event.clientX
        position.current.y = event.clientY
      }

      const reading = readCursor(event.target)
      setState(reading.state)
      setLabel(reading.label)
    }

    // The pointer leaving the window should hide the ring rather than freeze
    // it at the last known edge position.
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        setState('hidden')
        setLabel(null)
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerOut)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerOut)
    }
  }, [isEnabled])

  /*
   * The follow runs on the site's single RAF loop, not on GSAP's.
   *
   * This used `gsap.quickTo`, which meant mounting the cursor pulled GSAP into
   * every route that rendered it — and `e2e/route-budget.e2e.ts` allows GSAP
   * on `/en` and `/en/practice/*` only, with `/en/work`, `/en/work/[slug]` and
   * `/en/ai` allowed **nothing**. A site-wide cursor would have turned that
   * gate red on three routes, and raising the budgets to decorate is not a
   * trade worth making.
   *
   * Tempus was already the answer: `CLAUDE.md` #6 requires one RAF loop, and
   * Lenis (order 5) and GSAP's own root update (order 10) are on it. An
   * explicit order rather than the default 0, because
   * `components/ui/marquee` records what happens without one — sequencing
   * becomes mount-order luck.
   */
  useTempus(
    ({ deltaTime }: { deltaTime: number }) => {
      const element = ref.current
      if (!element || !hasPointer.current) return

      /*
       * Frame-rate independent smoothing. A plain `+= (target - current) * k`
       * moves twice as fast on a 120Hz display as on a 60Hz one; the
       * exponential form covers the same distance per unit of *time* whatever
       * the frame rate.
       *
       * Reduced motion takes the pointer position exactly. The ring still
       * exists — it simply stops lagging, which is the preference's actual
       * request (`MOTION-SPEC.md` §9.4 rule 3: the duration changes, the
       * outcome does not).
       */
      const seconds = Math.min(deltaTime, MAX_FRAME_MS) / 1000
      const factor = prefersReducedMotion
        ? 1
        : 1 - Math.exp(-seconds / FOLLOW_TAU)

      position.current.x += (target.current.x - position.current.x) * factor
      position.current.y += (target.current.y - position.current.y) * factor

      // `transform` only, never `left`/`top` (`CLAUDE.md` #4).
      element.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`
    },
    { order: 8 }
  )

  if (!isEnabled) return null

  return (
    <div ref={ref} className={s.cursor} data-state={state} aria-hidden="true">
      <span className={s.ring} />
      {/*
        `key` on the payload, so a changed value mounts a fresh element and
        the enter animation in the stylesheet runs again — Tahap 43.

        The outgoing payload is cut rather than faded. A two-phase swap would
        spend `--duration-micro` twice, 300ms, to hide two characters that the
        reader is not looking at during the swap; and while it ran, the ring
        would show *neither* the old count nor the new one, which is worse
        than showing the new one immediately. The arrival is animated because
        that is the part a reader notices.
      */}
      <span key={label ?? viewLabel} className={s.label}>
        {label ?? viewLabel}
      </span>
    </div>
  )
}
