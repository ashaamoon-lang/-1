import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Level } from './index'

/**
 * A beam that hangs one gutter low at its free end, then comes to level as
 * the rows beneath it arrive.
 *
 * Inside a `Reveal`, because the beam settles on the reveal contract rather
 * than running a reveal of its own. The rows name the parts, not anything the
 * studio made — this shows the motion, not content. Like `Reveal`'s story, it
 * sits below a screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Level',
  component: Level,
  parameters: {
    docs: {
      description: {
        component:
          'Fixed at its start and hanging one gutter low at its free end, the beam rises to level in the house settle as the reveal brings in what rests beneath it — rotation only, never past level. Reduced motion and no script both show it level.',
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
          Above the beam
        </p>
        <Level {...args} />
        {['First support', 'Second support'].map((label) => (
          <p data-reveal-item key={label}>
            {label}
          </p>
        ))}
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Level>

export default meta

type Story = StoryObj<typeof meta>

export const Settle: Story = {
  args: {},
}
