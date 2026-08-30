import type { Meta, StoryObj } from '@storybook/react'

import { type Project, ProjectGrid } from './index'

/**
 * The grid owns placement and the staggered entrance; the card owns
 * everything inside its own box.
 *
 * As in `ProjectCard`'s stories, covers are `null` — the dataset holds no
 * published assets yet. What is worth looking at here is the column
 * behaviour: mixed 6/12 spans on desktop, every card full-width on mobile,
 * and `minmax(0, 1fr)` tracks that shrink instead of forcing horizontal
 * scroll when a title runs long.
 */
const meta = {
  title: 'Blocks/ProjectGrid',
  component: ProjectGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectGrid>

export default meta

type Story = StoryObj<typeof meta>

function fixture(
  id: string,
  title: string,
  year: number,
  span: 6 | 12,
  medium: string
): Project {
  return {
    _id: id,
    slug: { current: id },
    title,
    coverAlt: `${title} — ${medium}`,
    medium,
    year,
    client: null,
    span,
    cover: null,
  }
}

const projects: Project[] = [
  fixture('panas-sore', 'Panas Sore', 2025, 6, 'Acrylic on linen'),
  fixture('rimbun', 'Rimbun', 2025, 6, 'Gouache on paper'),
  fixture('tenun', 'Tenun', 2024, 12, 'Mural, exterior'),
  fixture('senja-ungu', 'Senja Ungu', 2024, 6, 'Oil on board'),
  fixture('lipat', 'Lipat', 2023, 6, 'Ink and collage'),
]

export const Default: Story = {
  args: { projects },
}

/** A uniform grid is what makes a portfolio read as a spreadsheet. */
export const UniformSpans: Story = {
  args: {
    projects: projects.map((project) => ({ ...project, span: 6 as const })),
  },
}

/** One work is a legitimate state, not an edge case to hide. */
export const SingleProject: Story = {
  // SAFETY: `projects` is a literal array with five entries declared above, so
  // index 0 always exists; `noUncheckedIndexedAccess` cannot see that.
  args: { projects: [projects[0] as Project] },
}

/**
 * Long titles are the usual cause of horizontal scroll on mobile. Every track
 * is `minmax(0, 1fr)` and every card sets `min-width: 0`, so the text wraps
 * instead of widening the page — resize the viewport to check.
 */
export const LongTitles: Story = {
  args: {
    projects: projects.map((project, index) => ({
      ...project,
      title: `${project.title} — an unusually long commissioned title that has to wrap ${index}`,
    })),
  },
}

/**
 * Under reduced motion `useReveal` skips the observer entirely and reveals
 * immediately, so no card is ever stranded at `opacity: 0`.
 */
export const ReducedMotion: Story = {
  args: { projects },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
