import type { Decorator, Preview } from '@storybook/react'
import { NextIntlClientProvider } from 'next-intl'
import { useEffect } from 'storybook/preview-api'

import messages from '../messages/en.json'

import '../lib/styles/css/index.css'

// The site applies a palette by setting `data-theme` on <html>; global.css then
// derives --surface/--line from --color-secondary. Setting the attribute on the
// iframe's documentElement (not a wrapper) makes those derived tokens resolve
// exactly as they do on the site, so editing the site's CSS tokens updates
// Storybook too.
// Mirrors `themeNames` in lib/styles/colors.ts. `red` was removed in Tahap 1
// v2; leaving it here offered a theme with no rules behind it, which rendered
// as the bare `:root` defaults and looked like a styling bug.
const THEMES = ['dark', 'light'] as const

/**
 * The real dictionary, because a catalogue that cannot render a string is not
 * a catalogue — Tahap 70.
 *
 * Every `vault/` block that speaks calls `useTranslations`, and Storybook had
 * **no provider at all**. Nothing caught it because no story had ever rendered
 * a branch that actually calls `t(key)`: the gallery, for instance, reads
 * `useTranslations('lightbox')` at the top and only uses it inside the
 * horizontal run and the lightbox, neither of which any story drew.
 *
 * Tahap 70's `Run` story was the first, and it threw — `Error rendering story
 * 'blocks-projectgallery--run'` — with the run never reaching the DOM. A
 * component catalogue where adding one honest story crashes it has a gap, not
 * a bad story.
 *
 * `messages/en.json` itself rather than a stub: a stub drifts, and the whole
 * value of rendering real labels is that `storybook-a11y` then measures the
 * accessible names the site actually ships. `en` because the catalogue
 * documents the components, not the localisation — the bilingual contract has
 * its own gates against the dictionaries.
 */
const withIntl: Decorator = (Story) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <Story />
  </NextIntlClientProvider>
)

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return <Story />
}

const preview: Preview = {
  decorators: [withTheme, withIntl],
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEMES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(?<colorField>background|color)$/i,
        date: /(?<dateField>Date)$/i,
      },
    },
  },
}

export default preview
