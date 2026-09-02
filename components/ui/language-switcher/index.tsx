'use client'

import cn from 'clsx'
import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/lib/i18n/navigation'
import { LOCALE_LABELS, LOCALE_TAGS, routing } from '@/lib/i18n/routing'

import s from './language-switcher.module.css'

/**
 * LanguageSwitcher — two languages, so two links.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why not a `<select>`
 *
 * A select for two options adds a click and a popup without adding a choice.
 * Both languages fit on one line as links, which also means the alternate
 * language is a real anchor a crawler can follow — a `<select>` is invisible
 * to one.
 *
 * ## It keeps the reader on the page they are reading
 *
 * `usePathname` here is next-intl's, which returns the path with the locale
 * prefix stripped (`/work/ai-data`, not `/id/work/ai-data`). Handing that
 * template back to next-intl's `Link` with an explicit `locale` re-prefixes
 * it for the target language, so switching language on a project page lands
 * on the same project — not on the home page, which is what a naive
 * `href={'/' + locale}` does.
 *
 * ## Accessibility
 *
 * - `aria-current="true"` marks the active language, so it is announced
 *   rather than only shown as a different weight.
 * - `hrefLang` states each link's destination language, which is what tells a
 *   screen reader to switch pronunciation and a crawler to pair the two.
 * - The active language stays a link rather than becoming inert text: the
 *   list keeps a stable shape, and re-selecting the current language is
 *   harmless.
 * - `lang` on each label makes the language *name* read in its own language —
 *   "Bahasa Indonesia" should not be pronounced with English phonemes.
 */
export function LanguageSwitcher({
  className,
}: {
  className?: string | undefined
}) {
  const pathname = usePathname()
  // `useLocale`, not `pathname`: the pathname has had its prefix stripped and
  // therefore no longer says which language it came from.
  const active = useLocale()
  const t = useTranslations('language')

  return (
    <nav aria-label={t('label')} className={cn(s.switcher, className)}>
      <ul className={s.list}>
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              hrefLang={LOCALE_TAGS[locale]}
              lang={LOCALE_TAGS[locale]}
              aria-label={t('switchTo', { language: LOCALE_LABELS[locale] })}
              className={cn('caption', s.link)}
              {...(locale === active && { 'aria-current': true })}
            >
              {locale.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
