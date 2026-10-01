import type { Meta, StoryObj } from '@storybook/react'

import { PixelImage } from './index'

/**
 * A stand-in plate, so the veil has something to be in front of.
 *
 * `data-reveal` is set here by hand rather than by `useReveal`: a story is a
 * static frame, and the point of this one is to show the two states side by
 * side rather than to re-test the observer that `vault/motion/reveal` already
 * has a story for.
 */
function Plate({
  revealed,
  children,
}: {
  revealed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      data-reveal={revealed ? 'visible' : 'hidden'}
      style={{
        position: 'relative',
        width: '320px',
        aspectRatio: '3 / 2',
        overflow: 'clip',
        background:
          'linear-gradient(135deg, var(--color-secondary), var(--surface-2))',
      }}
    >
      {children}
    </div>
  )
}

const meta = {
  title: 'Vault/Magic/PixelImage',
  component: PixelImage,
  parameters: {
    docs: {
      description: {
        component:
          'A plate that assembles out of blocks instead of fading in. The ' +
          'technique is Magic UI’s — a grid of tiles whose clip-path is ' +
          'static so only opacity animates — and the implementation is ' +
          'inverted: rather than stacking one copy of the image per tile, ' +
          'this renders a veil of ground-coloured tiles above the real ' +
          'image and takes them away. One image, one alt, no duplication. ' +
          'The trigger is the site’s own reveal contract, so it arrives ' +
          'where the reader reaches it; under reduced motion the veil is not ' +
          'rendered at all.',
      },
    },
  },
} satisfies Meta<typeof PixelImage>

export default meta
type Story = StoryObj<typeof meta>

/** Before: every tile still in place, and the plate is not yet readable. */
export const Covered: Story = {
  args: {},
  decorators: [
    (Story) => (
      <Plate revealed={false}>
        <Story />
      </Plate>
    ),
  ],
}

/** After: the same veil, dissolved. This is what a reader ends up with. */
export const Revealed: Story = {
  args: {},
  decorators: [
    (Story) => (
      <Plate revealed>
        <Story />
      </Plate>
    ),
  ],
}

/**
 * Sixty-four tiles instead of twenty-four. Finer, and slower — the stagger is
 * per tile, so the dissolve runs nearly three times as long. Included as the
 * upper bound rather than as an option.
 */
export const Fine: Story = {
  args: { grid: '8x8' },
  decorators: [
    (Story) => (
      <Plate revealed>
        <Story />
      </Plate>
    ),
  ],
}
