'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

interface ErrorViewProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  /**
   * Element rendered in place of the default "Go Home" anchor. Pass the
   * project's `Link` (from '@/components/ui/link') when rendering inside the
   * router (e.g. app/(site)/error.tsx). Defaults to a raw `<a>`, which is required
   * in app/global-error.tsx since it renders outside the router.
   */
  homeLink?: ReactNode
}

const DEFAULT_HOME_LINK = (
  // oxlint-disable-next-line react/forbid-elements, nextjs/no-html-link-for-pages -- global-error renders outside the router, so the Link component cannot be used here
  <a
    href="/"
    className="border border-secondary dr-px-24 dr-py-12 cta uppercase transition-colors hover:bg-secondary hover:text-primary"
  >
    Go Home
  </a>
)

/**
 * Shared error boundary view used by both app/(site)/error.tsx and app/global-error.tsx.
 *
 * Uses only plain HTML elements (no next/link, no app providers) so it is safe
 * to render in both the standard error boundary context and in global-error's
 * root-level context where the router may not be available.
 */
export function ErrorView({
  error,
  reset,
  title = 'Something went wrong',
  description = "We're sorry, but something unexpected happened. Please try again.",
  homeLink = DEFAULT_HOME_LINK,
}: ErrorViewProps) {
  useEffect(() => {
    console.error('Error boundary caught:', error)
  }, [error])

  return (
    <div className="my-auto flex flex-col items-center justify-center dr-gap-y-24 dr-px-16 text-center uppercase">
      <h1 className="h2 text-balance">{title}</h1>
      <p className="dr-max-w-480 p-big opacity-70">{description}</p>

      {process.env.NODE_ENV === 'development' && (
        <details className="dr-max-w-720 text-left">
          <summary className="cursor-pointer caption opacity-70 hover:opacity-100">
            Error Details (Development Only)
          </summary>
          <pre className="dr-mt-8 overflow-auto bg-(--surface-2) dr-p-16 caption normal-case">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex flex-wrap justify-center dr-gap-16">
        <button
          onClick={reset}
          type="button"
          className="border border-secondary bg-secondary dr-px-24 dr-py-12 cta text-primary uppercase transition-colors hover:bg-transparent hover:text-secondary"
        >
          Try Again
        </button>
        {homeLink}
      </div>
    </div>
  )
}
