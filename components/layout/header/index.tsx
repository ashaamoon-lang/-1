'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import type { CSSProperties, MouseEvent } from 'react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { CommandTrigger } from '@/components/ui/command'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { getLinkIntent, Link } from '@/components/ui/link'
import { usePathname } from '@/lib/i18n/navigation'
import { RouteMarker } from '@/vault/motion/route-marker'

import s from './header.module.css'

/**
 * Site header.
 *
 * Replaces the Satūs starter header, which showed a "Satūs" wordmark, the raw
 * pathname as a debug readout, and links to darkroom's own repository. Useful
 * while forking; not something to ship on a studio's site.
 *
 * ## The in-page anchors belonged to the page, and now nothing links them
 *
 * The home page is one long page (`docs/ROADMAP.md` §1.2), and until Tahap 54
 * this header rendered its four section anchors alongside the three routes —
 * seven links, two of them duplicating a route's own name. `ROUTE_LINKS`
 * below carries the argument and the count.
 *
 * The sections did not disappear; the *shortcut* to them did. They are
 * reached by reading the page, which is what a page that long is for, and the
 * header now answers only "what pages does this site have".
 *
 * ## Locale
 *
 * Every internal link goes through `components/ui/link`, which routes through
 * next-intl so the reader's language survives the navigation. `usePathname`
 * here is next-intl's too — it returns the path with the prefix stripped, so
 * active-state comparison is template-against-template. Using the bare
 * `next/navigation` version compares `/id` against `/`, which is never equal,
 * and every item renders inactive. See `components/ui/link/link.test.ts`.
 *
 * ## One navigation, which on a phone is a popover — the fork
 *
 * MENU was a React state toggle over a dropdown of three 11px mono links.
 * With scripting off the button did nothing and the nav stayed
 * `display: none`, so a phone had no route links in its header at all; only
 * the footer led anywhere (the design-critique workflow, deferred item 9).
 *
 * Now the nav **is** a `popover="auto"`, and MENU its `popovertarget`: the
 * browser opens it, closes it on Escape or a tap outside, returns focus to
 * the button — none of it needs a script. On a phone it is a sheet under the
 * bar with the three routes at display size; on desktop the same element is
 * the header's row, as it always was.
 *
 * One element, not two. The first version of this rendered a second nav for
 * the sheet, and that put a hidden copy of every route link — and a second
 * `aria-current` — into the desktop page. Five gates walked into it, each
 * reasonably: a "first link to /en/practice/…" or "every `[data-press]`" that
 * landed on a link nobody could see. The sheet also carried the practices;
 * they are gone from it for the reason `ROUTE_LINKS` gives — this nav answers
 * "what pages does this site have", and the footer's index lists the
 * practices on every page.
 *
 * What the script adds (each from review): the button reads "Close" while
 * the sheet is open, read from the element so a tap before hydration counts;
 * focus landing anywhere outside the sheet closes it, and what it covers is
 * `inert` while it covers it, so neither Tab nor a screen reader ends up on
 * content hidden under an opaque sheet; a link that navigates closes it,
 * because each page renders its own header and Next keeps the previous page
 * in a hidden `<Activity>` — without this, Back reveals that page with its
 * sheet still open; MENU targets its own nav by reference, because that
 * `<Activity>` also means two `#header-nav` in one document; crossing into
 * desktop closes it; and a browser without `popover` gets a plain toggle with
 * `aria-expanded`, Escape, a tap outside, and focus handed back.
 */

// In local dev, link straight to the Storybook dev server. In deployed builds,
// link to the /storybook proxy (see next.config.ts), shown only when
// NEXT_PUBLIC_STORYBOOK_URL is configured — so a production build with no
// Storybook host shows no link.
const STORYBOOK_HREF =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:6006'
    : '/storybook/'
const STORYBOOK_ENABLED =
  process.env.NODE_ENV === 'development' ||
  Boolean(process.env.NEXT_PUBLIC_STORYBOOK_URL)

