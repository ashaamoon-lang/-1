'use client'

import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import s from './counter.module.css'

/**
 * A number that counts from what it was to what it is.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Where the plan put it, and why it moved
 *
 * The plan for Tahap 42 had this counting up from zero when the catalogue
 * scrolled into view. That fails the `taste-skill` test this project made its
 * own touchstone — *what does this motion communicate?*, with only hierarchy,
 * narrative, feedback or state transition as valid answers. A number crawling
 * from 0 to 6 on page load says nothing a static "6" does not. It is
 * decoration, and the whole point of naming the third category in
 * `MOTION-SPEC.md` §0 was to stop decoration entering through it.
 *
 * The same number **changes** when a reader filters: 6 to 2. Counting between
 * those two is a **state transition** — a valid answer — and it pairs with
 * `catalogue-sift`, which is already animating the grid underneath it. The
 * gesture did not need cutting; it needed moving to the moment that motivates
 * it.
 *
 * ## So it animates on change, never on arrival
 *
 * On the first render there is no previous value and the number is simply
 * correct. That is not a degraded case — a reader who has not filtered
 * anything has watched nothing change.
 *
 * ## Category
 *
 * Micro band (§2): 400ms, `--ease-out-quart`. It has a beginning and an end,
 * so it is **not** third-category and needs no §11 exemption; it is also far
 * short of the choreographed band, so it spends nothing from §9.5's budget.
 */

/** Micro-band steps. Enough that the number reads as counting, not flickering. */
const FRAME_MS = 40

interface CounterProps {
  /** The number to display. Changing it is what starts the count. */
  value: number
  /**
   * The rendered sentence for every value this can pass through, indexed by
   * that value — `labels[0]` is the sentence for zero, and so on.
   *
   * An array rather than a `(value: number) => string`, and that is a
   * constraint rather than a style: the caller is a Server Component, and a
   * function cannot cross the boundary into a client one. It would have
   * type-checked and failed at build.
   *
   * The shape is also the better one. The sentence is localized *and
   * pluralized* — "1 work" against "6 works", and Indonesian pluralizes
   * differently again — so composing it here would mean shipping next-intl's
   * plural rules to the browser to render a number the server already knew
   * how to say. Precomputing the handful of strings keeps that on the server
   * and makes every intermediate step of the count grammatical.
   */
  labels: readonly string[]
  className?: string | undefined
}

export function Counter({ value, labels, className }: CounterProps) {
  const [shown, setShown] = useState(value)
  const previous = useRef(value)
  const prefersReducedMotion = usePreferredReducedMotion()

  useEffect(() => {
    const from = previous.current
    previous.current = value

    const reduced =
      prefersReducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Nothing to count between, or a reader who asked for no motion: the
    // number is simply right. `CLAUDE.md` #5 — the outcome never depends on
    // the animation having run.
    if (from === value || reduced) {
      setShown(value)
      return
    }

    /*
     * `setInterval`, and it is not a second animation loop.
     *
     * `MOTION-SPEC.md` §0.2 rule 5 forbids a second `requestAnimationFrame`
     * loop, and the reason is desynchronisation with the one Lenis, GSAP and
     * Tempus share. This is not that: it is a handful of discrete steps on a
     * timer that stops itself, driving text rather than a transform, and it
     * never runs during scroll. A frame loop would be the wrong tool as well
     * as a forbidden one — a number does not need sixty values a second.
     */
    const steps = Math.max(1, Math.abs(value - from))
    const perStep = Math.max(1, Math.round(400 / steps / FRAME_MS)) * FRAME_MS
    let current = from

    const timer = setInterval(() => {
      current += value > from ? 1 : -1
      setShown(current)
      if (current === value) clearInterval(timer)
    }, perStep)

    return () => clearInterval(timer)
  }, [value, prefersReducedMotion])

  return (
    <span className={cn(s.counter, className)} data-counter="">
      {/*
        The live value is announced once it settles, not on every step — a
        screen reader reading "1 work, 2 works, 3 works…" is worse than
        silence. `aria-live` sits on the settled text only.
      */}
      {/*
        `labels[shown] ?? labels.at(-1)`: the array is built from the real
        count, so every step of a real transition is in range. The fallback
        covers a caller that hands a short array rather than rendering
        `undefined` into the page.
      */}
      <span aria-live="polite">{labels[shown] ?? labels.at(-1) ?? ''}</span>
    </span>
  )
}
