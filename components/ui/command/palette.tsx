'use client'

import { Autocomplete } from '@base-ui/react/autocomplete'
import { Dialog } from '@base-ui/react/dialog'
import { ScrollArea } from '@base-ui/react/scroll-area'
import cn from 'clsx'
import type { Route } from 'next'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  type MouseEvent,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  matchScore,
  type SearchEntry,
  type SearchKind,
} from '@/lib/content/search-index'
import { duration, easing, stagger } from '@/vault/motion/tokens'

import s from './command.module.css'

/**
 * The palette itself — everything Base UI, loaded on first open.
 *
 * Nothing here is on any route's initial graph. `./index.tsx` explains the
 * split and why `e2e/route-budget.e2e.ts` is the gate that proves it.
 *
 * ## Why the rows are anchors, and why not the site's own `Link`
 *
 * They are anchors because a palette whose rows are buttons quietly takes
 * away middle-click, copy-link, and the announcement "link" — and because an
 * `href` is what makes a result a place rather than an action.
 *
 * They are **not** `components/ui/link`, and that is a measurement rather
 * than a preference. `components/ui/link` also lives in the header's eager
 * chunk, so importing it here put a module in both an eager chunk and this
 * async one; webpack resolved that by duplicating the whole header group,
 * and `/en/work` went from 871 KB to 914 KB — over its ceiling — for code
 * that had already been downloaded. Measured both ways:
 *
 * | palette imports        | `/en/work` | eager copies of the header chunk |
 * | ---------------------- | ---------- | -------------------------------- |
 * | `components/ui/link`   | 914 KB     | 2                                |
 * | a plain anchor         | 880 KB     | 1                                |
 *
 * What is lost by not using it — locale prefixing — this index does not need:
 * every href it builds already carries its locale. What would have been lost
 * by using a bare anchor, a client-side navigation, is put back by the click
 * handler below, which is Next's own router and is already on every page.
 *
 * ## The row choreography, and why it is not GSAP
 *
 * The rows rise and fade in on open, staggered. That is written with the Web
 * Animations API rather than the site's usual GSAP, and the reason is the
 * measurement Tahap 28 ended on: a module shared between an eager chunk and
 * this async one makes webpack duplicate the whole chunk group. GSAP is in
 * the eager graph of most routes here, so importing it into the palette risks
 * paying for it twice on every page — for an animation nobody has opened.
 *
 * `element.animate()` costs nothing to import, runs on the compositor rather
 * than on a timer, and therefore does **not** add the second `requestAnimation
 * Frame` loop `CLAUDE.md` #6 forbids. It moves `transform` and `opacity` only
 * (#4), reads its numbers from `vault/motion/tokens.ts` — which is types and
 * constants, so it carries no runtime weight — and is skipped entirely under
 * `prefers-reduced-motion`, leaving every row at its final, fully visible
 * state (#5).
 *
 * ## Why the filtering and the ordering are ours
 *
 * Base UI filters on the item's string value, which here is the title. That
 * would make this a second navigation menu: typing a client's name would find
 * nothing, because the client is not in the title.
 *
 * So matching happens against everything the row *shows*, and the ordering
 * comes with it — `matchScore` in `lib/content/search-index.ts` carries the
 * measurement that forced this. In short: matching on the whole row is what
 * makes a client findable, and it is also what let a passing mention in a
 * page description outrank an entry's own title. Ranking is what keeps both
 * true, and it applies to the groups as well as the rows inside them: the
 * group holding the best answer is the one shown first, so the highlight —
 * and therefore Enter — lands on it.
 */

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Where focus goes on close, when the default — whatever was focused before
   * — would strand the reader. `./index.tsx` records when that happens.
   */
  finalFocus?: RefObject<HTMLElement | null> | undefined
  /**
   * The index, handed in rather than fetched.
   *
   * Ordinary dependency injection, and it exists because the alternative was
   * worse: a Storybook story for this component would otherwise have to stub
   * `fetch`, and what it then showed would be a mock of the plumbing rather
   * than the component. With this, the story renders the real thing over real
   * entries.
   *
   * It is also the seam for handing the index over from the server one day,
   * with no round trip — see `app/[locale]/search.json/route.ts` for why that
   * is not how it works today.
   */
  entries?: readonly SearchEntry[] | undefined
}

