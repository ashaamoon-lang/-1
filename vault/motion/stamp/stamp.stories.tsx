import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Stamp } from './index'

/**
 * A ruled mark struck onto the sheet when something is done, its word
 * appearing only on contact.
 *
 * Press the button to stamp again: a stamp plays once, when it mounts, so a
 * new `key` is a new stamp. The word names an outcome, not anything the studio
 * made — this shows the motion, not content.
 */
const meta = {
  title: 'Vault/Motion/Stamp',
  component: Stamp,
  parameters: {
    docs: {
      description: {
        component:
          'The frame comes down half a gutter onto the sheet and stops dead; the ink appears once it touches. Reduced motion shows the stamp at once.',
      },
    },
  },
  render: (args) => {
    const [count, setCount] = useState(0)

    return (
      <div
        className="caption"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}
      >
        <button type="button" onClick={() => setCount((n) => n + 1)}>
          Stamp
        </button>
        <span role="status">
          {count > 0 && <Stamp key={count} {...args} />}
        </span>
      </div>
    )
  },
} satisfies Meta<typeof Stamp>

export default meta

type Story = StoryObj<typeof meta>

export const Copied: Story = {
  args: { children: 'Copied' },
}
