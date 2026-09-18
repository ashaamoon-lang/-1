'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CommandTrigger } from '@/components/ui/command'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { getLinkIntent, Link } from '@/components/ui/link'
import { usePathname } from '@/lib/i18n/navigation'

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
 * line and 80px, and `e2e/taste-preflight.e2e.ts` measures it. These three
 * are the site's top-level shapes: the work, the practice behind it, and the
 * writing about it — `/practice/<value>` has no index route of its own, and
 * is reached from the home page's practice list and the catalogue's chips.
 */
const ROUTE_LINKS = [
  { href: '/work', labelKey: 'work' },
  { href: '/studio', labelKey: 'studio' },
  { href: '/journal', labelKey: 'journal' },
] as const

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <header className={s.header}>
      <Link href="/" className={s.brand} aria-label="Arth — home">
        Arth
      </Link>

      <button
        aria-expanded={menuOpen}
        aria-controls="header-nav"
        aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
        className={cn('caption', s.menuToggle)}
        onClick={() => setMenuOpen((prev) => !prev)}
        type="button"
      >
        {menuOpen ? t('closeMenu') : t('openMenu')}
      </button>

      <nav
        aria-label={t('primary')}
        className={cn(s.nav, menuOpen && s.navOpen)}
        id="header-nav"
      >
        <ul className={s.navList}>
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
          {ROUTE_LINKS.map(({ href, labelKey }) => (
            <li key={href} className={s.navItem}>
              <Link
                className={cn('caption', s.navLink)}
                href={href}
                onClick={() => setMenuOpen(false)}
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
            <li className={s.navItem}>
              <Link
                className={cn('caption', s.navLink)}
                href={STORYBOOK_HREF}
                newTab
                onClick={() => setMenuOpen(false)}
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
      </nav>

      {/*
        Search sits beside the language switcher rather than inside the nav:
        it is not a destination, it is a way of reaching every destination.
        Its own file records why it is a visible button and not only a ⌘K
        shortcut, and why almost nothing of it ships to a page that never
        opens it.
      */}
      <CommandTrigger className={s.search} />

      <LanguageSwitcher className={s.language} />
    </header>
  )
}
