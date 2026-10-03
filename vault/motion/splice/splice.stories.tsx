import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Splice } from './index'

/**
 * Two halves set from their own ends, meeting at a joint, and the plate that
 * fixes them.
 *
 * Inside a `Reveal`, because the splice follows the reveal contract. The words
 * either side name the parts, not anything the studio made — this shows the
 * motion, not content. Like `Reveal`'s story, it sits below a screen of empty
 * space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Splice',
  component: Splice,
  parameters: {
    docs: {
      description: {
        component:
          'Each half of the member is set from its own end toward the joint; once they meet, a plate goes on across it. Nothing either side moves. Reduced motion and no script both show the joint made.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <p className="caption">
          A term <Splice {...args} /> what it means
        </p>
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Splice>

export default meta

type Story = StoryObj<typeof meta>

export const Joint: Story = {
  args: {},
}
