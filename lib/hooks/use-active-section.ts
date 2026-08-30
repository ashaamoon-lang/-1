'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks which in-page section is currently in view.
 *
 * Returns the id of the topmost intersecting section, or `null` before any
 * has been seen. Intended for a single-page nav that highlights where the
 * reader is.
 *
 * ## One observer, not one per section
 *
 * A `ScrollTrigger` (or an observer) per section means N callbacks racing on
 * every scroll frame, and N teardowns to get wrong. `docs/ROADMAP.md` names
 * this exact pattern as the birthplace of jank and leaks on a long page. One
 * `IntersectionObserver` watching every element costs one callback, and the
 * browser does the intersection maths off the main thread.
 *
 * ## Why it does not honour `prefers-reduced-motion`
 *
 * Deliberately. Highlighting the reader's position is information, not
 * animation — nothing moves, a colour changes. Suppressing it under the
 * preference would remove orientation from the readers most likely to need
 * it. The *transition* on that colour is what the preference governs, and
 * that lives in CSS where it belongs.
 *
 * ## Without JavaScript
 *
 * Nothing runs, so no section is marked active. The anchors themselves still
 * work — a highlight is an addition to navigation, never a prerequisite for
 * it.
 *
 * @param ids Section element ids, in document order.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null)

  // `ids.join()` rather than `ids`: callers build the array inline, so a new
  // identity arrives on every render and the effect would re-subscribe on each
  // one. The contents are what matter.
  const key = ids.join('|')

  useEffect(() => {
    const sectionIds = key === '' ? [] : key.split('|')
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }

        // Document order, not intersection order: entries arrive in whatever
        // order the browser batched them, and "the section I am reading" is
        // the first visible one from the top — not the most recently entered.
        const topmost = sectionIds.find((id) => visible.has(id)) ?? null
        setActive((current) => (current === topmost ? current : topmost))
      },
      {
        /*
         * A band across the upper-middle of the viewport rather than the whole
         * of it. Without the insets, two adjacent sections are both
         * "intersecting" for most of a scroll and the highlight changes far
         * earlier than the reader's attention does. -45% from the bottom puts
         * the trigger line near where someone actually reads; -20% from the
         * top keeps a section from staying active once it is mostly gone.
         */
        rootMargin: '-20% 0px -45% 0px',
      }
    )

    for (const element of elements) observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [key])

  return active
}
