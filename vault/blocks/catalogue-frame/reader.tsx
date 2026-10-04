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
 *
 * The moment, `frame-crosshair`, is `Crosshair`'s: two hairlines run in from
 * the frame's left and top edges to the centre of the work in hand, and glide
 * to the next one as the reader moves. The point is measured once per hover
 * or focus, relative to this wrapper, which shares the table's edges.
 *
 * The work in hand also shows its cover — Tata & Gerak, stage 3
 * (`vault/motion/cover-preview`). A plate takes the far end of the work's
 * bay, where the words never reach, and glides with the crosshair. Where the
 * bay is too narrow to hold it clear of the words, there is no plate. The
 * covers are mounted the first time a work is reached for, not before.
 */

import cn from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { CoverPreview } from '@/vault/motion/cover-preview'
import { Crosshair } from '@/vault/motion/crosshair'

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

/** Where the crosshair points, in the wrapper's own pixels and fractions. */
interface Aim {
  on: boolean
  x: number
  y: number
  reachX: number
  reachY: number
}

const NOWHERE: Aim = { on: false, x: 0, y: 0, reachX: 0, reachY: 0 }

/** The centre of a work, measured from the wrapper's left and top edges. */
function aimAt(root: Element, work: Element): Aim {
  const box = root.getBoundingClientRect()
  const at = work.getBoundingClientRect()
  const x = at.left + at.width / 2 - box.left
  const y = at.top + at.height / 2 - box.top
  return {
    on: true,
    x,
    y,
    reachX: box.width > 0 ? x / box.width : 0,
    reachY: box.height > 0 ? y / box.height : 0,
  }
}

/** Where the cover plate stands, in the wrapper's own pixels. */
interface Plate {
  on: boolean
  x: number
  y: number
  width: number
  current: string | null
}

const NO_PLATE: Plate = { on: false, x: 0, y: 0, width: 0, current: null }

/** The share of a work's bay the plate takes, from its far end. */
const PLATE_SHARE = 0.4
/** The covers' height over their width — the catalogue grid's 4:5. */
const PLATE_RATIO = 5 / 4
/** How much of the bay must stay clear between the words and the plate. */
const PLATE_CLEARANCE = 0.05

/**
 * Where a work's words end. Its link spans the whole bay, so the link's box
 * says nothing about the words; their text does.
 */
function wordsEnd(work: Element): number {
  const range = document.createRange()
  const walker = document.createTreeWalker(work, NodeFilter.SHOW_TEXT)
  let end = Number.NEGATIVE_INFINITY
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    range.selectNodeContents(node)
    end = Math.max(end, range.getBoundingClientRect().right)
  }
  return end
}

/**
 * The plate for a work: at the far end of its bay, level with it, kept inside
 * the wrapper — whose frame clips and would otherwise scroll — and only where
 * the bay holds it clear of the words.
 */
function plateFor(root: Element, work: HTMLElement): Plate {
  const box = root.getBoundingClientRect()
  const at = work.getBoundingClientRect()
  const width = at.width * PLATE_SHARE
  const height = width * PLATE_RATIO
  const left = at.right - width
  const middle = at.top + at.height / 2 - box.top
  const lowest = Math.max(box.height - height, 0)
  return {
    on: left - wordsEnd(work) >= at.width * PLATE_CLEARANCE,
    x: left - box.left,
    y: Math.min(Math.max(middle - height / 2, 0), lowest),
    width,
    current: work.dataset.workId ?? null,
  }
}

interface FrameReaderProps {
  children: ReactNode
  /**
   * The covers the plate can show — `PreviewCover`s named by the works'
   * `data-work-id`. Mounted once a work is first reached for.
   */
  covers: ReactNode
  className?: string | undefined
}

export function FrameReader({ children, covers, className }: FrameReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [aim, setAim] = useState<Aim>(NOWHERE)
  const [plate, setPlate] = useState<Plate>(NO_PLATE)
  // Whether a work has been reached for yet — until then no cover is loaded.
  const [reached, setReached] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const table = root?.querySelector('table')
    if (!root || !table) return

    /** Marks the year of the work in hand — or nothing, given none. */
    const mark = (work: Element | null) => {
      for (const marked of table.querySelectorAll('[data-cross]')) {
        marked.removeAttribute('data-cross')
      }
      if (!(work instanceof HTMLElement)) {
        // Fade where it stands, rather than sweep back to the corner.
        setAim((last) => ({ ...last, on: false }))
        setPlate((last) => ({ ...last, on: false }))
        return
      }
      const place = locate(table, work)
      if (place) yearOf(table, place)?.setAttribute('data-cross', '')
      setAim(aimAt(root, work))
      setPlate(plateFor(root, work))
      setReached(true)
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
    <div
      ref={rootRef}
      className={cn(s.reader, className)}
      data-epic="frame-crosshair"
    >
      {children}
      <Crosshair {...aim} />
      <CoverPreview {...plate}>{reached && covers}</CoverPreview>
    </div>
  )
}

/** How many works each bay holds, read from the table as it is now. */
function countsOf(table: HTMLTableElement): number[][] {
  return bodyRows(table).map((row) =>
    baysOf(row).map((bay) => worksIn(bay).length)
  )
}
