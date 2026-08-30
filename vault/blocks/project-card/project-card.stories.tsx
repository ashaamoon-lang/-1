import type { Meta, StoryObj } from '@storybook/react'

import { type Project, ProjectCard } from './index'

/**
 * ## A note on the missing images
 *
 * Every story here renders with `cover: null`, and that is a limitation
 * rather than a design choice. `SanityImage` builds its URL through
 * `urlForImage`, which throws without a configured project id and, even with
 * one, resolves against a dataset that currently holds **zero** published
 * assets. A story pointing at a fabricated asset ref would render a broken
 * image and prove less than nothing.
 *
 * What these stories do exercise is the part that fails silently in
 * production: the reserved box. The card holds its `4 / 5` (or `16 / 9`)
 * shape before any asset arrives, which is what stops the grid reflowing as
 * images load. Once the CMS has work in it, this file gets a fixture with a
 * real ref.
 */
const meta = {
  title: 'Blocks/ProjectCard',
  component: ProjectCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectCard>

export default meta

type Story = StoryObj<typeof meta>

const base: Project = {
  _id: 'fixture-1',
  slug: { current: 'panas-sore' },
  title: 'Panas Sore',
  coverAlt: 'Acrylic painting, three figures under a low orange sun',
  medium: 'Acrylic on linen',
  year: 2025,
  client: null,
  span: 6,
  cover: null,
}

export const Half: Story = {
  args: { project: base },
}

/** A full-width card takes a wider crop, so the two spans read differently. */
export const Full: Story = {
  args: {
    project: { ...base, _id: 'fixture-2', span: 12, title: 'Tenun' },
  },
}

/**
 * The metadata line joins whatever exists. Every part is optional in the
 * schema, so a card with only a year must not render a stray separator.
 */
export const MinimalMetadata: Story = {
  args: {
    project: {
      ...base,
      _id: 'fixture-3',
      medium: null,
      client: null,
      year: 2024,
    },
  },
}

/**
 * A project with no slug has no page to link to. The schema requires one, so
 * this only happens on an unpublished draft — the card renders nothing rather
 * than a dead link.
 */
export const NoSlugRendersNothing: Story = {
  args: {
    project: { ...base, _id: 'fixture-4', slug: null },
  },
}

/**
 * Under reduced motion the hover scale is removed outright rather than made
 * instant — an abrupt jump is exactly what the preference exists to avoid.
 * Hover the card with the OS preference set to verify.
 */
export const ReducedMotion: Story = {
  args: { project: base },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
