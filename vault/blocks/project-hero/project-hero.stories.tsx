import type { Meta, StoryObj } from '@storybook/react'

import { ProjectHero } from './index'

/**
 * The top of a project page: title, cover, and the facts about the work.
 *
 * `cover` is `null` in every story — `SanityImage` builds its URL through
 * `urlForImage`, and a fabricated asset ref would render a broken image. What
 * these do exercise is the part that varies per project: which facts exist.
 * An editor who has not filled in dimensions must not produce a
 * "Dimensions —" row, and a project with no client at all must not leave a
 * gap in the meta grid.
 */
const meta = {
  title: 'Blocks/ProjectHero',
  component: ProjectHero,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectHero>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Panas Sore',
    coverAlt: 'Acrylic painting, three figures under a low orange sun',
    meta: [
      { label: 'Client', value: 'Rumah Tanjung' },
      { label: 'Year', value: 2025 },
      { label: 'Medium', value: 'Acrylic on linen' },
      { label: 'Dimensions', value: '120 × 90 cm' },
    ],
  },
}

/** Missing facts are dropped, not rendered as empty rows. */
export const PartialMetadata: Story = {
  args: {
    title: 'Senja Ungu',
    coverAlt: 'Gouache study in violet and amber',
    meta: [
      { label: 'Client', value: null },
      { label: 'Year', value: 2024 },
      { label: 'Medium', value: 'Gouache on paper' },
      { label: 'Dimensions', value: undefined },
    ],
  },
}

/** A study with nothing recorded but its name — the meta list disappears. */
export const NoMetadata: Story = {
  args: {
    title: 'Untitled',
    coverAlt: '',
    meta: [
      { label: 'Client', value: null },
      { label: 'Year', value: null },
      { label: 'Medium', value: '' },
      { label: 'Dimensions', value: null },
    ],
  },
}

/**
 * Long titles are where the `em` measure matters: it is relative to the
 * title's own fluid size, so the same number of characters fits at every
 * viewport.
 */
export const LongTitle: Story = {
  args: {
    title: 'A commissioned mural for the west wall of Kedai Sembilan',
    coverAlt: '',
    meta: [{ label: 'Year', value: 2025 }],
  },
}

/** Nothing here animates, so the preference changes nothing by construction. */
export const ReducedMotion: Story = {
  args: {
    title: 'Panas Sore',
    coverAlt: '',
    meta: [{ label: 'Medium', value: 'Acrylic on linen' }],
  },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
