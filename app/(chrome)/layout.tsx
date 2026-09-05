import type { PropsWithChildren } from 'react'

import { fontsVariable } from '@/lib/styles/fonts'

import '@/lib/styles/css/index.css'

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
