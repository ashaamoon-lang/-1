import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Dimension } from './index'

/**
 * A span, measured: the witnesses drop, then the line runs out from its centre
 * to meet them.
 *
 * Inside a `Reveal`, because the drawing follows the reveal contract rather
 * than running one of its own. The labels name the parts, not anything the
 * studio made — this shows the motion, not content. Like `Reveal`'s story, it
 * sits below a screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Dimension',
  component: Dimension,
  parameters: {
    docs: {
      description: {
        component:
          'Witness lines drop at both ends, then the dimension line runs out from its centre and carries the marks to their places; the value and ends arrive as reveal items. Reduced motion and no script both show the finished drawing.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <Dimension {...args} className="caption" />
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Dimension>

export default meta

type Story = StoryObj<typeof meta>

export const Span: Story = {
  args: {
    children: 'The measured value',
    from: 'Start',
    to: 'End',
    marks: [0.25, 0.5],
  },
}
