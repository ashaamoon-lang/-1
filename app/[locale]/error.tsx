'use client'

import { useTranslations } from 'next-intl'

import { Wrapper } from '@/components/layout/wrapper'
import { ErrorView } from '@/components/ui/error-view'
import { Link } from '@/components/ui/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * The localized error boundary.
 *
 * Two defects met here, and both were invisible.
 *
 * The copy was hardcoded English under whatever `<html lang>` the route
 * carried. And the "Go Home" link used `px-6 py-3 rounded border-gray-300
 * bg-gray-50` — Tailwind utilities this project does not have. `tailwind.css`
 * resets `--color-*` and `--spacing-*` to `initial` and the site uses the
 * `dr-*` scale, so all five classes were emitted **zero times**: the one
 * surface a visitor sees when the site has already failed was the only one
 * with no styling at all. Tailwind v4 does not warn about a class that
 * resolves to nothing (`docs/AUDIT-2026-08.md` §2.7).
 *
 * The classes below are the same ones `error-view`'s own default link uses.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations('error')

  return (
    <Wrapper theme="light" className="font-mono">
      <ErrorView
        error={error}
        reset={reset}
        title={t('title')}
        description={t('description')}
        retryLabel={t('retry')}
        homeLink={
          <Link
            href="/"
            className="border border-secondary dr-px-24 dr-py-12 cta uppercase transition-colors hover:bg-secondary hover:text-primary"
          >
            {t('home')}
          </Link>
        }
      />
    </Wrapper>
  )
}
