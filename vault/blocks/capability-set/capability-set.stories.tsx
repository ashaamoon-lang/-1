import type { Meta, StoryObj } from '@storybook/react'

import { CapabilitySet } from './index'

const meta = {
  title: 'Vault/Blocks/CapabilitySet',
  component: CapabilitySet,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'What a practice covers, as four full-scale statements a reader ' +
          'moves through rather than one dot-separated run of them. The ' +
          'content is the same `studio.capabilities.<practice>` line the ' +
          'studio page has published since Tahap 24 — this block changes its ' +
          'shape, not its words. Unnumbered on purpose: `StepSequence` ' +
          'counts `01 / 04` because a process is ordered, and a set of ' +
          'capabilities is not.',
      },
    },
  },
} satisfies Meta<typeof CapabilitySet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'What that covers',
    items: [
      'Architecture review',
      'System mapping',
      'Technical due diligence',
      'Decision records',
    ],
  },
}

/**
 * The shortest set that still has somewhere for the lead to move.
 *
 * A practice whose line lost a separator degrades to one item, and
 * `lib/content/practices.test.ts` is what stops that reaching a reader — but
 * the block should still render rather than break, so the low end is a story
 * and not an assumption.
 */
export const Two: Story = {
  args: { label: 'What that covers', items: Default.args.items.slice(0, 2) },
}
