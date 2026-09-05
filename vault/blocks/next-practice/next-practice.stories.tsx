import type { Meta, StoryObj } from '@storybook/react'

import { NextPractice } from './index'

const meta = {
  title: 'Vault/Blocks/NextPractice',
  component: NextPractice,
  parameters: {
    docs: {
      description: {
        component:
          'The circuit a practice page closes. `e2e/site-reach.e2e.ts` ' +
          'exists because a page that ends with nowhere to go is where a ' +
          'reader leaves: before Tahap 38 an inner route offered one link ' +
          'out of its own content. The eyebrow is the label and the practice ' +
          'name is the target, so the link has one accessible name rather ' +
          'than two lines read as one sentence.',
      },
    },
  },
} satisfies Meta<typeof NextPractice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    href: '/practice/ai-data',
    eyebrow: 'Next practice',
    label: 'AI & Data',
  },
}

/** Indonesian, which is a real locale here rather than a demonstration. */
export const Indonesian: Story = {
  args: {
    href: '/id/practice/commission',
    eyebrow: 'Praktik berikutnya',
    label: 'Komisi',
  },
}
