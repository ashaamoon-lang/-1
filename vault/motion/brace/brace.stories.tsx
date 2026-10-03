import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Brace } from './index'

/**
 * A frame of bays, each racked until its brace goes in and pulls it square.
 *
 * Inside a `Reveal`, because the bays follow the reveal contract. Four bays,
 * the third marked current; the caption names the part, not anything the
 * studio made — this shows the motion, not content. Like `Reveal`'s story, it
 * sits below a screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Brace',
  component: Brace,
  parameters: {
    docs: {
      description: {
        component:
          'Each bay arrives leaning a quarter of its height; its diagonal goes in, then the bay is pulled square, in order along the frame. The current bay is drawn in the stronger line. Reduced motion and no script both show every bay braced and square.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <div aria-hidden="true" style={{ display: 'flex', gap: '0.5rem' }}>
          {[0, 1, 2, 3].map((index) => (
            <Brace {...args} key={index} index={index} current={index === 2} />
          ))}
        </div>
        <p data-reveal-item className="caption">
          A braced frame
        </p>
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Brace>

export default meta

type Story = StoryObj<typeof meta>

export const Frame: Story = {
  args: {},
}
