import cn from 'clsx'
import { useTranslations } from 'next-intl'

import { Link } from '@/components/ui/link'

import s from './footer.module.css'

/**
 * Site footer.
 *
 * Replaces the Satūs starter footer, which carried darkroom's logo and a "use
 * this template" link — correct for a starter, wrong for a studio's own site.
 *
 * ## The attribution stays
 *
 * What was removed is the *template* link, not the credit. Satūs is MIT
 * licensed and `docs/PROVENANCE.md` requires the attribution, so
 * darkroom.engineering is still named, as a sentence in the colophon rather
 * than as a logo lockup. The typefaces are named there too: a colophon that
 * lists its type is a convention of the field this site is trying to belong
 * to, and it costs one line.
 *
 * ## Where this runs
 *
 * The file declares no `'use client'` and holds no state, but it is imported
 * by `components/layout/wrapper`, which does — so in practice it renders as a
 * client component. `useTranslations` works either way: the layout wraps the
 * tree in `NextIntlClientProvider`. Written without state so it can move back
 * to the server the moment Wrapper stops needing to be a client component.
 */

/*
 * Read once at module scope, never during render.
 *
 * `new Date()` inside the component body is a clock read, and under Cache
 * Components that makes the enclosing boundary dynamic. Because this footer
 * renders inside `Wrapper` (a Client Component), the effect is not a slower
 * render — React bails the whole boundary to client-side rendering, and the
 * prerendered HTML for `/en` and `/id` ships with no header, no footer and no
 * page content at all. Nothing warns: the build succeeds, dev looks correct,
 * and only the served HTML shows it. Measured before and after.
 *
 * At module scope the read happens once when the bundle loads, outside any
 * render, so the prerender stays static. The value ages with the deploy
 * rather than with the calendar.
 */
const YEAR = new Date().getFullYear()

const EMAIL = 'studio@arth.example'

const SOCIAL = [
  { href: 'https://instagram.com/', label: 'Instagram' },
  { href: 'https://are.na/', label: 'Are.na' },
] as const

export function Footer() {
  const t = useTranslations('footer')
  return (
    // No `id="contact"`. The home page's Contact section owns that id, and two
    // elements sharing one is a `duplicate-id` violation — which now fails the
    // suite outright, since Tahap 2 removed the critical/serious axe filter.
    <footer className={s.footer}>
      <div className={s.columns}>
        <section className={s.column}>
          <h2 className={cn('caption', s.heading)}>{t('contact')}</h2>
          <Link href={`mailto:${EMAIL}`} className={cn('p-big', s.email)}>
            {EMAIL}
          </Link>
        </section>

        <section className={s.column}>
          <h2 className={cn('caption', s.heading)}>{t('elsewhere')}</h2>
          <ul className={s.list}>
            {SOCIAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={cn('caption', s.link)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className={s.column}>
          <h2 className={cn('caption', s.heading)}>{t('colophon')}</h2>
          <p className={cn('caption', s.note)}>{t('builtOn')}</p>
        </section>
      </div>

      <p className={cn('caption', s.rights)}>{t('rights', { year: YEAR })}</p>
    </footer>
  )
}
