'use client'

import cn from 'clsx'
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'
import { CopyLink } from '@/vault/blocks/copy-address/copy-link'
import { EntryArrow } from '@/vault/motion/entry-arrow'
import { RouteMarker } from '@/vault/motion/route-marker'
import { useActiveInSequence } from '@/vault/motion/use-active-in-sequence'

import s from './project-spine.module.css'

/**
 * ProjectSpine — where the reader is in a page that is 4.7 screens long.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Composes `vault/motion/use-active-in-sequence`, which was extracted in
 * Tahap 27 for exactly this reason: a mechanism that lives on one page is not
 * a vocabulary, it is an exception.
 *
 * ## The defect
 *
 * `docs/stages/TAHAP-40.md` §1: the project page is the site's second-longest
 * and is **one undifferentiated scroll** — 4.7 screens with not a single
 * subheading. A reader has no sense of how much is left or what kinds of
 * thing are below.
 *
 * ## It indexes regions, not chapters, and that is a content constraint
 *
 * The plan for this stage named the rows *Brief · Approach · The work ·
 * Outcome*. Those sections **do not exist**: `schemas/project.ts` gives a
 * project one `body` of Portable Text per locale, so there is no Brief and no
 * Outcome to point at. Writing them would be inventing content, which this
 * project forbids outright.
 *
 * So the rows name the regions the page actually renders — the hero, the
 * prose, the gallery, the way onward — and a row exists only when its region
 * does. A project with no gallery gets no Images row rather than a link to
 * nothing, which is the same class of lie Tahap 39 removed from the filter.
 *
 * **If the studio later writes headings into `body`, this should be rebuilt
 * from those headings.** Regions are the honest answer for the content that
 * exists today; saying so now is cheaper than discovering it later.
 *
 * ## Not a §9.5 moment
 *
 * The spine has no beginning and no end — it is a continuous response to
 * reading position, the third category Tahap 42 will name. The project page
 * spends its one named moment on `project-arrival`; this does not touch the
 * budget, and `e2e/interaction-grammar.e2e.ts` measures that claim.
 *
 * ## Why it wraps rather than sits beside
 *
 * `useActiveInSequence` needs a ref to the element containing the regions,
 * and the page that renders them is a server component. Wrapping is what lets
 * one client component own both the ref and the two-column layout while the
 * regions themselves stay server-rendered and pass through as `children`.
 *
 * ## A link to the section being read
 *
 * Given `copy`, the spine ends with a control that copies this page's address
 * with the section the reader is in — Orientasi, stage 3 — so a reader can send
 * a colleague the outcome rather than the whole case. It sits after the list,
 * never in a row, so the rows still match the regions one for one.
 *
 * ## Where the reader came in
 *
 * A link with a section in it — the one a colleague copied — brings the reader
 * straight to that section, and the spine marks its row with an entrance
 * arrow (`vault/motion/entry-arrow`, the `section-entry` moment) that stays as
 * they read on. The section is read from the address on hydration and on
 * `hashchange`; the server, which never sees a fragment, marks nothing.
 *
 * ## The facts that follow
 *
 * Given `facts`, the spine keeps the case's name and year once the hero's
 * title has left the screen — Tata & Gerak, stage 4, `following-facts`.
 * Halfway down a 4.7-screen page nothing on screen says which work it is.
 * The name takes the place of the index's own label: the label lifts away
 * as the name rises in, in the same cell, so nothing below moves. Desktop
 * only, where the label is shown; `aria-hidden`, because it repeats the
 * page's `h1`; and with no script there is no handover, and the label
 * stays.
 *
 * ## One line on a phone
 *
 * Below the breakpoint the spine is a strip held over the reading, and every
 * line it gains is a line of the case it hides — so its rows never wrap.
 * More than fit scroll sideways, and the current row is brought to the
 * strip's middle as the page moves on: the strip scrolls, never the page.
 * The current row is marked by the header's own rule
 * (`vault/motion/route-marker`, following the current item) sliding under
 * it along the strip's edge, which also replaces the desktop's sideways
 * nudge — in a row of words that nudge only made the gaps uneven. Tata &
 * Gerak, stage 4.
 */

export interface SpineRegion {
  /** The `id` on the region, and the fragment this row links to. */
  id: string
  label: string
}

interface ProjectSpineProps {
  /** Accessible name for the index. */
  label: string
  /**
   * In document order, and only regions that actually rendered. The caller
   * decides — it is the only thing that knows whether a gallery exists.
   */
  regions: readonly SpineRegion[]
  children: ReactNode
  /** The words for copying a link to the section being read. */
  copy?: SectionCopyLabels | undefined
  /** What the case is, kept in the spine once the page's `h1` has gone. */
  facts?: SpineFacts | undefined
  className?: string | undefined
}

/** The case's name and date, as its hero gives them. */
export interface SpineFacts {
  title: string
  /** The year the case is dated, if it is. */
  year: number | null
}

