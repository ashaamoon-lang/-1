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
      // Default theme rendered server-side for no-flash initial paint; the
      // client <Theme> updates data-theme per route via effect.
      data-theme="dark"
      // NOTE: data-theme is updated client-side per route, which would
      // otherwise trip a hydration warning.
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
