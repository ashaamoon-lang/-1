import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Datum } from './index'

/**
 * A level that stays still while what is set out from it moves away from it:
 * the row above rises into place, the rows below sink into place.
 *
 * Inside a `Reveal`, because the datum only points the reveal's offset; it
 * runs nothing of its own. The labels name the parts, not anything the studio
 * made — this shows the motion, not content. Like `Reveal`'s story, it sits
 * below a screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Datum',
  component: Datum,
  parameters: {
    docs: {
      description: {
        component:
          'The level line is drawn and never moves; items above it arrive rising and items below it arrive sinking, each away from the datum by the reveal’s own gutter. Reduced motion and no script both show everything in place.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <Datum {...args} />
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Datum>

export default meta

type Story = StoryObj<typeof meta>

export const Level: Story = {
  args: {
    above: <p data-reveal-item>Above the datum</p>,
    label: 'The datum',
    below: (
      <>
        <p data-reveal-item>At the datum</p>
        <p data-reveal-item>Below the datum</p>
      </>
    ),
  },
}
