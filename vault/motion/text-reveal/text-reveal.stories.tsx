import type { Meta, StoryObj } from '@storybook/react'

import { TextReveal } from './index'

const meta = {
  title: 'Vault/Motion/TextReveal',
  component: TextReveal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'One-shot masked reveal on scroll entry. Lines rise from behind a ' +
          'clipped edge — the entrance measured on essentially every site in ' +
          'docs/TEARDOWN.md. Distinct from components/effects/progress-text, ' +
          'which scrubs opacity against scroll position instead.\n\n' +
          'To see the reduced-motion path, enable "Reduce motion" in your OS ' +
          'accessibility settings and reload: the text renders as plain, fully ' +
          'visible content and is never split.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TextReveal>

export default meta

type Story = StoryObj<typeof meta>

/** The default: split by line. Reads as typography rather than as an effect. */
export const Lines: Story = {
  args: {
    as: 'h2',
    split: 'lines',
    children: 'Commissioned work for people who notice the difference',
  },
  render: (args) => (
    <div
      style={{
        maxWidth: '16ch',
        fontSize: 'clamp(2rem, 5vw, 4rem)',
        lineHeight: '85%',
        letterSpacing: '-0.04em',
        fontWeight: 700,
      }}
    >
      <TextReveal {...args} />
    </div>
  ),
}

/** Word-level. Good for short display text; noisier on long copy. */
export const Words: Story = {
  args: {
    as: 'h2',
    split: 'words',
    children: 'Every detail, deliberate',
  },
  render: (args) => (
    <div
      style={{
        maxWidth: '14ch',
        fontSize: 'clamp(2rem, 5vw, 4rem)',
        lineHeight: '85%',
        letterSpacing: '-0.04em',
        fontWeight: 700,
      }}
    >
      <TextReveal {...args} />
    </div>
  ),
}

/**
 * Character-level. Included to show it works — and to make the point that it
 * should be used sparingly: on more than a few words it reads as a gimmick and
 * floods the DOM with spans.
 */
export const Chars: Story = {
  args: {
    as: 'h2',
    split: 'chars',
    children: 'Studio',
  },
  render: (args) => (
    <div
      style={{
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        lineHeight: '85%',
        letterSpacing: '-0.04em',
        fontWeight: 700,
      }}
    >
      <TextReveal {...args} />
    </div>
  ),
}
