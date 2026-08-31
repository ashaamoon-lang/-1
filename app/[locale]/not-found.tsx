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
        recoveryLinks={
          <>
            <Link href="/ai">{t('agentIndex')}</Link>
            {' · '}
            <Link href="/llms.txt">llms.txt</Link>
            {' · '}
            <Link href="/sitemap.xml">{t('sitemap')}</Link>
          </>
        }
      />
    </Wrapper>
  )
}
