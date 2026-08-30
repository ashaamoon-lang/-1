'use client'

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

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
 * ## In-page anchors, not routes
 *
 * The home page is a single page (`docs/ROADMAP.md`, Tahap 3), so the primary
 * nav points at sections within it. Anchors are also the one nav shape that
 * degrades honestly before those sections exist: an anchor with no target
 * simply does not move the page. A route with no page is a 404.
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

// `newTab` is only needed when a link should open in a new tab despite not
// being externally-derivable from its href (e.g. the proxied, relative
// Storybook route in production). Absolute http(s) hrefs get new-tab + the
// arrow indicator automatically via isExternalHref.
type NavLink = {
  href: string
  /** Key into the `nav` message namespace. */
  labelKey: 'work' | 'studio' | 'contact' | 'storybook'
  newTab?: boolean
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

const LINKS: NavLink[] = [
  { href: '#work', labelKey: 'work' },
  { href: '#studio', labelKey: 'studio' },
  { href: '#contact', labelKey: 'contact' },
  // Prod Storybook route is relative (/storybook/, proxied) so it isn't
  // externally-derivable from the href alone — needs the explicit intent.
  ...(STORYBOOK_ENABLED
    ? [
        {
          href: STORYBOOK_HREF,
          labelKey: 'storybook' as const,
          newTab: true,
        },
      ]
    : []),
]

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
          {LINKS.map((link) => {
            const { isExternal: opensNewTab, isActive } = getLinkIntent(
              link.href,
              pathname,
              { newTab: link.newTab }
            )

            return (
              <li key={link.href} className={s.navItem}>
                <Link
                  className={cn('caption', s.navLink)}
                  href={link.href}
                  newTab={link.newTab}
                  onClick={() => setMenuOpen(false)}
                  {...(isActive && { 'aria-current': 'page' as const })}
                >
                  {t(link.labelKey)}
                  {opensNewTab && (
                    <span aria-hidden="true" className={s.externalMark}>
                      ↗
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <LanguageSwitcher className={s.language} />
    </header>
  )
}
