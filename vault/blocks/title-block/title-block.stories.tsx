import type { Meta, StoryObj } from '@storybook/react'

import { TitleBlock } from './index'

/**
 * A drawing's title block: ruled cells of what the sheet is, for whom and
 * from whom, and the one action it asks for.
 *
 * Still — there is no motion to see, by design. The labels name the parts,
 * not anything the studio made; this shows the layout, not content.
 */
const meta = {
  title: 'Vault/Blocks/TitleBlock',
  component: TitleBlock,
  parameters: {
    docs: {
      description: {
        component:
          'Labelled facts ruled into cells, with the action beneath them. Deliberately still: the action is a press target, and a title block is the part of a sheet that never moves.',
      },
    },
  },
} satisfies Meta<typeof TitleBlock>

export default meta

type Story = StoryObj<typeof meta>

export const Sheet: Story = {
  args: {
    label: 'A title block',
    rows: [
      { label: 'Subject', value: 'What the sheet is' },
      { label: 'For', value: 'Who it is for' },
      { label: 'From', value: 'Who it comes from' },
    ],
    action: <p className="p-big">The one action it asks for</p>,
  },
}
