import type { Meta, StoryObj } from '@storybook/react'

import { GridToggle, GridUnderlay } from './index'

/**
 * The page grid, drawn over the page on request.
 *
 * Press the chip, or `g` anywhere outside a field: the columns let down one
 * after another. Press it again to take them away. The grid lasts for the
 * visit and is not stored.
 */
const meta = {
  title: 'Vault/Motion/GridUnderlay',
  component: GridUnderlay,
  parameters: {
    docs: {
      description: {
        component:
          'Twelve columns (four on a phone) at the page grid’s own widths, drawn over the page while asked for. Reduced motion draws them at once.',
      },
    },
  },
  render: (args) => (
    <>
      <GridToggle label="Show the grid" />
      <GridUnderlay {...args} />
    </>
  ),
} satisfies Meta<typeof GridUnderlay>

export default meta

type Story = StoryObj<typeof meta>

export const OnRequest: Story = {}