/**
 * The whole of the primary navigation: the site's routes, and nothing else.
 *
 * Locale-free templates: `components/ui/link` adds the prefix itself, and
 * handing it `/en/work` would produce `/en/en/work`.
 *
 * ## Why the home page's section anchors are no longer here
 *
 * Until Tahap 54 this nav rendered the home page's four in-page anchors
 * (`#work`, `#practice`, `#studio`, `#contact`) *and* these three routes. On
 * `/en` that shipped **seven** links inside one `<nav aria-label="Primary">`,
 * of which two pairs carried the same accessible name and different
 * destinations — `Work` → `#work` beside `Work` → `/en/work`, and the same
 * for `Studio`. A reader cannot tell those apart, and a screen-reader user
 * walking the link list gets the ambiguity twice.
 *
 * It also broke this file's own rule three lines further down: the row is
 * capped at one line, and seven is not one line.
 *
 * So the nav answers one question — *what pages does this site have* — and
 * the home page's sections answer a different one, by being scrolled to. The
 * wordmark to the left is the home link and carries `aria-label="Arth —
 * home"`; a fourth item spelling "Home" beside it would be the same duplicate
 * this change removes.
 *
 * Three and not more. `taste-skill` SKILL.md §4.7 caps the navigation at one
 * line and 80px; since the fork that is advice, not a gate. These three
 * are the site's top-level shapes: the work, the practice behind it, and the
 * writing about it — `/practice/<value>` has no index route of its own, and
 * is reached from the home page's practice list and the catalogue's chips.
 */
const ROUTE_LINKS = [
  { href: '/work', labelKey: 'work' },
  { href: '/studio', labelKey: 'studio' },
  { href: '/journal', labelKey: 'journal' },
] as const

/**
 * Whether this browser has the popover API.
 *
 * Never read during the server render: the server has no `HTMLElement`.
 * Components read it through `useSyncExternalStore`, whose server snapshot
 * keeps the markup the same on both sides.
 */
function supportsPopover() {
  return (
    typeof HTMLElement !== 'undefined' &&
    Object.hasOwn(HTMLElement.prototype, 'popover')
  )
}

/** Marks or releases nodes as `inert` — the page under the open sheet. */
function setInert(nodes: readonly HTMLElement[], inert: boolean) {
  for (const node of nodes) node.inert = inert
}

/**
 * Whether the nav is open as a sheet right now, read from the element — in
 * whichever way this browser opens it. Never from React state, which lags
 * the popover by a queued `toggle` event.
 */
function isOpen(nav: HTMLElement) {
  return supportsPopover()
    ? nav.matches(':popover-open')
    : nav.hasAttribute('data-open')
}

/**
 * A store that never changes, for a value read once on the client — the
 * shape `lib/hooks/use-device-detection.ts` uses for the same need.
 */
function subscribeNever() {
  // oxlint-disable-next-line eslint/no-empty-function -- required unsubscribe signature; nothing to tear down since the value is never notified
  return () => {}
}

