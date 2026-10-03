import type { Meta, StoryObj } from '@storybook/react'

import { ReplySlip } from './index'

/**
 * A periodical's reply slip: a perforated edge, a label, the subject the
 * reader's letter will carry, and the action.
 *
 * Still — there is no motion to see, by design. The text names the parts, not
 * anything the studio made; this shows the layout, not content.
 */
const meta = {
  title: 'Vault/Blocks/ReplySlip',
  component: ReplySlip,
  parameters: {
    docs: {
      description: {
        component:
          'A perforated edge below an article, then the reader’s turn: a label, the subject their letter will carry, and the action. Deliberately still: the action is a press target, and a slip is printed, not performed.',
      },
    },
  },
} satisfies Meta<typeof ReplySlip>

export default meta

type Story = StoryObj<typeof meta>

export const Slip: Story = {
  args: {
    label: 'Reply',
    subject: 'Re: The subject of the piece',
    action: <p className="p-big">The action it asks for</p>,
  },
}
