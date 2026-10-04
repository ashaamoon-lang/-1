'use client'

/**
 * BackToTop — a way back up a long page, offered once it is needed.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## What it is for
 *
 * The home page runs to thirteen screens and a case to nearly five, and the
 * only ways back to the top were the wheel and the wordmark — which leaves
 * the page. This is one small control in the lower corner that takes the
 * reader back up, glides there the way the page scrolls, and hands the
 * keyboard the page's first stop again.
 *
 * ## When it shows
 *
 * After two screens. Before that the top is a flick away, and a control that
 * appears on every scroll is noise. It is read from the window's scroll
 * position by a passive listener whose answer changes twice a visit — no
 * frame loop. It is not rendered until then, so a page never scrolled that
 * far has no extra stop for the keyboard or a screen reader; it rises in from
 * `@starting-style`, and goes at once.
 *
 * ## What it does
 *
 * Scrolls to the top through Lenis where the page runs it, so the trip is the
 * page's own glide (a jump under reduced motion), then moves focus to the
 * start of `main` without scrolling — Tab then goes on from the top of the
 * page rather than from the footer.
 *
 * Tata & Gerak, stage 5; `back-to-top`.
 */

import cn from 'clsx'
import { useLenis } from 'lenis/react'
import { useSyncExternalStore } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import s from './back-to-top.module.css'

/** How many screens down the page before the way back is offered. */
const SCREENS = 2

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  window.addEventListener('resize', onChange)
  return () => {
    window.removeEventListener('scroll', onChange)
    window.removeEventListener('resize', onChange)
  }
}

function isFarDown() {
  return window.scrollY > window.innerHeight * SCREENS
}

/** The server has no scroll position, and a page always opens at its top. */
function atTopOnServer() {
  return false
}

interface BackToTopProps {
  /** Already localized — "Back to top". */
  label: string
  className?: string | undefined
}

export function BackToTop({ label, className }: BackToTopProps) {
  const lenis = useLenis()
  const reduced = usePreferredReducedMotion()
  const farDown = useSyncExternalStore(subscribe, isFarDown, atTopOnServer)

  if (!farDown) return null

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { immediate: reduced })
    else window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' })
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }

  return (
    <button
      type="button"
      className={cn('caption', s.button, className)}
      data-press="chip"
      data-epic="back-to-top"
      onClick={toTop}
    >
      {label}
      <span aria-hidden="true" className={s.arrow}>
        ↑
      </span>
    </button>
  )
}
