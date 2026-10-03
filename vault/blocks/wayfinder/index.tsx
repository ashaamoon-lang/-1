'use client'

/**
 * Wayfinder — the 404's best guesses at where the reader meant to go.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A dead address is rarely random. It is a slug typed from memory, a link
 * from an old deck, a section renamed since — and the reader who lands on it
 * was going somewhere this site still has. The 404 offered Work, Studio and
 * Journal, which is the whole site minus the one thing they wanted. This
 * offers that thing, when it can tell what it was: the address is matched
 * against the site's own search index (`suggest.ts`), so a suggestion can only
 * ever be a page that exists.
 *
 * ## Only when it helps
 *
 * It needs the address the reader typed and the index, and both are only
 * known after hydration — the index is the one `/{locale}/search.json` already
 * serves the ⌘K palette, fetched the way the palette fetches it. Without
 * script, or when nothing is close enough, it renders nothing: the 404's own
 * links still stand, and an empty "did you mean" would be a promise kept by
 * nobody. A failed fetch is silent for the same reason.
 *
 * ## The moment
 *
 * `wayfinding` is `NorthArrow`'s: the drawing's north point bears on the way
 * out — at rest on the best guess, and onto whichever suggestion the pointer
 * rests on or the keyboard reaches. One bearing is worked out per hover or
 * focus (`vault/motion/north-arrow/bearing.ts`); there is no loop.
 */

import cn from 'clsx'
import { useLocale } from 'next-intl'
import { type FocusEvent, useEffect, useRef, useState } from 'react'

import { Link } from '@/components/ui/link'
import type { SearchEntry } from '@/lib/content/search-index'
import { routing } from '@/lib/i18n/routing'
import { NorthArrow } from '@/vault/motion/north-arrow'
import {
  bearingTo,
  centre,
  nearestTurn,
} from '@/vault/motion/north-arrow/bearing'

import { suggest } from './suggest'

import s from './wayfinder.module.css'

const NONE: readonly SearchEntry[] = []

/** The bearing from the arrow's centre to a target's centre. */
function bearingOf(arrow: Element, target: Element): number {
  return bearingTo(
    centre(arrow.getBoundingClientRect()),
    centre(target.getBoundingClientRect())
  )
}

interface WayfinderProps {
  /** Already localized — "Perhaps you were looking for". */
  title: string
  className?: string | undefined
}

export function Wayfinder({ title, className }: WayfinderProps) {
  const locale = useLocale()
  const [found, setFound] = useState<readonly SearchEntry[]>(NONE)
  const [bearing, setBearing] = useState(0)
  const arrowRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/${locale}/search.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json()
      })
      .then((entries: SearchEntry[]) => {
        setFound(suggest(window.location.pathname, entries, routing.locales))
      })
      .catch(() => {
        // Nothing to say: the 404's own links still stand.
      })

    return () => controller.abort()
  }, [locale])

  // At rest, the needle bears on the best guess.
  useEffect(() => {
    const arrow = arrowRef.current
    const first = listRef.current?.querySelector('a')
    if (found.length === 0 || !arrow || !first) return
    setBearing((previous) => nearestTurn(previous, bearingOf(arrow, first)))
  }, [found])

  /** Turns the needle onto a suggestion, or back to the best guess. */
  function aim(target: Element | null | undefined) {
    const arrow = arrowRef.current
    const at = target ?? listRef.current?.querySelector('a')
    if (!arrow || !at) return
    setBearing((previous) => nearestTurn(previous, bearingOf(arrow, at)))
  }

  /** Back to the best guess once focus has left the suggestions entirely. */
  function onBlur(event: FocusEvent<HTMLAnchorElement>) {
    if (!listRef.current?.contains(event.relatedTarget)) aim(null)
  }

  if (found.length === 0) return null

  return (
    <section
      aria-labelledby="wayfinder-title"
      className={cn(s.wayfinder, className)}
      data-wayfinder=""
      data-epic="wayfinding"
    >
      <h2 id="wayfinder-title" className={cn('caption', s.title)}>
        {title}
      </h2>
      <div className={s.body}>
        <span ref={arrowRef} className={s.arrow}>
          <NorthArrow bearing={bearing} />
        </span>
        <ul ref={listRef} className={s.list}>
          {found.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className={s.link}
                data-press="nav"
                data-intent=""
                onPointerEnter={(event) => aim(event.currentTarget)}
                onPointerLeave={() => aim(null)}
                onFocus={(event) => aim(event.currentTarget)}
                onBlur={onBlur}
              >
                <span className={s.label}>{entry.label}</span>
                {entry.meta && (
                  <span className={cn('caption', s.meta)}>{entry.meta}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