/** Already localized — what the section-link control and its status say. */
export interface SectionCopyLabels {
  /** "Copy section link". */
  label: string
  /** What the status says once the link is copied. */
  copied: string
  /** What the status says when the browser refuses. */
  failed: string
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** The section the address points at, decoded; '' when it points at none. */
function readHash(): string {
  const fragment = window.location.hash.slice(1)
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

function noHashOnServer(): string {
  return ''
}

export function ProjectSpine({
  label,
  regions,
  children,
  copy,
  facts,
  className,
}: ProjectSpineProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useActiveInSequence(rootRef, '[data-region]', regions.length)
  const arrived = useSyncExternalStore(
    subscribeToHash,
    readHash,
    noHashOnServer
  )

  /*
   * Whether the page's title has gone off the top of the screen. Told by an
   * observer on the `h1`, so it is a state change and not a frame loop, and
   * it is right on arrival mid-page — a copied section link — as well.
   */
  const [past, setPast] = useState(false)
  const following = facts !== undefined
  useEffect(() => {
    const title = rootRef.current?.querySelector('h1')
    if (!following || !title) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return
      setPast(
        !entry.isIntersecting &&
          entry.boundingClientRect.bottom <= (entry.rootBounds?.top ?? 0)
      )
    })
    observer.observe(title)
    return () => observer.disconnect()
  }, [following])

  /*
   * The current row, brought to the middle of a strip that scrolls. Only the
   * strip moves; on a desktop, where the rows are a column, there is nothing
   * to scroll and this does nothing.
   */
  const stripRef = useRef<HTMLDivElement>(null)
  const reduced = usePreferredReducedMotion()
  useEffect(() => {
    const strip = stripRef.current
    const row = strip?.querySelectorAll('li')[active]
    if (!strip || !row || strip.scrollWidth <= strip.clientWidth) return
    strip.scrollTo({
      left: row.offsetLeft + row.offsetWidth / 2 - strip.clientWidth / 2,
      behavior: reduced ? 'instant' : 'smooth',
    })
  }, [active, reduced])

  return (
    <div ref={rootRef} className={cn(s.layout, className)}>
      {/*
        Two rows would be an index of nothing. One region means the page has
        no structure to show, and a control that cannot tell you anything is
        worse than its absence — the same rule `practice-filter` applies to
        a single chip.
      */}
      {regions.length > 1 && (
        <nav
          aria-label={label}
          className={s.spine}
          data-project-spine=""
          {...(past && { 'data-past': '' })}
        >
          <div className={s.head}>
            <p className={cn('caption', s.spineLabel)}>{label}</p>
            {facts && (
              <p
                aria-hidden="true"
                className={cn('caption', s.facts)}
                data-epic="following-facts"
              >
                <span className={s.factsTitle}>{facts.title}</span>
                {facts.year !== null && <span>{facts.year}</span>}
              </p>
            )}
          </div>
          <div ref={stripRef} className={s.strip}>
            <ol className={s.list} data-epic="section-entry">
              {regions.map((region, index) => (
                <li
                  key={region.id}
                  className={cn('caption', s.row)}
                  // The state the CSS styles from, so what is announced and
                  // what is drawn cannot drift apart.
                  {...(index === active && { 'data-active': '' })}
                  {...(region.id === arrived && { 'data-arrived': '' })}
                >
                  <EntryArrow />
                  {/* oxlint-disable-next-line react/forbid-elements -- deliberate
                    native anchor, the same reasoning the header's section nav
                    carries: a same-page hash must use the browser's own
                    handling so it still works with JavaScript disabled, which
                    is a stated Tahap 3 exit criterion. Lenis picks it up on
                    this route because `<Wrapper lenis={{ anchors: true }}>`. */}
                  <a
                    href={`#${region.id}`}
                    className={s.link}
                    data-press="spine"
                    data-intent=""
                    {...(index === active && { 'aria-current': 'true' })}
                  >
                    {region.label}
                  </a>
                </li>
              ))}
            </ol>
            {/* The phone's current-row rule; the desktop has its rail. */}
            <RouteMarker follows="current" className={s.marker} />
          </div>
          {/*
            The rail. `aria-hidden` because it repeats what the list already
            says: a progress bar beside an index that marks its own current
            row is a second announcement of one fact.
          */}
          <div className={s.rail} aria-hidden="true">
            <div
              className={s.railFill}
              /*
               * SAFETY: `style` is typed as `CSSProperties`, which has no
               * index signature for custom properties, so a custom property
               * cannot be expressed without widening. The value is a number
               * this component computed — `active` is bounded by the hook to
               * the item count, and `regions.length` is non-zero inside this
               * branch — so nothing untyped crosses the boundary; the
               * assertion only re-states what React itself accepts at runtime.
               *
               * `scaleY` only, never `height`, which is layout
               * (`CLAUDE.md` #4). The value is read position, not time, so it
               * carries no duration of its own; the transition in the
               * stylesheet is what turns a step into a slide.
               */
              style={
                {
                  '--spine-progress': `${(active + 1) / regions.length}`,
                } as CSSProperties
              }
            />
          </div>
          {copy && (
            <CopyLink
              hash={(regions[Math.max(active, 0)] ?? regions[0])?.id ?? ''}
              className={s.copyLink}
              {...copy}
            />
          )}
        </nav>
      )}

      <div className={s.content}>{children}</div>
    </div>
  )
}