interface Group {
  /** The visible group heading. */
  value: string
  items: SearchEntry[]
}

/*
 * How far a row travels as it arrives.
 *
 * Small on purpose: `ui-ux-pro-max --domain gsap` puts a list stagger at 8px,
 * and a result row that travels further reads as a card flying in rather than
 * a line of an index settling.
 */
const ROW_RISE_PX = 8

/**
 * How many rows are staggered before the rest arrive together.
 *
 * Without a cap the last of seventeen rows waited `16 × 40ms + 200ms` = 840ms
 * to finish arriving, and axe — auditing while they were still part-way
 * through their fade — reported three `color-contrast` failures that vanished
 * on the retry. Both halves of that are the same defect: content that is
 * still becoming legible almost a second after a surface whose whole promise
 * is speed.
 *
 * `ui-ux-pro-max --domain gsap` gives the shape of the rule — keep the step
 * small on lists over ten items, and watch the total. Eight is the count that
 * fits a screen here, so it staggers what a reader can actually watch arrive
 * and lets everything below the fold come with the eighth row.
 */
const MAX_STAGGERED_ROWS = 8

/**
 * What an empty list means, which depends on why it is empty.
 *
 * A `satisfies` table rather than a chain of ternaries: the project's lint
 * forbids nested ternaries, and this way the compiler proves every state has
 * something to say instead of a fallback quietly covering a missing one.
 */
const EMPTY_TITLE_KEY = {
  loading: 'loading',
  failed: 'failed',
  ready: 'empty',
} satisfies Record<string, string>

const EMPTY_BODY_KEY = {
  loading: 'loading',
  failed: 'hint',
  ready: 'emptyHint',
} satisfies Record<string, string>

/** `1` -> `01`. Two digits, the same counter shape as `step-sequence`. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** The order groups appear in, which is the site's own order. */
const KIND_ORDER: readonly SearchKind[] = [
  'page',
  'practice',
  'project',
  'journal',
]

