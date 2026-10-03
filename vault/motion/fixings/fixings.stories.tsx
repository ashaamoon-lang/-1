import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Fixings } from './index'

/**
 * A plate arrives with the reveal, then is fixed at its four corners in turn.
 *
 * Inside a `Reveal`, because the plate is a reveal item and the fixings follow
 * the reveal contract. The text names the part, not anything the studio made —
 * this shows the motion, not content. Like `Reveal`'s story, it sits below a
 * screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Fixings',
  component: Fixings,
  parameters: {
    docs: {
      description: {
        component:
          'The plate arrives as a reveal item; once it is in place a cross is set at each corner, clockwise, each growing from its own centre. Reduced motion and no script both show the plate already fixed.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <Fixings {...args} />
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Fixings>

export default meta

type Story = StoryObj<typeof meta>

export const Fixed: Story = {
  args: {
    children: <p className="p-big">The plate</p>,
  },
}
