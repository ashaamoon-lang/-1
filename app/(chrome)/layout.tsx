import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

import { APP_BASE_URL } from '@/lib/env'
import { fontsVariable } from '@/lib/styles/fonts'

import '@/lib/styles/css/index.css'

/**
 * The origin this tree resolves relative URLs against, and nothing else.
 *
 * The note below hands *app-specific* metadata to `app/[locale]/layout.tsx` so
 * Studio does not inherit it, and that division still holds: there is no
 * title, no description, no OG image and no JSON-LD here. `metadataBase` is a
 * different kind of thing — it is not what the site says about itself, it is
 * the origin Next resolves every relative metadata URL against, and a tree
 * without one resolves them against `http://localhost:3000`.
 *
 * It reads `APP_BASE_URL` rather than restating a URL, so the day
 * `NEXT_PUBLIC_BASE_URL` is set both roots move together.
 *
 * ## What this did NOT fix, said plainly
 *
 * It was added while chasing Next's `metadataBase ... is not set` warning,
 * which a production build emits **four times**. It did not silence it, and
 * two attempts is where this repository's working rules stop guessing.
 *
 * Measured instead. In the prerendered HTML, `[locale]` pages resolve their
 * OG image against `https://localhost:3000` — `APP_BASE_URL`'s fallback, so
 * that tree is reading a base — while `/cms` resolves against
 * `http://localhost:3000`, which is Next's own default when it has none. The
 * image itself is `app/opengraph-image.png`, file-based metadata sitting
 * **above both root layouts**, and adding `metadataBase` here and again on
 * `cms/layout.tsx` moved neither the count nor that URL.
 *
 * So the warning is understood but open, and its blast radius is small: the
 * two routes affected are `/cms`, which is `robots: noindex`, and the bare
 * root, which redirects. Every indexed page already resolves against
 * `APP_BASE_URL`. The setting that actually matters is
 * `NEXT_PUBLIC_BASE_URL`, still unset — `docs/DEPLOYMENT.md` §2.1 owns it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
}

/*
  Root layout #1 of two. Bare shell for routes that must NOT be localized:
  Sanity Studio, and the 404 boundary for anything outside the localized site.

  This project has multiple root layouts because `next/root-params` only
  exposes a dynamic segment that sits ABOVE the root layout — which is what
  makes `app/[locale]/layout.tsx` the other root. Studio has no business
  carrying a locale prefix, so it gets its own root here rather than being
  dragged under `[locale]`.

  Everything app-specific — providers, metadata, JSON-LD, analytics — lives in
  app/[locale]/layout.tsx so Studio doesn't inherit it. Anything added here is
  a deliberate decision to ship it to Studio too.

  Font variables stay on <html> so portaled UI (toasts, dialogs…) inherits
  them for free; Studio paying a font preload is an acceptable cost for that
  simplicity.
*/
export default function ChromeLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={fontsVariable}
      /*
        No `data-theme` — Tahap 43.
        
        It used to sit here as a hardcoded `dark`, written for a "no-flash
        initial paint" that it did not deliver: `components/layout/theme`
        then corrected it in an effect, so a route declaring `theme="light"`
        painted dark first and, without JavaScript, stayed dark. Measured on
        all five reachable routes (`docs/stages/TAHAP-43.md` §3).
        
        The theme now renders as an element inside the page, which is the
        only place that knows which route it is. `suppressHydrationWarning`
        went with it: nothing mutates this element after hydration any more,
        so a mismatch here would be a real defect rather than an expected
        one.
      */
    >
      <body>{children}</body>
    </html>
  )
}
