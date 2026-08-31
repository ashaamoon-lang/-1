/**
 * DisciplineFilter — the work index's category chips.
 *
 * ## Links, not buttons
 *
 * Every chip is an `<a>` to the same page with a different query string, and
 * the filtering happens on the server. Three things follow from that, and all
 * three came out of the `ui-ux-pro-max` ritual recorded in
 * `docs/stages/TAHAP-8.md` §1:
 *
 *  - **Deep Linking** — `/id/work?discipline=mural` is a URL worth sending
 *    someone. A client-side filter would leave every view at the same address.
 *  - **Fast loading essential** (the Portfolio Grid pattern's own conversion
 *    note) — this ships zero client JavaScript. No state, no handlers, no
 *    hydration.
 *  - It works with JavaScript off, which matters here more than usual:
 *    `docs/AUDIT-2026-08.md` §2.6 found `/en` renders one word without it, and
 *    this page should not become a second instance of that.
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
  /** Query value. Unlocalized — see `schemas/project.ts`. */
  value: string
  /** Translated label. */
  label: string
}

interface DisciplineFilterProps {
  /** Label for the "no filter" chip. */
  allLabel: string
  options: DisciplineOption[]
  /** The active discipline, or `null` for all. */
  active: string | null
  /** Where the chips point — the work index for this locale. */
  basePath: string
  /** Accessible name for the group. */
  label: string
  className?: string | undefined
}

export function DisciplineFilter({
  allLabel,
  options,
  active,
  basePath,
  label,
  className,
}: DisciplineFilterProps) {
  // One chip fewer than two is not a filter, it is a label. Render nothing
  // rather than a control that cannot change anything.
  if (options.length < 2) return null

  const chips = [{ value: null, label: allLabel }, ...options]

  return (
    <nav aria-label={label} className={cn(s.filter, className)}>
      <ul className={s.list}>
        {chips.map((chip) => {
          const isActive = chip.value === active

          return (
            <li key={chip.value ?? 'all'}>
              <Link
                href={
                  chip.value ? `${basePath}?discipline=${chip.value}` : basePath
                }
                className={cn('caption', s.chip)}
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
