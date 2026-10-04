import type { Meta, StoryObj } from '@storybook/react'

import { CoverPreview, PreviewCover } from './index'

/**
 * A plate that carries the cover of the work in hand along a frame.
 *
 * Change the place (`x`, `y`) to watch it glide, and `current` to watch the
 * covers cross-fade; turn `on` off to watch it fade where it stands. In the
 * catalogue's frame the reader sets all of it from the work under the
 * pointer or the keyboard focus. The covers here are plain swatches of the
 * palette's own lines, not anything the studio made.
 */
const SWATCHES = [
  { id: 'a', ground: 'var(--line)' },
  { id: 'b', ground: 'var(--line-strong)' },
  { id: 'c', ground: 'var(--text-muted)' },
] as const

const meta = {
  title: 'Vault/Motion/CoverPreview',
  component: CoverPreview,
  parameters: {
    docs: {
      description: {
        component:
          'A 4:5 plate placed beside the work in hand. It glides between works and its covers cross-fade, both in the fast band. Reduced motion places it and changes it at once.',
      },
    },
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        inlineSize: 'calc(var(--gap) * 24)',
        blockSize: 'calc(var(--gap) * 12)',
        border: 'thin solid var(--line)',
      }}
    >
      <CoverPreview {...args}>
        {SWATCHES.map(({ id, ground }) => (
          <PreviewCover key={id} id={id}>
            <span style={{ display: 'block', backgroundColor: ground }} />
          </PreviewCover>
        ))}
      </CoverPreview>
    </div>
  ),
} satisfies Meta<typeof CoverPreview>

export default meta

type Story = StoryObj<typeof meta>

export const InHand: Story = {
  args: { on: true, x: 224, y: 24, width: 112, current: 'a', children: null },
}
