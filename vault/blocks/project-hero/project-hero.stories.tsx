import type { Meta, StoryObj } from '@storybook/react'

import { ProjectHero } from './index'

/**
 * The top of a project page: title, cover, and the facts about the work.
 *
 * `cover` is `null` in every story — `SanityImage` builds its URL through
 * `urlForImage`, and a fabricated asset ref would render a broken image. What
 * these do exercise is the part that varies per project: which facts exist.
 * An editor who has not filled in the scope must not produce a
 * "Scope —" row, and a project with no client at all must not leave a
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
    coverAlt: 'A system diagram, one mass lit from the left',
    meta: [
      { label: 'Client', value: 'Rumah Tanjung' },
      { label: 'Year', value: 2025 },
      { label: 'Engagement', value: 'Architecture review, six weeks' },
      { label: 'Scope', value: '2 teams · 6 weeks' },
    ],
  },
}

/** Missing facts are dropped, not rendered as empty rows. */
export const PartialMetadata: Story = {
  args: {
    title: 'Senja Ungu',
    coverAlt: 'A tall violet frame lit from below',
    meta: [
      { label: 'Client', value: null },
      { label: 'Year', value: 2024 },
      { label: 'Engagement', value: 'Data pipeline, fixed scope' },
      { label: 'Scope', value: undefined },
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
      { label: 'Scope', value: null },
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
    title: 'A six-month retainer across three teams at Kedai Sembilan',
    coverAlt: '',
    meta: [{ label: 'Year', value: 2025 }],
  },
}

/** Nothing here animates, so the preference changes nothing by construction. */
export const ReducedMotion: Story = {
  args: {
    title: 'Panas Sore',
    coverAlt: '',
    meta: [{ label: 'Engagement', value: 'Architecture review, six weeks' }],
  },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
