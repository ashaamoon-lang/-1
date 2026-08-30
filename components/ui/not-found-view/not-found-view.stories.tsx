import type { Meta, StoryObj } from '@storybook/react'

import { NotFoundView } from './index'

/**
 * The 404 view.
 *
 * Worth a story of its own because its recovery links are the ones a reader
 * reaches for when everything else has already failed — and because two of
 * them (`/llms.txt`, `/sitemap.xml`) must NOT take a locale prefix while
 * `/ai` must. That distinction shipped broken once; `e2e/not-found.e2e.ts`
 * asserts it end to end now.
 *
 * Rendered here with the default raw anchors, which is the variant the root
 * `not-found.tsx` uses when it renders outside the router.
 */
const meta = {
  title: 'UI/NotFoundView',
  component: NotFoundView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotFoundView>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
