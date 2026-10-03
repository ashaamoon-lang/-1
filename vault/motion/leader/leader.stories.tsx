import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Leader } from './index'

/**
 * A line run from a note to the part it describes, turning once and ending in
 * a dot on the part.
 *
 * Inside a `Reveal`, because the leader follows the reveal contract. The words
 * name the parts, not anything the studio made — this shows the motion, not
 * content. Like `Reveal`'s story, it sits below a screen of empty space so the
 * motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Leader',
  component: Leader,
  parameters: {
    docs: {
      description: {
        component:
          'The line drops from the note, turns toward the part, and a dot lands on the part once the line arrives. Nothing either side moves. Reduced motion and no script both show the leader drawn.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <div
          className="caption"
          style={{ display: 'grid', gap: 'calc(var(--gap) * 0.5)' }}
        >
          <span>A note</span>
          <span style={{ display: 'flex', gap: 'calc(var(--gap) * 0.5)' }}>
            <Leader {...args} />
            <span>the part it describes</span>
          </span>
        </div>
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Leader>

export default meta

type Story = StoryObj<typeof meta>

export const Note: Story = {
  args: {},
}
