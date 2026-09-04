'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { CommandTrigger } from '@/components/ui/command'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { getLinkIntent, Link } from '@/components/ui/link'
import { useActiveSection } from '@/lib/hooks/use-active-section'
import { usePathname } from '@/lib/i18n/navigation'

import s from './header.module.css'

/**
 * Site header.
 *
 * Replaces the Satūs starter header, which showed a "Satūs" wordmark, the raw
 * pathname as a debug readout, and links to darkroom's own repository. Useful
 * while forking; not something to ship on a studio's site.
 *
 * ## The in-page anchors belong to the page, not to the header
 *
 * The home page is one long page (`docs/ROADMAP.md` §1.2), so its primary nav
 * points at sections within it. Which sections exist is not something the
 * header can know: Work renders only when there is published work, and with
 * an empty dataset it is absent entirely. A hardcoded `#work` would then be a
 * link that silently does nothing — and on the 404 page, or a project detail
 * page, *every* section anchor would be.
 *
 * So the page passes the sections it actually rendered, in document order, and
 * a page that passes none gets a header with just the wordmark and the
 * language switcher. That is the correct header for those pages, not a
 * degraded one.
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

/** An in-page section the current page rendered, in document order. */
export interface SectionLink {
  /** The section element's `id`, without the `#`. */
  id: string
  /** Key into the `nav` message namespace. */
  labelKey: 'work' | 'practice' | 'studio' | 'contact'
}

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

/** Stable empty default — a fresh `[]` per render re-subscribes the observer. */
const NO_SECTIONS: readonly SectionLink[] = []

export function Header({
  sections = NO_SECTIONS,
}: {
  sections?: readonly SectionLink[]
}) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useTranslations('nav')

  // Highlights where the reader is. Without JavaScript this is simply absent
  // and the anchors still work — a highlight adds to navigation, it is never
  // a prerequisite for it.
  const activeSection = useActiveSection(sections.map((section) => section.id))

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
          {sections.map((section) => (
            <li key={section.id} className={s.navItem}>
              {/* oxlint-disable-next-line react/forbid-elements -- deliberate native anchor: a same-page hash must scroll with the browser's own handling so it works with JavaScript disabled (a stated Tahap 3 exit criterion), and so `scroll-padding-top`/`scroll-margin-top` apply. The Link component defaults `scroll` to false, which is right for routes and wrong for anchors. */}
              <a
                className={cn('caption', s.navLink)}
                href={`#${section.id}`}
                onClick={() => setMenuOpen(false)}
                // `MOTION-SPEC.md` §9.
                data-press="nav"
                data-intent=""
                /*
                 * `location`, not `page`. `aria-current="page"` marks the
                 * current page within a set of links; `location` marks the
                 * current position *within* a page, which is exactly what an
                 * in-page anchor set is. The route links below still use
                 * `page`, correctly.
                 */
                {...(activeSection === section.id && {
                  'aria-current': 'location' as const,
                })}
              >
                {t(section.labelKey)}
              </a>
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
