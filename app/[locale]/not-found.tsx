import { getTranslations } from 'next-intl/server'

import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { NotFoundView } from '@/components/ui/not-found-view'

import s from '@/components/ui/not-found-view/not-found-view.module.css'

/**
 * The localized 404.
 *
 * Every string here used to be an English literal, rendered under whatever
 * `<html lang>` the route carried — so `/id/apa-pun` announced itself as
 * Indonesian and then spoke English, which is the failure WCAG 3.1.1 is about
 * and which axe cannot see (`html-has-lang` only checks the attribute exists).
 *
 * The shared `NotFoundView` keeps English defaults because
 * `app/global-error.tsx` renders outside the intl provider and cannot
 * translate; this route passes real translations in.
 */
export default async function NotFound() {
  const t = await getTranslations('notFound')

  return (
    <Wrapper theme="dark">
      <NotFoundView
        label={t('label')}
        message={t('message')}
        description={t('description')}
        tryPrefix={t('tryPrefix')}
        homeLink={
          <Link href="/" className={s.cta}>
            {t('home')}
          </Link>
        }
        /*
          Pages, not endpoints — Tahap 38.
        
          This offered `/ai`, `/llms.txt` and `/sitemap.xml`: three
          machine-readable surfaces, handed to the one visitor on the site who
          is definitely a person who just got lost. Measured, they were three
          of the four links on the page.
        
          Nothing is lost on the machine side. `app/robots.ts` already
          advertises the sitemap, which is where a crawler looks for it, and
          `/ai` is in the sitemap itself. A 404 was never how either was
          discovered.
        */
        recoveryLinks={
          <>
            <Link href="/work">{t('work')}</Link>
            {' · '}
            <Link href="/studio">{t('studio')}</Link>
            {' · '}
            <Link href="/journal">{t('journal')}</Link>
          </>
        }
      />
    </Wrapper>
  )
}
