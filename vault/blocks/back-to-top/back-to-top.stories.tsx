import type { Meta, StoryObj } from '@storybook/react'

import { BackToTop } from './index'

/**
 * A way back up a long page, offered after two screens.
 *
 * Scroll the canvas down past two screens and the chip rises in, lower
 * right; press it to glide back to the top. The tall block is only there to
 * scroll, and holds nothing the studio made.
 */
const meta = {
  title: 'Vault/Blocks/BackToTop',
  component: BackToTop,
  parameters: {
    docs: {
      description: {
        component:
          'A chip in the lower corner, rendered only once the reader is two screens down. Scrolls to the top through Lenis where the page runs it, and moves focus to the start of `main`.',
      },
    },
  },
  args: { label: 'Back to top' },
  render: (args) => (
    <div style={{ blockSize: '400vh' }}>
      <BackToTop {...args} />
    </div>
  ),
} satisfies Meta<typeof BackToTop>

export default meta

type Story = StoryObj<typeof meta>

export const LongPage: Story = {}
