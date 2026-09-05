/**
 * PracticeFilter — the work index's category chips.
 *
 * ## Links, and since Tahap 39 they narrow the catalogue rather than leave it
 *
 * Every chip is still an `<a>` to a real URL and the narrowing still happens
 * in GROQ on the server. Three things follow, and they came out of the
 * `ui-ux-pro-max` ritual recorded in `docs/stages/TAHAP-8.md` §1:
 *
 *  - **Deep Linking** — `/id/work?practice=commission` is a URL worth sending
 *    someone. A purely client-side filter would leave every view at the same
 *    address.
 *  - **Fast loading essential** (the Portfolio Grid pattern's own conversion
 *    note) — this ships zero client JavaScript. No state, no handlers, no
 *    hydration.
 *  - It works with JavaScript off, which matters here more than usual:
 *    `docs/AUDIT-2026-08.md` §2.6 found `/en` renders one word without it, and
 *    this page must not become a second instance of that.
 *
 * ## What it was, and why that was a defect
 *
 * Until Tahap 39 the chips pointed at `/practice/<value>` — a *different kind
 * of page*, with its own hero and statement. Pressing one left the catalogue
 * entirely, and because `app/[locale]/work/page.tsx` hardcoded
 * `practice={null}`, the `active` prop below was **always null**: "All" was
 * permanently current and **no chip could ever appear selected**. A control
 * that looks like a filter, behaves like navigation, and never shows its
 * state is a usability failure — it lies to the reader.
 *
 * Tahap 8 shipped `?practice=`; Tahap 10 removed it because under Cache
 * Components the Suspense boundary it then required left the page rendering
 * no work at all without JavaScript. Tahap 39 measured that again with
 * `export const instant = false`, which did not exist then: the failure does
 * not reproduce, and the numbers are in `app/[locale]/work/page.tsx`.
 *
 * `/practice/<value>` is untouched and still linked — from the project page,
 * the studio page and the home page. It answers "what is this practice";
 * this answers "what work is there". `docs/stages/TAHAP-15.md` §5.1.
 *
 * ## Chip Collection Reflow
 *
 * The skill rates this High: a chip row must wrap, never clip. The CSS uses
 * `flex-wrap` and no fixed height for exactly that reason — see the module.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'

import s from './practice-filter.module.css'

export interface DisciplineOption {
  /** Stored value. Unlocalized — see `schemas/project.ts`. */
  value: string
  /** Translated label. */
  label: string
  /** Localized URL for this view. Built by `app/[locale]/work/hrefs.ts`. */
  href: string
}

interface PracticeFilterProps {
  /** Label for the "no filter" chip. */
  allLabel: string
  /** Where the "no filter" chip points — the work index for this locale. */
  allHref: string
  options: DisciplineOption[]
  /** The active practice, or `null` for all. */
  active: string | null
  /** Accessible name for the group. */
  label: string
  className?: string | undefined
}

export function PracticeFilter({
  allLabel,
  allHref,
  options,
  active,
  label,
  className,
}: PracticeFilterProps) {
  // One chip fewer than two is not a filter, it is a label. Render nothing
  // rather than a control that cannot change anything.
  if (options.length < 2) return null

  const chips = [{ value: null, label: allLabel, href: allHref }, ...options]

  return (
    /*
      `data-practice-filter` is a test hook, and it earns its place.

      `e2e/catalogue-layout.e2e.ts` needs to ask "which chip is current", and
      proving that assertion red caught the instrument first: a structural
      selector matched the **header's** route navigation — added in Tahap 38,
      and carrying its own `aria-current` on `/work` — and reported the
      current chip as "Work". Naming the element is what stops an assertion
      passing on the wrong one.
    */
    <nav
      aria-label={label}
      data-practice-filter=""
      className={cn(s.filter, className)}
    >
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
                /*
                 * `morph`, not the default `cover` — Tahap 39.
                 *
                 * `lib/motion/navigation-signal.ts` defines `cover` as an
                 * overlay that exists "precisely to stop them seeing either"
                 * state, and `morph` as the announcement that the destination
                 * shares elements with this page so the overlay stands aside.
                 * Filtering keeps most of the cards, so it is a morph by that
                 * definition — and without this the `catalogue-sift`
                 * choreography would run entirely behind a curtain.
                 */
                transition="morph"
                /*
                 * The reader stays where they are.
                 *
                 * `components/ui/link` defaults to `scroll` because Tahap 15b
                 * measured what turning it off globally cost: every
                 * navigation inherited the previous page's offset and readers
                 * landed at the end of pages they had just opened. That
                 * argument is about going somewhere else. This is the same
                 * page with a shorter list, the chips sit at the top of it,
                 * and jumping the reader to the top of a page they are
                 * already near the top of is a jolt with nothing to show for
                 * it — measured at scroll 900, the reset moved the first card
                 * 933px, which the FLIP would then have had to animate.
                 */
                scroll={false}
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
