import type { Meta, StoryObj } from '@storybook/react'

import { Hero } from './index'

/**
 * The hero composes three vault pieces: `TextReveal` for the headline,
 * `Magnetic` for the single action, and `SceneShell` for the background.
 *
 * `SceneShell` renders its DOM gradient fallback here rather than a WebGL
 * canvas — the R3F canvas is mounted by `lib/features` in the app layout and
 * portalled into, and Storybook has no such layout. That is the fallback path
 * doing exactly what it exists for, so these stories are a fair check of the
 * non-WebGL rendering every visitor without a working GPU sees.
 */
const meta = {
  title: 'Blocks/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof Hero>

export default meta

type Story = StoryObj<typeof meta>

const action = (
  <button
    type="button"
    className="cta"
    style={{
      border: '1px solid var(--color-secondary)',
      padding: '12px 24px',
      textTransform: 'uppercase',
      cursor: 'pointer',
    }}
  >
    Start a commission
  </button>
)

export const Default: Story = {
  args: {
    headline: 'Commissioned work for people who notice',
    subline: 'Painting, mural and illustration, made to a brief and to a wall.',
    action,
  },
}

/** A hero is not a paragraph, and it is not a menu: one line, one action. */
export const HeadlineOnly: Story = {
  args: { headline: 'Arth' },
}

/**
 * Long headlines are where a masked line reveal usually breaks — the split
 * happens after layout, so a headline that wraps to four lines must still
 * reveal line by line rather than as one block.
 */
export const LongHeadline: Story = {
  args: {
    headline:
      'Commissioned painting, mural and illustration for people who notice what a room is doing',
    subline: 'Working to brief, at any scale, since 2019.',
    action,
  },
}

/**
 * Under reduced motion the headline renders as plain text, the reveals resolve
 * immediately, the magnet is inert, and the background is a static gradient.
 * Nothing is left at `opacity: 0` — which is the failure this project treats
 * as a defect rather than a trade-off.
 */
export const ReducedMotion: Story = {
  args: {
    headline: 'Commissioned work for people who notice',
    subline: 'Everything below is legible with no animation at all.',
    action,
  },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
