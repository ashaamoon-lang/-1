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
 * ## Why it alone did not silence the warning — Tahap 92
 *
 * It was added while chasing Next's `metadataBase ... is not set` warning,
 * which a production build emits **four times**. It did not silence it, and a
 * third attempt — the same export on `cms/[[...tool]]/page.tsx` — did not
 * either. Three failures is well past where this repository's rules stop
 * guessing, so the artifacts were read instead of the docs.
 *
 * The URL says which mechanism produced it. Every route under `[locale]`
 * carries `https://localhost:3000/opengraph-image.png` — `APP_BASE_URL`'s
 * fallback, no query — because `lib/utils/metadata.ts` gives each page an
 * `openGraph.images` of its own. The two routes in **this** tree carry
 * `http://localhost:3000/opengraph-image.png?opengraph-image.<hash>.png`, and
 * that query is the signature of file-based metadata: `app/opengraph-image.png`,
 * attached to the `app/` segment, which is **above every layout that can set a
 * base**. No `metadataBase` written below it can reach it, which is why three
 * attempts to write one lower changed nothing.
 *
 * Measured, the affected routes are `/cms` (`robots: noindex`) and
 * `_not-found`. An earlier draft of this note named the second one as the bare
 * root, which redirects; that was wrong, and this is the correction.
 *
 * ## What was actually changed
 *
 * Declaring `openGraph.images` empty here removed the tags but **not** the
 * warning: measured, `/cms` served zero `og:image` and zero `twitter:image`
 * and still logged it once per render, because Next resolves the inherited
 * file's URL before a deeper config discards it. So the file moved instead
 * — `app/opengraph-image.png` → `public/opengraph-image.png`. Same bytes,
 * same URL, and `next.config.ts` caches it by **path**, so its
 * `Cache-Control` is untouched; it is simply no longer metadata that a tree
 * inherits. `lib/utils/metadata.ts` names it explicitly for every indexed
 * page, which is how those pages already resolved it — measured, not one
 * `[locale]` route carried the file convention's `?opengraph-image.<hash>`
 * query.
 *
 * The division stated above therefore holds for the first time: this tree has
 * no title, no description, no OG image and no JSON-LD.
 *
 * `NEXT_PUBLIC_BASE_URL` remains the setting that actually matters, and
 * remains unset — `docs/DEPLOYMENT.md` §2.1 owns it.
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
