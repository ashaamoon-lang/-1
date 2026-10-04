'use client'

/**
 * GridUnderlay — the grid every page is set on, drawn over it on request.
 *
 * Provenance: original work for this project. No third-party code copied.
 * The column geometry is the page grid's own (`--columns`, `--gap`,
 * `--safe`, as `lib/styles/css/tailwind.css`'s `dr-layout-grid` sets it), not
 * a second description of it.
 *
 * ## What the motion says
 *
 * The site argues that the work is made to hold up, and that the structure
 * under a thing is part of what a client buys. Its own pages are built the
 * same way, on twelve columns (four on a phone), and nothing showed it. This
 * draws that grid over the page when the reader asks — the columns let down
 * from the top one after another, `--stagger-items` apart, like rules drawn
 * on a sheet before anything is placed on it — so a reader can see where the
 * words and the plates are set. Only `transform` moves; hiding is at once.
 *
 * ## How it is asked for
 *
 * `GridToggle`, a pressed-or-not button the footer carries in its colophon,
 * or the `g` key anywhere outside a field. The answer lasts for the visit and
 * is not stored: a reloaded page opens without it.
 *
 * ## Reading it
 *
 * The drawing is `aria-hidden` and lets every pointer through; the toggle says
 * its state with `aria-pressed` and its key with `aria-keyshortcuts`.
 *
 * ## Reduced motion
 *
 * The grid is there at once (§9.4 rule 3).
 *
 * Tata & Gerak, stage 5; `grid-underlay`.
 */

import cn from 'clsx'
import type { CSSProperties } from 'react'
import { useEffect, useSyncExternalStore } from 'react'

import s from './grid-underlay.module.css'

/** Twelve columns on a desktop; the stylesheet keeps four on a phone. */
const COLUMNS = Array.from({ length: 12 }, (_, index) => index)

/*
 * Whether the grid is drawn — for this visit only, held in the module so the
 * footer's toggle and the drawing agree, and so it survives moving between
 * pages without being stored anywhere.
 */
let drawn = false
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function isDrawn() {
  return drawn
}

/** A page always opens without the grid. */
function notOnServer() {
  return false
}

function toggleGrid() {
  drawn = !drawn
  for (const listener of listeners) listener()
}

function useGrid() {
  return useSyncExternalStore(subscribe, isDrawn, notOnServer)
}

/** A store that never changes, for "is a script running here at all". */
function subscribeNever() {
  return () => undefined
}

function scripted() {
  return true
}

/** Whether a key pressed here is someone typing. */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest('input, textarea, select, [role="textbox"]') !== null)
  )
}

interface GridUnderlayProps {
  className?: string | undefined
}

/** The drawing, and the `g` key that asks for it. Mounted once per page. */
export function GridUnderlay({ className }: GridUnderlayProps) {
  const shown = useGrid()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'g' || event.repeat) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return
      if (isTyping(event.target)) return
      toggleGrid()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!shown) return null

  return (
    <div
      aria-hidden="true"
      data-epic="grid-underlay"
      className={cn(s.underlay, className)}
    >
      <div className={s.grid}>
        {COLUMNS.map((column) => (
          <span
            key={column}
            className={s.column}
            // Where it falls in the row, for the stagger. A custom property,
            // which React's `CSSProperties` does not list.
            style={{ '--column': column } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

interface GridToggleProps {
  /** Already localized — "Show the grid". Its pressed state says the rest. */
  label: string
  className?: string | undefined
}

/**
 * The button that draws the grid or takes it away — rendered only where a
 * script runs, because without one it would be a button that does nothing.
 */
export function GridToggle({ label, className }: GridToggleProps) {
  const shown = useGrid()
  const ready = useSyncExternalStore(subscribeNever, scripted, notOnServer)

  if (!ready) return null

  return (
    <button
      type="button"
      className={cn('caption', s.toggle, className)}
      aria-pressed={shown}
      aria-keyshortcuts="g"
      data-press="chip"
      onClick={toggleGrid}
    >
      {label}
      <kbd aria-hidden="true" className={s.key}>
        G
      </kbd>
    </button>
  )
}
