import { Analytics } from '@vercel/analytics/next'
import { TransformProvider } from 'hamo'
import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'
import { locale as localeRootParam } from 'next/root-params'
import { type PropsWithChildren, Suspense } from 'react'
import { ReactTempus } from 'tempus/react'

import { RealViewport } from '@/components/ui/real-viewport'
import { ToastProvider, ToastViewport } from '@/components/ui/toast'
import { APP_BASE_URL, env } from '@/lib/env'
import { OptionalFeatures } from '@/lib/features'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, LOCALE_TAGS, ogLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { SanityLive } from '@/lib/integrations/sanity/live'
import { routeAlternates } from '@/lib/seo/alternates'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationSchema, websiteSchema } from '@/lib/seo/schemas'
import { SITE, siteFacts } from '@/lib/seo/site'
import { themes } from '@/lib/styles/colors'
import { fontsVariable } from '@/lib/styles/fonts'
import { PageTransition } from '@/vault/motion/page-transition'

import '@/lib/styles/css/index.css'

/*
 * Identity comes from `lib/seo/site.ts`, not from `package.json`.
 *
 * It used to come from package.json's `name`, and that shipped
 * `@darkroom.engineering/satus` as `og:site_name`, as `applicationName`, and
 * as the installed-app name in `manifest.webmanifest`. A package identifier
 * is not a display name, and nothing in the gates could tell the difference.
 * `site.ts` already calls itself the single source of truth for entity copy;
 * this makes that true.
 */
const APP_NAME = SITE.name
const APP_DEFAULT_TITLE = SITE.name
const APP_TITLE_TEMPLATE = `%s — ${SITE.name}`

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
  // The description is the one piece of this metadata that is prose, and it
  // now follows the page's language. It was a module constant reading
  // `SITE.description`, so `/id` shipped an English `<meta
  // name="description">` and an English `og:description` under `lang="id"`.
  const { description } = siteFacts(locale)

  const metadata: Metadata = {
    metadataBase: new URL(APP_BASE_URL),
    applicationName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description,
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
      description,
      // Localized, matching the canonical set above. A bare origin here told
      // every crawler that `/en` and `/id` were both the same URL.
      url: `${APP_BASE_URL}${localizedPath(locale, '/')}`,
      images: [
        {
          url: '/opengraph-image.png',
          width: 1200,
          height: 630,
          // Describes the card, not the site: it is a wordmark on the ink
          // ground with one line of mediums under it. Pasting the whole
          // site description here made a 150-character alt that repeated
          // the name twice and described nothing visible.
          alt: `${SITE.name} — agency: consulting, AI and data, commissioned work`,
        },
      ],
      // Underscore, not the hyphenated tag `<html lang>` takes below.
      // See `ogLocale` — OpenGraph is not BCP 47.
      locale: ogLocale(locale),
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map(ogLocale),
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: APP_DEFAULT_TITLE,
        template: APP_TITLE_TEMPLATE,
      },
      description,
    },
    // The site's author is the studio it belongs to. The starter's own credit
    // is kept where it belongs — the footer, as the MIT notice requires.
    authors: [{ name: SITE.name, url: SITE.url }],
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
  const t = await getTranslations()
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
          {/* Entity identity for search and answer engines, on every page — deep
          pages are landed on directly far more often than the homepage. */}
          <JsonLd data={organizationSchema(locale)} />
          <JsonLd data={websiteSchema()} />
          {/*
            A native anchor, not `components/ui/link`.
            
            That component wraps next-intl's `Link`, which routes through the
            client router with `scroll: false` — so a fragment href performed
            no navigation at all: `:target` stayed null, the scroll position
            did not move, and focus never left the link. WCAG 2.4.1 failed on
            every page, on the site's only bypass mechanism
            (`docs/AUDIT-2026-08.md` §2.3). A plain `<a href="#…">` does what
            the browser has always done, and `<main tabIndex={-1}>` gives it
            somewhere to land.

            The label comes from `nav.skipToContent`, which existed in both
            message catalogues and was called from nowhere — so the first
            thing an Indonesian screen-reader user heard on every `/id` page
            was English.
          */}
          {/* oxlint-disable-next-line react/forbid-elements -- a fragment link must not go through the client router; see above */}
          <a
            href="#main-content"
            className="focus:rounded sr-only focus:not-sr-only focus:fixed focus:dr-top-16 focus:dr-left-16 focus:z-9999 focus:bg-secondary focus:dr-px-16 focus:dr-py-8 focus:text-primary focus:ring-2 focus:ring-contrast focus:outline-none"
          >
            {t('nav.skipToContent')}
          </a>
          {/*
            Mounted here, above every page, because a transition needs both
            ends of a navigation. GSAP is opted into per page in `<Wrapper>`
            and only the home page takes it, so a GSAP-driven overlay would
            have animated on exactly one route — for a transition, the same as
            none. This is a CSS wipe and costs no library on any route.

            The `<Suspense>` is required, not stylistic: the overlay reads
            `usePathname()` to know when a route has committed, and under
            Cache Components URL data in a client component must sit behind a
            boundary. Scoping it to this one decorative element with a `null`
            fallback is what keeps the page content itself out of a boundary —
            which is the whole of Tahap 10's no-JavaScript work.
          */}
          <Suspense fallback={null}>
            <PageTransition />
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
        Optional features — dev tools only.

        `gsap` and `webgl` both moved to `<Wrapper>`, per page. Mounting them
        here put GSAP and three.js into every page's graph: `/en/ai`, a page of
        plain text, downloaded 859KB of three.js and react-three-fiber it had
        no use for. Only the home hero has a scene, so only the home page pays.
      */}
          <OptionalFeatures />

          {/*
            Draft mode only.
            
            This mounted whenever Sanity was configured, which put
            `@sanity/client` (21.7KB gzipped) into every route — including
            `/en/ai`, whose own comment says it carries "zero client
            components ... server-only end to end"
            (`docs/AUDIT-2026-08.md` §Tier 4).
            
            What it buys is a client-side live-query subscription, and the only
            audience for that is an editor watching Presentation. A published
            visitor's freshness comes from the publish webhook calling
            `revalidateTag` on the server (`app/api/revalidate/route.ts`,
            `docs/DEPLOYMENT.md` §4) — a different mechanism entirely, and one
            that keeps working with this unmounted.
            
            The trade, stated: a published change no longer appears on an
            already-open tab until the next navigation. It appears immediately
            on the next request, which is what a visitor actually does.
          */}
          {sanityConfigured && isDraftMode && <SanityLive includeDrafts />}

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
