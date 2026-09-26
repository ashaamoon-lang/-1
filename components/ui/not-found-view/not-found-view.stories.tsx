import type { Meta, StoryObj } from '@storybook/react'

import { NotFoundView } from './index'

/**
 * The 404 view.
 *
 * Worth a story of its own because its recovery links are the ones a reader
 * reaches for when everything else has already failed.
 *
 * This note used to say two of those links (`/llms.txt`, `/sitemap.xml`) must
 * not take a locale prefix while `/ai` must. None of the three has been a
 * recovery link since Tahap 38 replaced them with pages a person can use
 * (`not-found-view/index.tsx`), and `/ai` itself was removed in Tahap 84.
 * Corrected in Tahap 89.
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
