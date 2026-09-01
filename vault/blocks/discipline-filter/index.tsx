/**
 * DisciplineFilter — the work index's category chips.
 *
 * ## Links to pages, not to query strings
 *
 * Every chip is an `<a>` to a real route and the narrowing happens in GROQ on
 * the server. Four things follow, and the first three came out of the
 * `ui-ux-pro-max` ritual recorded in `docs/stages/TAHAP-8.md` §1:
 *
 *  - **Deep Linking** — `/id/work/discipline/mural` is a URL worth sending
 *    someone. A client-side filter would leave every view at the same address.
 *  - **Fast loading essential** (the Portfolio Grid pattern's own conversion
 *    note) — this ships zero client JavaScript. No state, no handlers, no
 *    hydration.
 *  - It works with JavaScript off, which matters here more than usual:
 *    `docs/AUDIT-2026-08.md` §2.6 found `/en` renders one word without it, and
 *    this page should not become a second instance of that.
 *  - Each view is `○` static and separately indexable.
 *
 * The fourth is why the chips point at paths and not at `?discipline=`, which
 * is what Tahap 8 shipped. Under Cache Components a route that reads
 * `searchParams` must put its content behind a Suspense boundary, and that
 * content then reaches the reader only via an inline script — so the
 * query-string version rendered *no work at all* with JavaScript disabled,
 * recreating the very defect the bullet above cites. The measurement and the
 * two build errors behind it are in `app/[locale]/work/catalogue.tsx`.
 *
 * ## Chip Collection Reflow
 *
 * The skill rates this High: a chip row must wrap, never clip. The CSS uses
 * `flex-wrap` and no fixed height for exactly that reason — see the module.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'

import s from './discipline-filter.module.css'

export interface DisciplineOption {
  /** Stored value. Unlocalized — see `schemas/project.ts`. */
  value: string
  /** Translated label. */
  label: string
  /** Localized path for this view. Built by `app/[locale]/work/hrefs.ts`. */
  href: string
}

interface DisciplineFilterProps {
  /** Label for the "no filter" chip. */
  allLabel: string
  /** Where the "no filter" chip points — the work index for this locale. */
  allHref: string
  options: DisciplineOption[]
  /** The active discipline, or `null` for all. */
  active: string | null
  /** Accessible name for the group. */
  label: string
  className?: string | undefined
}

export function DisciplineFilter({
  allLabel,
  allHref,
  options,
  active,
  label,
  className,
}: DisciplineFilterProps) {
  // One chip fewer than two is not a filter, it is a label. Render nothing
  // rather than a control that cannot change anything.
  if (options.length < 2) return null

  const chips = [{ value: null, label: allLabel, href: allHref }, ...options]

  return (
    <nav aria-label={label} className={cn(s.filter, className)}>
      <ul className={s.list}>
        {chips.map((chip) => {
          const isActive = chip.value === active

          return (
            <li key={chip.value ?? 'all'}>
              <Link
                href={chip.href}
                className={cn('caption', s.chip)}
                // `MOTION-SPEC.md` §9. Both roles on one element: a chip is
                // its own acknowledgment.
                data-press="chip"
                data-intent=""
                // The accessible state, which the CSS then styles from — so
                // the visual and the announced state cannot desynchronise.
                {...(isActive && { 'aria-current': 'true' })}
              >
                {chip.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
