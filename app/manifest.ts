import type { MetadataRoute } from 'next'

import { SITE } from '@/lib/seo/site'
import { themes } from '@/styles/colors'

export default function manifest(): MetadataRoute.Manifest {
  return {
    // From `lib/seo/site.ts`, not `package.json`. The installed-app name used
    // to read `@darkroom.engineering/satus` — a package identifier is not a
    // display name, and it is what a person sees on their home screen.
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    // The ink. See the note on `themeColor` in app/[locale]/layout.tsx: this
    // palette is deliberately neutral, so the installed-app chrome is too.
    background_color: themes.dark.primary,
    theme_color: themes.dark.primary,
    // `sizes` must match the real pixel dimensions of each file — a browser
    // that trusts a wrong value picks the wrong icon, and nothing validates
    // this. One entry per file: listing `/icon.png` twice made the same
    // bytes look like two separate icons.
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
