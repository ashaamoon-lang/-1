import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from '@/vault/motion/reveal'

import { Formwork } from './index'

/**
 * Each item arrives inside a dashed form; the form is struck a beat later.
 *
 * Inside a `Reveal`, because the form follows the reveal contract rather than
 * running a reveal of its own. The labels name the parts, not anything the
 * studio made — this shows the motion, not content. Like `Reveal`'s story, it
 * sits below a screen of empty space so the motion happens on scroll.
 */
const meta = {
  title: 'Vault/Motion/Formwork',
  component: Formwork,
  parameters: {
    docs: {
      description: {
        component:
          'Items arrive inside dashed forms; after a beat each form is struck in reading order, fading and dropping half a gutter, and the item stands without it. Reduced motion and no script both show the struck state.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal>
        <ul style={{ display: 'grid', gap: '1rem', listStyle: 'none' }}>
          {['First member', 'Second member', 'Third member'].map((label) => (
            <Formwork {...args} key={label} as="li">
              <p className="caption" style={{ padding: '1rem' }}>
                {label}
              </p>
            </Formwork>
          ))}
        </ul>
      </Reveal>
    </>
  ),
} satisfies Meta<typeof Formwork>

export default meta

type Story = StoryObj<typeof meta>

export const Struck: Story = {
  args: { children: null },
}
