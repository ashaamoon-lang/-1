'use client'

/**
 * The journal index's rows, and the one that is being read.
 *
 * ## Why this is a client island rather than the whole page
 *
 * `app/[locale]/journal/page.tsx` is a Server Component: it resolves the CMS
 * against the scaffolding, formats dates in the reader's locale, and reads
 * translations on the server. None of that should move to the client to make
 * three rows respond to a scroll position. So the page keeps that work and
 * hands this component the rows it has already resolved.
 *
 * ## What it adds, and the measurement behind it
 *
 * Tahap 26 shipped this index with a container reveal and nothing else, and
 * all four of its reveal items sat above the fold: the entrance fired once on
 * the first frame and the page was static from then on. Measured at four
 * scroll positions, the three rows reported `1.00 1.00 1.00` every time — on
 * a page whose entire content is three headlines.
 *
 * So the row at the reading line leads and the others recede, using the same
 * `useActiveInSequence` the studio page's process uses. That is deliberate
 * reuse rather than a second mechanism: `CLAUDE.md` closes on restraint
 * applied *consistently*, and a behaviour that lives on one page is an
 * exception rather than a vocabulary.
 *
 * **Scroll-led, not pointer-led.** An index that only answers a mouse does
 * not exist on a phone, and the journal index is the page most likely to be
 * read on one.
 */

import cn from 'clsx'
import { useRef, ViewTransition } from 'react'

import { Link } from '@/components/ui/link'
import type { JournalEntry } from '@/lib/content/journal-fallback'
import { transitionName } from '@/lib/motion/transition-name'
import { useActiveInSequence } from '@/vault/motion/use-active-in-sequence'

import s from './page.module.css'

export interface JournalRow extends JournalEntry {
  /** Formatted on the server, in the reader's locale. */
  dateLabel: string
  /** The practice's display name, or null. */
  practiceLabel: string | null
}

export function JournalIndexRows({ rows }: { rows: readonly JournalRow[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useActiveInSequence(
    rootRef,
    '[data-journal-entry]',
    rows.length
  )

  /*
   * Two elements per row, because two systems own `opacity` here and they
   * cannot own it on the same one.
   *
   * `Reveal` sets `[data-reveal-item] { opacity: 0 }` and then 1 when the
   * container enters; the recede sets its own value for a row that is not
   * being read. Declared on one element they fight, and the reveal wins on
   * source order — measured: every row reported `1.00` at every scroll
   * position while the recede sat in the stylesheet doing nothing.
   *
   * So the `<article>` keeps the entrance and the inner element carries the
   * lead, and `data-journal-entry` sits on the one whose opacity the gate
   * should be reading.
   */
  return (
    <div ref={rootRef} className={s.list}>
      {rows.map((row, index) => (
        <article className={s.entry} data-reveal-item key={row.slug}>
          <div
            className={s.row}
            // Read by `e2e/motion.e2e.ts`, which measures whether the lead moves.
            data-journal-entry=""
            /*
             * Presence, not a boolean string — an absent attribute is the off
             * state, and `data-active="false"` would still match
             * `[data-active]`.
             */
            {...(index === active && { 'data-active': '' })}
          >
            <p className={cn('caption', s.date)}>
              {row.date ? (
                <time dateTime={row.date}>{row.dateLabel}</time>
              ) : null}
              {row.practiceLabel ? (
                <span className={s.practice}>{row.practiceLabel}</span>
              ) : null}
            </p>

            {/*
              `journal-transport` — Tahap 41. The headline the reader chose is
              the headline they get: it carries itself to the entry rather
              than being replaced by one that happens to read the same.

              The name is composed from `transitionName`, as both ends of
              every pair on this site are, because the whole mechanism is a
              string match — a typo produces no error and no morph. The
              `journal-` prefix keeps entry slugs out of the space work slugs
              already occupy.
            */}
            <ViewTransition
              name={transitionName(`journal-${row.slug}`)}
              share="morph"
              default="none"
            >
              <h2 className={cn('h2', s.entryTitle)}>
                {/*
                  The whole row is the target, but the link wraps the title
                  only and is stretched over the row in CSS. That keeps one
                  accessible name on one control instead of an anchor whose
                  name would be the date, the title and the summary read as
                  one sentence.
                */}
                <Link
                  href={`/journal/${row.slug}`}
                  className={s.link}
                  // `MOTION-SPEC.md` §9 — the row is a pressable noun.
                  data-press="entry"
                  data-intent=""
                  /*
                    Stands the route overlay down for this navigation so the
                    title above can morph instead. `lib/motion/navigation-
                    signal.ts` defines `cover` as an overlay that exists
                    "precisely to stop them seeing either" state, so without
                    this the whole moment runs behind a curtain — measured on
                    the catalogue in Tahap 39.
                  */
                  transition="morph"
                  /*
                    The moment's name, for §9.5's budget sampler. It spends
                    nothing at load: it moves on navigation, exactly like
                    `work-transport` on the catalogue card.
                  */
                  data-epic="journal-transport"
                >
                  {row.title}
                </Link>
              </h2>
            </ViewTransition>

            <p className={s.summary}>{row.summary}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
