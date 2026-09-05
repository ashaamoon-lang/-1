import type { Meta, StoryObj } from '@storybook/react'

import { NextProject } from './index'

/**
 * The way out of a project page that is not the back button.
 *
 * Which project is "next" is decided by `nextProject()` in
 * `lib/content/next-project.ts` — it follows the curated order and wraps, so
 * the last work leads back to the first. This component only renders what it
 * is handed, which is why the selection logic is unit-tested separately
 * rather than through a story.
 */
const meta = {
  title: 'Blocks/NextProject',
  component: NextProject,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof NextProject>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { eyebrow: 'Next project', title: 'Rimbun', slug: 'rimbun' },
}

/** Indonesian, with the longer label the translation produces. */
export const Indonesian: Story = {
  args: {
    eyebrow: 'Karya berikutnya',
    title: 'Pusat Beban',
    slug: 'pusat-beban',
  },
}

/** The title wraps rather than pushing the layout sideways. */
export const LongTitle: Story = {
  args: {
    eyebrow: 'Next project',
    title: 'A six-month retainer across three teams at Kedai Sembilan',
    slug: 'rimbun',
  },
}

/**
 * Under reduced motion the hover scale is removed outright rather than made
 * instant — an abrupt jump is what the preference exists to avoid.
 */
export const ReducedMotion: Story = {
  args: { eyebrow: 'Next project', title: 'Rimbun', slug: 'rimbun' },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
