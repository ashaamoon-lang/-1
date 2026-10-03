import type { Meta, StoryObj } from '@storybook/react'

import { NorthArrow } from './index'

/**
 * A drawing's north point, turned to bear on what it is shown.
 *
 * Change `bearing` (radians clockwise from up) to watch the needle swing the
 * short way round and settle. On the 404 the wayfinder sets it from the
 * suggestion under the pointer or the keyboard focus.
 */
const meta = {
  title: 'Vault/Motion/NorthArrow',
  component: NorthArrow,
  parameters: {
    docs: {
      description: {
        component:
          'The needle turns to the bearing it is given and settles without overshoot. Reduced motion shows it bearing on the same place at once.',
      },
    },
  },
} satisfies Meta<typeof NorthArrow>

export default meta

type Story = StoryObj<typeof meta>

export const Bearing: Story = {
  args: { bearing: Math.PI / 3 },
}