export function Header() {
  const pathname = usePathname()
  /*
   * Only for a browser without `popover` — there, `data-open` is what opens
   * the sheet (the stylesheet's `.nav[data-open]`). Everywhere else the
   * browser owns the open state and this stays false.
   */
  const [fallbackOpen, setFallbackOpen] = useState(false)
  /*
   * Whether the browser owns the open state. True on the server, so the
   * server render carries no `aria-expanded`: with a popover the browser
   * computes that state itself, and an explicit "false" baked into the HTML
   * would contradict it for a reader with no script.
   */
  const native = useSyncExternalStore(
    subscribeNever,
    supportsPopover,
    () => true
  )
  const nav = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const t = useTranslations('nav')

  /*
   * The sheet's open state is the browser's, so it is read from the element
   * rather than mirrored into React. Subscribing re-reads it too, which is
   * what catches a tap that opened the sheet before hydration — the `toggle`
   * it fired then had no listener, and React does not replay it.
   */
  const subscribeToggle = useCallback((onChange: () => void) => {
    const element = nav.current
    element?.addEventListener('toggle', onChange)
    return () => element?.removeEventListener('toggle', onChange)
  }, [])
  const menuOpen = useSyncExternalStore(
    subscribeToggle,
    () => supportsPopover() && (nav.current?.matches(':popover-open') ?? false),
    () => false
  )

  /*
   * The route words share one size on a phone, fitted to the longest of them
   * in this language — `lib/styles/css/global.css` `.nameplate-title`
   * measured the face's widest glyph run at 0.72em per character, and the
   * sheet uses the same figure.
   */
  const routeStyle = {
    '--fit-chars': Math.max(
      ...ROUTE_LINKS.map(({ labelKey }) => Array.from(t(labelKey)).length)
    ),
  } as CSSProperties

  const closeMenu = useCallback(() => {
    const element = nav.current
    if (!element) return
    if (supportsPopover()) {
      if (element.matches(':popover-open')) element.hidePopover()
      return
    }
    // The fallback has no browser focus-restore: a link that goes
    // `display: none` under focus drops it to `<body>`, so it is handed back.
    if (element.contains(document.activeElement)) menuButton.current?.focus()
    setFallbackOpen(false)
  }, [])

  const open = menuOpen || fallbackOpen

  /*
   * What the sheet covers is out of reach while it covers it, for a screen
   * reader's cursor as much as for Tab: a swipe past the last route read the
   * page underneath.
   *
   * The nodes this marks are remembered, so closing gives back exactly those
   * — never one something else had made `inert` — and marking twice is a
   * no-op rather than a second list that forgets the first.
   */
  const covered = useRef<HTMLElement[]>([])
  const cover = useCallback(() => {
    if (covered.current.length > 0) return
    covered.current = [
      ...document.querySelectorAll<HTMLElement>('main, footer'),
    ].filter((node) => node.getClientRects().length > 0 && !node.inert)
    setInert(covered.current, true)
  }, [])
  const uncover = useCallback(() => {
    setInert(covered.current, false)
    covered.current = []
  }, [])

  useEffect(() => {
    const element = nav.current
    const button = menuButton.current
    if (!element || !button) return

    /*
     * This header's own nav, by reference. Next keeps the previous page in a
     * hidden `<Activity>`, header and all, so after a client navigation the
     * document holds two `#header-nav` — measured — and `popovertarget`
     * resolves an id to the first in the tree. The id stays for the page a
     * reader without a script loads, where there is only ever one.
     */
    if ('popoverTargetElement' in button) button.popoverTargetElement = element

    /*
     * What has to hold the instant the sheet opens is wired to the element,
     * from mount, and reads the element's own state — not React's `open`.
     * That follows the popover's `toggle` event, which the browser queues,
     * and the effect that used to attach these listeners ran after it: a
     * Shift+Tab inside that gap found nothing listening, and the sheet stayed
     * open over whatever took focus. CI caught it, once, as a flaky
     * `phone-menu` run on the way to `main`.
     *
     * `beforetoggle` is dispatched synchronously, before the sheet shows, so
     * what it covers is `inert` from the first frame the sheet is on screen.
     */
    const onBeforeToggle = (event: Event) => {
      if ('newState' in event && event.newState === 'open') cover()
      else uncover()
    }

    /*
     * Focus landing anywhere outside the open sheet closes it — the fork,
     * from review. `popover="auto"` is not modal, and the sheet is opaque:
     * a Tab past the last link, a Shift+Tab from MENU to search, the skip
     * link — each put focus on something under the sheet, where no one could
     * see it (WCAG 2.4.11), and search opened its palette underneath.
     * Listening on the document, not the nav, is what catches the paths
     * that never pass through the sheet at all.
     */
    const onFocusIn = (event: FocusEvent) => {
      if (!isOpen(element)) return
      const target = event.target
      if (!(target instanceof Node)) return
      if (element.contains(target) || target === button) return
      closeMenu()
    }

    // Crossing into desktop, the sheet becomes the row: close it first.
    const desktop = window.matchMedia('(min-width: 800px)')
    const onBreakpoint = () => {
      if (desktop.matches) closeMenu()
    }

    // A tap before hydration may have opened it with nothing listening.
    if (isOpen(element)) cover()

    element.addEventListener('beforetoggle', onBeforeToggle)
    document.addEventListener('focusin', onFocusIn)
    desktop.addEventListener('change', onBreakpoint)
    return () => {
      element.removeEventListener('beforetoggle', onBeforeToggle)
      document.removeEventListener('focusin', onFocusIn)
      desktop.removeEventListener('change', onBreakpoint)
      // Hidden with its page, the sheet is not left open behind it.
      closeMenu()
      uncover()
    }
  }, [closeMenu, cover, uncover])

  useEffect(() => {
    if (!fallbackOpen) return
    cover()

    // The fallback has neither the browser's Escape nor its light dismiss.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      closeMenu()
      menuButton.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (nav.current?.contains(target) || menuButton.current?.contains(target))
        return
      closeMenu()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      uncover()
    }
  }, [fallbackOpen, closeMenu, cover, uncover])

  const onRouteClick = (event: MouseEvent<HTMLElement>) => {
    // A modified click opens a new tab and leaves the reader here, menu and
    // all.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    closeMenu()
  }

  return (
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="Arth — home">
        Arth
      </Link>

      <nav
        ref={nav}
        id="header-nav"
        popover="auto"
        aria-label={t('primary')}
        className={s.nav}
        {...(fallbackOpen && { 'data-open': '' })}
        /*
         * Lenis listens for the wheel on the window and scrolls the page
         * itself; this attribute tells it to leave a gesture that starts in
         * the open sheet alone. Only while open — on the desktop row it would
         * hand the wheel to the browser and the page would jump rather than
         * glide.
         */
        {...(open && { 'data-lenis-prevent': '' })}
      >
        <ul className={s.navList} style={routeStyle}>
          {/*
            The routes, on every page — Tahap 38.

            This nav rendered `sections` and nothing else, and only the home
            page passes any. Measured: nine of eleven page types shipped a
            header of wordmark, search and language switcher, with **zero**
            route links, while a project page offered exactly one way out of
            its own content.

            `footer/index.tsx` already argued that the site needs persistent
            route navigation and put it in the footer, where it is below every
            page. This is the same three destinations at the top, where
            someone who has just landed on a project from search will look.

            Tahap 54 removed the home-page anchors that used to sit above
            these, so this is now the whole list.
          */}
          {ROUTE_LINKS.map(({ href, labelKey }, index) => (
            <li
              key={href}
              className={s.navItem}
              style={{ '--item': index } as CSSProperties}
            >
              <Link
                className={cn('caption', s.navLink)}
                href={href}
                onClick={onRouteClick}
                // `MOTION-SPEC.md` §9.
                data-press="nav"
                data-intent=""
                {...(getLinkIntent(href, pathname).isActive && {
                  'aria-current': 'page' as const,
                })}
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}

          {STORYBOOK_ENABLED && (
            <li className={cn(s.navItem, s.navAside)}>
              <Link
                className={cn('caption', s.navLink)}
                href={STORYBOOK_HREF}
                newTab
                {...(getLinkIntent(STORYBOOK_HREF, pathname, { newTab: true })
                  .isActive && { 'aria-current': 'page' as const })}
              >
                {t('storybook')}
                <span aria-hidden="true" className={s.externalMark}>
                  ↗
                </span>
              </Link>
            </li>
          )}
        </ul>

        {/*
          The rule under the current route, slid to the one pressed before
          the page turns — Tata & Gerak, stage 2. Desktop only: on a phone
          the sheet's current word carries an underline of its own.
        */}
        <RouteMarker className={s.marker} />
      </nav>

      {/*
        Search sits beside the language switcher rather than inside the nav:
        it is not a destination, it is a way of reaching every destination.
        Its own file records why it is a visible button and not only a ⌘K
        shortcut, and why almost nothing of it ships to a page that never
        opens it.

        The two are one group so the header can place them as one — Tahap 87.
        As separate children of a `space-between` row, each sat wherever the
        leftover space fell; together they mirror the wordmark at the other
        `--safe` edge. `header.module.css` has the measurement.
      */}
      <div className={s.tools}>
        <CommandTrigger className={s.search} />
        <LanguageSwitcher className={s.language} />
      </div>

      {/*
        After the tools in the markup, so it sits at the right edge — under
        the thumb — and the focus order is the order on screen. It sat
        between the wordmark and search, with the language switcher moved
        past it by `order`, so the thumb had to reach the middle of the bar.
      */}
      <button
        ref={menuButton}
        type="button"
        className={cn('caption', s.menuToggle)}
        popoverTarget="header-nav"
        aria-controls="header-nav"
        {...(!native && { 'aria-expanded': fallbackOpen })}
        onClick={() => {
          if (!supportsPopover()) setFallbackOpen((was) => !was)
        }}
      >
        {open ? t('closeMenu') : t('openMenu')}
      </button>
    </header>
  )
}
