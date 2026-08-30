import { Analytics } from '@vercel/analytics/next'
import { TransformProvider } from 'hamo'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'
import { locale as localeRootParam } from 'next/root-params'
import Script from 'next/script'
import { type PropsWithChildren, Suspense } from 'react'
import { ReactTempus } from 'tempus/react'

import { Link } from '@/components/ui/link'
import { RealViewport } from '@/components/ui/real-viewport'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { APP_BASE_URL, env } from '@/lib/env'
import { OptionalFeatures } from '@/lib/features'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, LOCALE_TAGS, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { SanityLive } from '@/lib/integrations/sanity/live'
import { routeAlternates } from '@/lib/seo/alternates'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationSchema, websiteSchema } from '@/lib/seo/schemas'
import { themes } from '@/lib/styles/colors'
import { fontsVariable } from '@/lib/styles/fonts'
import AppData from '@/package.json'

import '@/lib/styles/css/index.css'

const APP_NAME = AppData.name
const APP_DEFAULT_TITLE = 'Satūs'
const APP_TITLE_TEMPLATE = '%s - Satūs'
const APP_DESCRIPTION = AppData.description

/**
 * Locale-aware metadata.
 *
 * A function rather than a constant because canonical, hreflang and the
 * OpenGraph locale all depend on which locale is rendering. A static object
 * would pin every page in both languages to the English canonical — the exact
 * duplicate-content signal `lib/seo/alternates.ts` exists to prevent.
 */
export async function generateMetadata(): Promise<Metadata> {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const metadata: Metadata = {
    metadataBase: new URL(APP_BASE_URL),
    applicationName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    alternates: {
      // Only this locale's home canonical. Child routes build their own through
      // `routeAlternates` — inheriting this one would canonicalize the whole
      // site to the locale root.
      ...routeAlternates(localizedPath(locale, '/')),
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: APP_DEFAULT_TITLE,
    },
    formatDetection: { telephone: false },
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
      url: APP_BASE_URL,
      images: [
        {
          url: '/opengraph-image.jpg',
          width: 1200,
          height: 630,
          alt: APP_DEFAULT_TITLE,
        },
      ],
      locale: LOCALE_TAGS[locale],
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description: APP_DESCRIPTION,
    },
    authors: [
      { name: 'darkroom.engineering', url: 'https://darkroom.engineering' },
    ],
  }

  if (env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
    metadata.other = { 'fb:app_id': env.NEXT_PUBLIC_FACEBOOK_APP_ID }
  }

  return metadata
}

export const viewport: Viewport = {
  // The ink, not a brand colour — this palette has no chromatic accent, so
  // browser chrome matches the site's own ground rather than inventing a hue.
  themeColor: themes.dark.primary,
  colorScheme: 'normal',
}

/**
 * Root layout #2 of two, and the one every localized page renders under.
 *
 * `[locale]` sits above this layout, which is precisely what makes it a
 * *root parameter*: `next/root-params` can then hand the active locale to any
 * Server Component — including `lib/i18n/request.ts` — without prop drilling.
 * That indirection is not decoration. Root params are statically analysable,
 * so pages here stay prerendered under `cacheComponents`, whereas reading the
 * locale from headers would force every page dynamic.
 *
 * `generateStaticParams` below is REQUIRED, not an optimisation: with Cache
 * Components enabled, Next fails the build unless every root parameter has at
 * least one value.
 *
 * Studio lives under `app/(chrome)/` instead, so it inherits none of the
 * providers, analytics, or RAF loop mounted here.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function AppLayout({ children }: PropsWithChildren) {
  const { isEnabled: isDraftMode } = await draftMode()
  const sanityConfigured = isConfigured('sanity')

  // The `[locale]` segment matches any single path segment, so an unknown
  // value can legitimately arrive here — next-intl documents it behaving like
  // a catch-all. Fall back rather than throw; `proxy.ts` is what redirects a
  // genuinely unknown prefix to a real locale.
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  /*
   * `locale` and `messages` are passed explicitly rather than left to
   * next-intl's implicit inheritance.
   *
   * Inheritance works in dev, and it works for Server Components in
   * production. It does NOT survive the static prerender: with
   * `cacheComponents` on, a client component calling `useTranslations`
   * under an empty provider makes its whole boundary bail to client-side
   * rendering, and `/en` and `/id` ship as an empty shell. Measured — the
   * header and footer vanished from the prerendered HTML the moment they
   * started translating, while dev kept rendering them.
   */
  const messages = await getMessages()

  return (
    <html
      lang={LOCALE_TAGS[locale]}
      dir="ltr"
      className={fontsVariable}
      // Default theme rendered server-side for no-flash initial paint; the
      // client <Theme> updates data-theme per route via effect.
      data-theme="dark"
      // NOTE: data-theme is updated client-side per route, which would
      // otherwise trip a hydration warning.
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* this helps to track Satus usage thanks to Wappalyzer */}
          <Script
            id="satus-version"
            async
          >{`window.satusVersion = '${AppData.version}';`}</Script>
          {/* Entity identity for search and answer engines, on every page — deep
          pages are landed on directly far more often than the homepage. */}
          <JsonLd data={organizationSchema()} />
          <JsonLd data={websiteSchema()} />
          {/* Skip link for keyboard navigation accessibility */}
          <Suspense fallback={null}>
            <Link
              href="#main-content"
              className="focus:rounded sr-only focus:not-sr-only focus:fixed focus:dr-top-16 focus:dr-left-16 focus:z-9999 focus:bg-secondary focus:dr-px-16 focus:dr-py-8 focus:text-primary focus:ring-2 focus:ring-contrast focus:outline-none"
            >
              Skip to main content
            </Link>
          </Suspense>
          {/* Critical: CSS custom properties needed for layout */}
          <RealViewport>
            <ToastProvider>
              <TransformProvider>
                {/*
              DO NOT add Header or Footer here.
              They are included in the <Wrapper> component used by each page.
              See: components/layout/wrapper/index.tsx
            */}
                {children}
              </TransformProvider>
              <ToastViewport />
            </ToastProvider>
          </RealViewport>
          {/*
        Optional features - conditionally loaded based on configuration.

        `gsap` is on because the starter homepage animates its outro with
        <ProgressText>. It costs ~43KB gzipped, so drop it once no page under
        this layout uses GSAP — a site that does not animate should not ship
        an animation engine.
      */}
          <OptionalFeatures gsap />

          {/* Sanity Live - renders unconditionally when Sanity is configured for real-time updates.
          includeDrafts subscribes the event stream to draft mutations so
          Presentation-tool edits push to the preview without a manual refresh. */}
          {sanityConfigured && <SanityLive includeDrafts={isDraftMode} />}

          {/* Sanity Visual Editing - only when draft mode is enabled */}
          {sanityConfigured && isDraftMode && (
            <Suspense fallback={null}>
              <VisualEditing />
            </Suspense>
          )}

          {/* RAF management - lightweight, but don't patch in draft mode to avoid conflicts */}
          <ReactTempus patch={!isDraftMode} />
          {/* Vercel-hosted deployments only — the injected /_vercel/insights
          script 404s on self-hosted or CI `next start`. */}
          {process.env.VERCEL_ENV && <Analytics />}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