export function CommandPalette({
  open,
  onOpenChange,
  finalFocus,
  entries: given,
}: CommandPaletteProps) {
  const t = useTranslations('search')
  const locale = useLocale()
  const router = useRouter()
  const hintId = useId()
  const [fetched, setFetched] = useState<SearchEntry[]>([])
  /*
   * Three states, because they say three different things.
   *
   * Measured before this existed: the index is fetched when the palette first
   * opens, so for the whole of that round trip the palette rendered its empty
   * state — "Nothing matches that", over `00 / 00`, in answer to a query the
   * reader had not typed yet. Throttled to 900ms it was the first thing on
   * screen for 900ms. A failed fetch said the same thing, which was worse:
   * not "nothing matched" but "search is broken", told as if it were a result.
   */
  const [fetchStatus, setFetchStatus] = useState<
    'loading' | 'ready' | 'failed'
  >('loading')

  // Given entries are ready by definition; there is nothing to wait for.
  const entries = given ?? fetched
  const status = given ? ('ready' as const) : fetchStatus
  /*
   * The query is controlled here because the ordering depends on it, and
   * `Autocomplete.Root` cannot order what it does not know is more relevant.
   * Filtering is therefore also ours — hence `filter={null}` below, which is
   * Base UI's way of being told the list arrived already filtered.
   */
  const [query, setQuery] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  /*
   * One fetch, the first time this component exists.
   *
   * It exists only once the reader has asked for the palette, so this runs on
   * an intent rather than on a page load. A failed fetch leaves the list
   * empty and the designed empty state shows — the palette must never be the
   * thing that breaks a page it was opened from.
   */
  useEffect(() => {
    if (given) return

    const controller = new AbortController()

    fetch(`/${locale}/search.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json()
      })
      .then((data: SearchEntry[]) => {
        setFetched(data)
        setFetchStatus('ready')
      })
      .catch(() => {
        // An abort is this effect being cleaned up, not a failure the reader
        // should be told about; the component is going away either way.
        if (!controller.signal.aborted) setFetchStatus('failed')
      })

    return () => controller.abort()
  }, [locale, given])

  const groups = useMemo<Group[]>(() => {
    const scored = entries
      .map((entry) => ({ entry, score: matchScore(entry, query) }))
      .filter((row) => row.score > 0)

    const byKind = new Map<SearchKind, typeof scored>()
    for (const row of scored) {
      const bucket = byKind.get(row.entry.kind)
      if (bucket) bucket.push(row)
      else byKind.set(row.entry.kind, [row])
    }

    return (
      KIND_ORDER
        // A group with nothing in it is a heading over a void — the journal
        // group before the studio publishes, or any group the query excludes.
        .flatMap((kind) => {
          const rows = byKind.get(kind)
          if (!rows || rows.length === 0) return []

          return [
            {
              kind,
              /*
               * `toSorted`, and the comparison is score only: it is a stable
               * sort, so rows that answer equally well keep the order the
               * index built them in — newest work first, newest writing first.
               */
              rows: rows.toSorted((a, b) => b.score - a.score),
              best: Math.max(...rows.map((row) => row.score)),
            },
          ]
        })
        /*
         * Groups follow their best answer, and `KIND_ORDER` breaks the ties.
         * With no query every score is 1, so this is a no-op and the resting
         * list is the site's own order.
         */
        .toSorted((a, b) => b.best - a.best)
        .map((group) => ({
          value: t(`groups.${group.kind}`),
          items: group.rows.map((row) => row.entry),
        }))
    )
  }, [entries, query, t])

  /*
   * Client-side navigation, without taking the anchor's own behaviour away.
   *
   * A modified click — a new tab, a new window, a download — belongs to the
   * browser, so those are left alone and only the plain left click is
   * intercepted. Base UI activates the highlighted row on Enter by clicking
   * it, so this is the keyboard path too.
   */
  function navigate(event: MouseEvent, href: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()
    onOpenChange(false)
    /*
     * SAFETY: every href in the index is built by `localizedPath` from a
     * route this app declares — the static catalogue, a practice, a project
     * slug, or a journal slug — so it names a real route by construction.
     * `Route` is a compile-time brand with no runtime check behind it, and
     * this value has crossed a JSON boundary, so the guarantee is the
     * builder's rather than the type's. A slug that has been unpublished
     * lands on the not-found page, which is the correct answer and not a
     * crash.
     */
    router.push(href as Route)
  }

  /* How many rows the query left, for the counter in the head. */
  const shown = groups.reduce((total, group) => total + group.items.length, 0)

  /*
   * The rows arrive.
   *
   * Two behaviours, because they answer different questions. On open the list
   * is new, so it is staggered — the reader's eye is drawn down it. On a
   * query change the list is *re-settling*, so every row moves at once: a
   * full stagger on each keystroke reads as seasickness rather than
   * craft, and typing has to feel immediate.
   *
   * The list is readable before the motion finishes either way. Motion that
   * withholds content on a surface whose whole promise is speed would be the
   * defect, not the feature.
   */
  useEffect(() => {
    if (!open) return

    const list = listRef.current
    if (!list) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rows = [...list.querySelectorAll('[data-search-row]')]
    const staggered = query.trim() === ''
    const animations = rows.map((row, index) =>
      row.animate(
        [
          { opacity: 0, transform: `translateY(${ROW_RISE_PX}px)` },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: duration.fast * 1000,
          delay: staggered
            ? Math.min(index, MAX_STAGGERED_ROWS) * stagger.items * 1000
            : 0,
          easing: easing.outQuart.bezier,
          fill: 'backwards',
        }
      )
    )

    return () => {
      // Cancelling leaves each row at its own final style, which is the
      // rendered one — the same contract `CLAUDE.md` #5 asks of every effect
      // here, applied to interruption rather than to a preference.
      for (const animation of animations) animation.cancel()
    }
  }, [open, query, groups])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={s.backdrop} />
        <Dialog.Viewport className={s.viewport}>
          <Dialog.Popup
            className={s.popup}
            aria-label={t('label')}
            {...(finalFocus && { finalFocus })}
          >
            <Autocomplete.Root
              open
              inline
              items={groups}
              value={query}
              onValueChange={setQuery}
              filter={null}
              autoHighlight="always"
              keepHighlight
              itemToStringValue={(entry: SearchEntry) => entry.label}
            >
              <div className={s.head}>
                <Autocomplete.InputGroup className={s.inputGroup}>
                  <span aria-hidden="true" className={s.inputIcon}>
                    ⌕
                  </span>
                  <Autocomplete.Input
                    className={cn('p-big', s.input)}
                    aria-label={t('label')}
                    aria-describedby={hintId}
                    placeholder={t('placeholder')}
                  />
                </Autocomplete.InputGroup>

                {/*
                  `03 / 17` — the counter `vault/blocks/step-sequence` uses for
                  "where am I in this run", answering here how much of the
                  index the query has left. `aria-hidden` because the listbox
                  already announces its own count, and hearing both is
                  duplication rather than help.
                */}
                {status === 'ready' && (
                  <p className={cn('caption', s.count)} aria-hidden="true">
                    <span className={s.countCurrent}>{pad(shown)}</span>
                    {` / ${pad(entries.length)}`}
                  </p>
                )}
              </div>

              {/*
                A real close control for anyone who cannot press Escape —
                visually hidden because the palette's own frame already reads
                as dismissible, and a visible ✕ inside a search field competes
                with the field's own clear affordance.
              */}
              <Dialog.Close className="sr-only">{t('close')}</Dialog.Close>

              <ScrollArea.Root className={s.listArea}>
                <ScrollArea.Viewport className={s.listViewport}>
                  <ScrollArea.Content ref={listRef}>
                    <Autocomplete.Empty>
                      <div className={s.empty}>
                        {/*
                          `aria-live` so the state is announced when it
                          changes under a reader who is already in the field,
                          rather than being a silent swap of visible text.
                        */}
                        <p
                          className={cn('p-big', s.emptyTitle)}
                          aria-live="polite"
                        >
                          {t(EMPTY_TITLE_KEY[status])}
                        </p>
                        {status !== 'loading' && (
                          <p className={s.emptyBody}>
                            {t(EMPTY_BODY_KEY[status])}
                          </p>
                        )}
                      </div>
                    </Autocomplete.Empty>

                    <Autocomplete.List className={s.list}>
                      {(group: Group) => (
                        <Autocomplete.Group
                          key={group.value}
                          items={group.items}
                          className={s.group}
                        >
                          <Autocomplete.GroupLabel
                            className={cn('caption', s.groupLabel)}
                          >
                            {group.value}
                          </Autocomplete.GroupLabel>
                          <Autocomplete.Collection>
                            {(entry: SearchEntry) => (
                              <Autocomplete.Item
                                key={entry.id}
                                value={entry}
                                className={s.item}
                                data-search-row=""
                                onClick={(event: MouseEvent) =>
                                  navigate(event, entry.href)
                                }
                                // oxlint-disable-next-line react/forbid-elements, jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- `components/ui/link` is the one import this file must not have (the chunk measurement above), and this anchor is a `render` prop: Base UI clones it with the item's children, so the content and label rules are judging an element that never renders empty.
                                render={<a href={entry.href} />}
                              >
                                {/*
                                  The rail comes first in the DOM as well as
                                  on screen, so the reading order a screen
                                  reader follows is the one the grid shows:
                                  the fact, then the name, then the promise.
                                */}
                                <span className={cn('caption', s.itemMeta)}>
                                  {entry.meta}
                                </span>
                                <span className={cn('p-big', s.itemLabel)}>
                                  {entry.label}
                                </span>
                                <span className={s.itemDescription}>
                                  {entry.description}
                                </span>
                              </Autocomplete.Item>
                            )}
                          </Autocomplete.Collection>
                        </Autocomplete.Group>
                      )}
                    </Autocomplete.List>
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar className={s.scrollbar}>
                  <ScrollArea.Thumb className={s.scrollbarThumb} />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>

              <p id={hintId} className={cn('caption', s.foot)}>
                <span>{t('hint')}</span>
                <span className={s.footKeys} aria-hidden="true">
                  ↑↓
                </span>
              </p>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
