import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Counter } from './index'

const meta = {
  title: 'Vault/Motion/Counter',
  component: Counter,
  parameters: {
    docs: {
      description: {
        component:
          'A number that counts **between states**, never on arrival. Tahap ' +
          '42 moved it there deliberately: a figure that dances the first ' +
          'time it is seen is decoration, and the `taste-skill` rule that ' +
          'motion must be motivated rejects it. Counting when a filter ' +
          'changes the result is feedback — the number is answering the ' +
          'press. `labels` is an array rather than a formatter because a ' +
          'function cannot cross the RSC boundary, and because pluralization ' +
          'belongs on the server that already knows the locale.',
      },
    },
  },
} satisfies Meta<typeof Counter>

export default meta
type Story = StoryObj<typeof meta>

const labels = Array.from({ length: 13 }, (_, n) =>
  n === 1 ? '1 work' : `${n} works`
)

/** At rest. Mounting does not animate — only a change does. */
export const AtRest: Story = { args: { value: 6, labels } }

/**
 * The state this exists for. Press a chip and the figure travels to the new
 * total rather than being replaced by it.
 */
export const Filtering: Story = {
  args: { value: 6, labels },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
        <Counter {...args} value={value} />
        {[6, 2, 12, 0].map((next) => (
          <button key={next} type="button" onClick={() => setValue(next)}>
            → {next}
          </button>
        ))}
      </div>
    )
  },
}
