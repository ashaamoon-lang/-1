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

  /*
   * Set during render as well as in the effect — Tahap 70.
   *
   * The effect alone was enough while this was the only decorator. Adding
   * `withIntl` beside it stopped the effect firing for `Blocks/ProjectGallery`
   * specifically: measured, those stories rendered with `data-theme` **null**
   * and the bare light `:root` ground (`oklch(0.964 …)`) while `Blocks/Hero`
   * still got `dark`. No console error and no page error — the effect simply
   * did not run, and swapping the decorator order changed nothing.
   *
   * The root cause of that interaction is still not understood, so this does
   * not pretend to fix it. What it does is remove the dependency on an effect
   * firing at all: the attribute is a property of the document, not of React
   * state, and writing it on the way through is deterministic regardless of
   * how the decorator chain reconciles.
   *
   * The effect stays, because it is what reacts to the toolbar switching the
   * global after the first render.
   */
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

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
