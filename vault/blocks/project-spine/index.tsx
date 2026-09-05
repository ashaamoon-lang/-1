'use client'

import cn from 'clsx'
import { type CSSProperties, type ReactNode, useRef } from 'react'

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
  className?: string | undefined
}

export function ProjectSpine({
  label,
  regions,
  children,
  className,
}: ProjectSpineProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useActiveInSequence(rootRef, '[data-region]', regions.length)

  return (
    <div ref={rootRef} className={cn(s.layout, className)}>
      {/*
        Two rows would be an index of nothing. One region means the page has
        no structure to show, and a control that cannot tell you anything is
        worse than its absence — the same rule `practice-filter` applies to
        a single chip.
      */}
      {regions.length > 1 && (
        <nav aria-label={label} className={s.spine} data-project-spine="">
          <p className={cn('caption', s.spineLabel)}>{label}</p>
          <ol className={s.list}>
            {regions.map((region, index) => (
              <li
                key={region.id}
                className={cn('caption', s.row)}
                // The state the CSS styles from, so what is announced and
                // what is drawn cannot drift apart.
                {...(index === active && { 'data-active': '' })}
              >
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
        </nav>
      )}

      <div className={s.content}>{children}</div>
    </div>
  )
}
