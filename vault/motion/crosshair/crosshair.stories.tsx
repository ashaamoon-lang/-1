import type { Meta, StoryObj } from '@storybook/react'

import { Crosshair } from './index'

/**
 * Two hairlines run in from a grid's edges to the point in hand.
 *
 * Change the point (`x`, `y`, and the same point as `reachX`, `reachY`
 * fractions of the box) to watch the lines glide to it; turn `on` off to watch
 * them fade. In the catalogue's frame the reader sets the point from the work
 * under the pointer or the keyboard focus. The box is a stand-in for the
 * table, not content.
 */
const meta = {
  title: 'Vault/Motion/Crosshair',
  component: Crosshair,
  parameters: {
    docs: {
      description: {
        component:
          'One line along the row from the left edge, one down the column from the top, both ending at the point. They glide when the point moves. Reduced motion shows them there at once.',
      },
    },
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        inlineSize: 'calc(var(--gap) * 20)',
        blockSize: 'calc(var(--gap) * 10)',
        border: 'thin solid var(--line)',
      }}
    >
      <Crosshair {...args} />
    </div>
  ),
} satisfies Meta<typeof Crosshair>

export default meta

type Story = StoryObj<typeof meta>

export const Point: Story = {
  args: { on: true, x: 192, y: 96, reachX: 0.6, reachY: 0.6 },
}
