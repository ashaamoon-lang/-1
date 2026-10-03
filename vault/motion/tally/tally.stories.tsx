import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Tally } from './index'

/**
 * A count shown as strokes, gathered in fives, and counted out one stroke at a
 * time over a single slow beat.
 *
 * Inside a `Reveal`, because the strokes follow the reveal contract. The
 * caption names the part, not anything the studio made — this shows the
 * motion, not content. Like `Reveal`'s story, it sits below a screen of empty
 * space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Tally',
  component: Tally,
  parameters: {
    docs: {
      description: {
        component:
          'Strokes gathered in fives, counted out from the end nearest what they count for, over one slow beat whatever the number. Only opacity changes. Reduced motion and no script both show the full count.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <p data-reveal-item className="caption">
          <Tally {...args} /> {args.count} counted
        </p>
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Tally>

export default meta

type Story = StoryObj<typeof meta>

export const Count: Story = {
  args: { count: 12 },
}
