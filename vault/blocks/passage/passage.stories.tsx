import type { Meta, StoryObj } from '@storybook/react'

import { SectionHeader } from '@/components/ui/section-header'

import { Passage } from './index'

const meta = {
  title: 'Vault/Blocks/Passage',
  component: Passage,
  parameters: {
    docs: {
      description: {
        component:
          "The home page's third choreographed moment. What is shown here is " +
          'its **resting state** — the one a reader sees with JavaScript off ' +
          'or reduced motion on — because the choreography is a pinned, ' +
          'scrubbed timeline and a story frame has no page to scroll. That ' +
          'resting state is the point of the story: every tween is a ' +
          '`fromTo`, so nothing is ever stranded invisible, and this is what ' +
          'the block looks like when none of them run.',
      },
    },
  },
} satisfies Meta<typeof Passage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * What the home page passes it: the work section's own header, with its own
 * title and count. No copy was added for the passage — the page has no spare
 * words, and that constraint is what made this a slot rather than a block
 * with props.
 */
export const Default: Story = {
  args: {
    children: <SectionHeader title="Work" aside="Six works" />,
  },
}

/**
 * Indonesian, which is a real locale here rather than a demonstration — and
 * the check that a longer count string does not push the header off its
 * own row.
 */
export const Indonesian: Story = {
  args: {
    children: <SectionHeader title="Karya" aside="Enam karya" />,
  },
}
