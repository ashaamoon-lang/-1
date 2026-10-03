import type { Meta, StoryObj } from '@storybook/react'

import { Plumb } from './index'

/**
 * A plumb line let down beside a block as it comes up the screen.
 *
 * No `Reveal` around it: the line follows the block's own passage through
 * the viewport, not a reveal. The rows name the parts, not anything the
 * studio made — this shows the motion, not content. It sits below a screen of
 * empty space, because the line only pays out as the block scrolls into view.
 */
const meta = {
  title: 'Vault/Motion/Plumb',
  component: Plumb,
  parameters: {
    docs: {
      description: {
        component:
          'A line grows down beside the block, its bob riding the end, in step with the block entering the screen — a CSS view timeline, linear, no script. Reduced motion, no script and browsers without scroll-driven animation all show the line hanging its full length.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Plumb {...args} />
      <div style={{ minHeight: '50vh' }} />
    </>
  ),
} satisfies Meta<typeof Plumb>

export default meta

type Story = StoryObj<typeof meta>

export const Hanging: Story = {
  args: {
    children: (
      <ul className="caption" style={{ display: 'grid', gap: '1rem' }}>
        <li>First member</li>
        <li>Second member</li>
        <li>Third member</li>
        <li>Fourth member</li>
      </ul>
    ),
  },
}
