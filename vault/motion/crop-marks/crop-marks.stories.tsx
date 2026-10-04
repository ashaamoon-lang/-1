import type { Meta, StoryObj } from '@storybook/react'

import { CropMarks } from './index'

/**
 * Crop marks close in on a plate's corners while it is in hand.
 *
 * Hover the plate, or Tab to it: the four corners close in round the sheet.
 * A button stands in for the card's link so the story never navigates, and
 * the plate is a plain surface, not anything the studio made.
 */
const meta = {
  title: 'Vault/Motion/CropMarks',
  component: CropMarks,
  parameters: {
    docs: {
      description: {
        component:
          'Two short hairlines at each corner of a plate, outside it, shown while the control they sit in is hovered or keyboard-focused. Reduced motion shows them at once.',
      },
    },
  },
  render: (args) => (
    <button
      type="button"
      // The plate has no words of its own; the button still needs a name.
      aria-label="A plate in hand"
      style={{
        padding: 'calc(var(--gap) * 2)',
        border: 'none',
        background: 'none',
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'block',
          inlineSize: 'calc(var(--gap) * 12)',
          aspectRatio: '4 / 5',
          backgroundColor: 'var(--surface-2)',
        }}
      >
        <CropMarks {...args} />
      </span>
    </button>
  ),
} satisfies Meta<typeof CropMarks>

export default meta

type Story = StoryObj<typeof meta>

export const Plate: Story = {}
