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
  useState,
} from 'react'

import {
  matchScore,
  type SearchEntry,
  type SearchKind,
} from '@/lib/content/search-index'

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
}

interface Group {
  /** The visible group heading. */
  value: string
  items: SearchEntry[]
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
}: CommandPaletteProps) {
  const t = useTranslations('search')
  const locale = useLocale()
  const router = useRouter()
  const hintId = useId()
  const [entries, setEntries] = useState<SearchEntry[]>([])
  /*
   * The query is controlled here because the ordering depends on it, and
   * `Autocomplete.Root` cannot order what it does not know is more relevant.
   * Filtering is therefore also ours — hence `filter={null}` below, which is
   * Base UI's way of being told the list arrived already filtered.
   */
  const [query, setQuery] = useState('')

  /*
   * One fetch, the first time this component exists.
   *
   * It exists only once the reader has asked for the palette, so this runs on
   * an intent rather than on a page load. A failed fetch leaves the list
   * empty and the designed empty state shows — the palette must never be the
   * thing that breaks a page it was opened from.
   */
  useEffect(() => {
    const controller = new AbortController()

    fetch(`/${locale}/search.json`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => {
        // Aborted, offline, or a bad response. The empty state is the answer.
      })

    return () => controller.abort()
  }, [locale])

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
              <Autocomplete.InputGroup className={s.inputGroup}>
                <span aria-hidden="true" className={s.inputIcon}>
                  ⌕
                </span>
                <Autocomplete.Input
                  className={s.input}
                  aria-label={t('label')}
                  aria-describedby={hintId}
                  placeholder={t('placeholder')}
                />
              </Autocomplete.InputGroup>

              {/*
                A real close control for anyone who cannot press Escape —
                visually hidden because the palette's own frame already reads
                as dismissible, and a visible ✕ inside a search field competes
                with the field's own clear affordance.
              */}
              <Dialog.Close className="sr-only">{t('close')}</Dialog.Close>

              <ScrollArea.Root className={s.listArea}>
                <ScrollArea.Viewport className={s.listViewport}>
                  <ScrollArea.Content>
                    <Autocomplete.Empty>
                      <p className={s.empty}>{t('empty')}</p>
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
                                onClick={(event: MouseEvent) =>
                                  navigate(event, entry.href)
                                }
                                // oxlint-disable-next-line react/forbid-elements, jsx-a11y/anchor-has-content, jsx-a11y/control-has-associated-label -- `components/ui/link` is the one import this file must not have (the chunk measurement above), and this anchor is a `render` prop: Base UI clones it with the item's children, so the content and label rules are judging an element that never renders empty.
                                render={<a href={entry.href} />}
                              >
                                <span className={s.itemLabel}>
                                  {entry.label}
                                </span>
                                {entry.meta && (
                                  <span className={cn('caption', s.itemMeta)}>
                                    {entry.meta}
                                  </span>
                                )}
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

              <p id={hintId} className={cn('caption', s.hint)}>
                {t('hint')}
              </p>
            </Autocomplete.Root>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
