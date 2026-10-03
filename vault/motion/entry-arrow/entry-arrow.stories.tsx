import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { EntryArrow } from './index'

/**
 * The arrow a plan draws at the door the reader came in by.
 *
 * Press the button to arrive: the arrow is drawn once its parent carries
 * `data-arrived`, so a new `key` arrives again. The words name the part, not
 * anything the studio made — this shows the motion, not content.
 */
const meta = {
  title: 'Vault/Motion/EntryArrow',
  component: EntryArrow,
  parameters: {
    docs: {
      description: {
        component:
          'It slides in from outside its row to the edge it points across, and stays. Reduced motion shows it there at once.',
      },
    },
  },
  render: (args) => {
    const [arrivals, setArrivals] = useState(0)

    return (
      <div
        className="caption"
        style={{
          display: 'grid',
          justifyItems: 'start',
          gap: 'var(--gap)',
          paddingInlineStart: 'calc(var(--gap) * 2)',
        }}
      >
        <button type="button" onClick={() => setArrivals((n) => n + 1)}>
          Arrive
        </button>
        <span
          key={arrivals}
          style={{ position: 'relative' }}
          {...(arrivals > 0 && { 'data-arrived': '' })}
        >
          <EntryArrow {...args} />
          The section a link brought you to
        </span>
      </div>
    )
  },
} satisfies Meta<typeof EntryArrow>

export default meta

type Story = StoryObj<typeof meta>

export const Arrived: Story = {
  args: {},
}
