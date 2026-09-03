import cn from 'clsx'
import { useTranslations } from 'next-intl'

import { Link } from '@/components/ui/link'
import { PRACTICES, practiceTemplate } from '@/lib/content/practices'

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
  /*
   * Two more namespaces rather than new strings.
   *
   * `nav.work` already names the catalogue in the header, and
   * `workIndex.<value>` already names each practice on the filter chips and on
   * the practice page's own nameplate. Writing a second set here would let the
   * footer call a practice something the rest of the site does not.
   */
  const tNav = useTranslations('nav')
  const tWork = useTranslations('workIndex')
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

        {/*
          Site navigation, and it lives here rather than in the header for a
          measured reason.

          Tahap 20 counted the onward links on every route: `/en/work` has
          eleven, a practice page three, and **a project page one** — the next
          project. The footer carried no navigation at all, on every route,
          while a project page is the one most likely to be a landing page
          from a search result or a shared link.

          `components/layout/header` already decided, with a sound argument,
          not to carry the home page's section anchors on inner routes: they
          would be links that silently do nothing. That argument is about
          anchors. Every link below is a **real route**, so it cannot die —
          which is why this belongs here and the header stays untouched.

          `Portfolio Grid`, the pattern this site follows, puts its primary
          call to action at "Project Card Hover + Footer Contact". The footer
          was already the site's second entry point; it simply had nothing to
          enter.
        */}
        <section className={s.column}>
          <h2 className={cn('caption', s.heading)}>{t('index')}</h2>
          <ul className={s.list}>
            <li>
              <Link href="/work" className={cn('caption', s.link)}>
                {tNav('work')}
              </Link>
            </li>
            {/*
              The studio page, which became a real route in Tahap 24.

              It goes here rather than in the header because the header's nav
              is built from the *sections* the current page rendered — in-page
              anchors, passed only by the home page — while this column is the
              site's route index and is on every page. Adding it here makes the
              studio reachable from anywhere, which is what
              `e2e/site-reach.e2e.ts` reads.
            */}
            <li>
              <Link href="/studio" className={cn('caption', s.link)}>
                {tNav('studio')}
              </Link>
            </li>
            {PRACTICES.map((value) => (
              <li key={value}>
                <Link
                  href={practiceTemplate(value)}
                  className={cn('caption', s.link)}
                >
                  {tWork(value)}
                </Link>
              </li>
            ))}
          </ul>
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
