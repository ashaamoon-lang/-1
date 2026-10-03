'use client'

/**
 * FrameReader — the catalogue's frame, read the way a drawing's grid is read.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The frame places every work by the practice that carried it and the year
 * it is dated, and that is only useful if a reader can tell, for the work in
 * hand, which row and which column it sits in. Two things make that easy:
 *
 * - **The arrow keys move between works** the way the eye moves across the
 *   drawing — along the practice's row, and up and down the year — passing
 *   empty bays over (`navigate.ts`). Tab still visits every work in order;
 *   the arrows are a faster way through, not a replacement.
 * - **The work in hand marks its year** on the frame's top edge, whether it
 *   is under the pointer or holds the keyboard focus, so the column is read
 *   without tracing it by eye.
 *
 * The table is server-rendered and stays the table: this only listens on it.
 * Listeners are attached to the wrapper rather than written as JSX handlers,
 * because they are delegated — one set for every work in the frame.
 */

import cn from 'clsx'
import { type ReactNode, useEffect, useRef } from 'react'

import { type Place, type Step, step } from './navigate'

import s from './catalogue-frame.module.css'

/** A work in the frame — what the arrows move between. */
const WORK = '[data-bearing~="load"]'

/** The keys that move, and which way. Any other key is left alone. */
const KEYS = new Map<string, Step>([
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
  ['ArrowUp', 'up'],
  ['ArrowDown', 'down'],
])

function bodyRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return [...(table.tBodies[0]?.rows ?? [])]
}

/** A row's bays, without the practice heading that starts it. */
function baysOf(row: HTMLTableRowElement | undefined): HTMLTableCellElement[] {
  return row ? [...row.cells].filter((cell) => cell.tagName === 'TD') : []
}

function worksIn(bay: Element | undefined): HTMLElement[] {
  return bay ? [...bay.querySelectorAll<HTMLElement>(WORK)] : []
}

/** Where a work sits in the frame, or null when it is not in one. */
function locate(table: HTMLTableElement, work: HTMLElement): Place | null {
  const bay = work.closest('td')
  const row = bay?.parentElement
  if (!bay || !(row instanceof HTMLTableRowElement)) return null
  const place = {
    row: bodyRows(table).indexOf(row),
    column: baysOf(row).indexOf(bay),
    item: worksIn(bay).indexOf(work),
  }
  return place.row < 0 || place.column < 0 || place.item < 0 ? null : place
}

function workAt(table: HTMLTableElement, place: Place): HTMLElement | null {
  return (
    worksIn(baysOf(bodyRows(table)[place.row])[place.column])[place.item] ??
    null
  )
}

/** The year heading over a work's column. */
function yearOf(table: HTMLTableElement, place: Place): Element | null {
  // The first heading of the head row names the practice column.
  return table.tHead?.rows[0]?.cells[place.column + 1] ?? null
}

interface FrameReaderProps {
  children: ReactNode
  className?: string | undefined
}

export function FrameReader({ children, className }: FrameReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const table = root?.querySelector('table')
    if (!root || !table) return

    /** Marks the year of the work in hand — or nothing, given none. */
    const mark = (work: Element | null) => {
      for (const marked of table.querySelectorAll('[data-cross]')) {
        marked.removeAttribute('data-cross')
      }
      if (!(work instanceof HTMLElement)) return
      const place = locate(table, work)
      if (place) yearOf(table, place)?.setAttribute('data-cross', '')
    }

    const workFrom = (target: EventTarget | null) =>
      target instanceof Element ? target.closest(WORK) : null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }
      const direction = KEYS.get(event.key)
      const work = workFrom(event.target)
      if (!direction || !(work instanceof HTMLElement)) return
      const at = locate(table, work)
      const next = at ? step(countsOf(table), at, direction) : null
      const target = next ? workAt(table, next) : null
      if (!target) return
      event.preventDefault()
      target.focus()
    }

    const onPointerOver = (event: PointerEvent) => {
      const work = workFrom(event.target)
      if (work) mark(work)
    }
    // Leaving with the pointer hands the mark back to the keyboard focus.
    const onPointerLeave = () => mark(workFrom(document.activeElement))
    const onFocusIn = (event: FocusEvent) => mark(workFrom(event.target))
    const onFocusOut = (event: FocusEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) mark(null)
    }

    root.addEventListener('keydown', onKeyDown)
    root.addEventListener('pointerover', onPointerOver)
    root.addEventListener('pointerleave', onPointerLeave)
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)

    return () => {
      root.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('pointerover', onPointerOver)
      root.removeEventListener('pointerleave', onPointerLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
      mark(null)
    }
  }, [])

  return (
    <div ref={rootRef} className={cn(s.reader, className)}>
      {children}
    </div>
  )
}

/** How many works each bay holds, read from the table as it is now. */
function countsOf(table: HTMLTableElement): number[][] {
  return bodyRows(table).map((row) =>
    baysOf(row).map((bay) => worksIn(bay).length)
  )
}
