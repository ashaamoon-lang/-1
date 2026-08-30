import type { Meta, StoryObj } from '@storybook/react'
import { NextIntlClientProvider } from 'next-intl'

import { LanguageSwitcher } from './index'

/**
 * The switcher reads the active locale and the current path from next-intl,
 * so it needs a provider around it. Storybook has no router locale, which is
 * why the active language reads as English here — on the site it follows the
 * URL.
 */
/*
 * Only the `language` namespace, written out rather than imported from
 * `messages/en.json`: the JSON is typed through `messages/en.d.json.ts`,
 * which needs `allowArbitraryExtensions` in tsconfig. Turning that on for one
 * story would loosen module resolution repo-wide.
 */
const messages = {
  language: { label: 'Language', switchTo: 'Switch to {language}' },
}

const meta = {
  title: 'UI/LanguageSwitcher',
  component: LanguageSwitcher,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof LanguageSwitcher>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * Both languages stay links. The active one is marked with `aria-current`,
 * which is also what the styling keys off — so the announced state and the
 * visible state cannot drift apart.
 */
export const Indonesian: Story = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="id" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
}

/**
 * The only motion here is a colour fade on hover, removed under the
 * preference. Nothing is ever left invisible, because nothing starts hidden.
 */
export const ReducedMotion: Story = {
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
