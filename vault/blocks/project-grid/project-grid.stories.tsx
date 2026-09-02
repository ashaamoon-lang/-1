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
 *
 * Compare `Default` with `Catalogue` side by side — that pair is the whole
 * point of the `layout` prop, and the difference is much easier to see here
 * than on the site.
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
  engagement: string
): Project {
  return {
    _id: id,
    slug: { current: id },
    title,
    coverAlt: `${title} — ${engagement}`,
    engagement,
    year,
    client: null,
    span,
    cover: null,
  }
}

const projects: Project[] = [
  fixture('arus-balik', 'Arus Balik', 2025, 6, 'Architecture review'),
  fixture('takar', 'Takar', 2025, 6, 'Data pipeline'),
  fixture('pusat-beban', 'Pusat Beban', 2024, 12, 'Retainer, six months'),
  fixture('senja-ungu', 'Senja Ungu', 2024, 6, 'Oil on board'),
  fixture('lipat', 'Lipat', 2023, 6, 'Ink and collage'),
]

export const Default: Story = {
  args: { projects },
}

/**
 * `layout="catalogue"` — what `/[locale]/work` and the discipline views use.
 *
 * Same five works, same data, one rhythm. The editorial layout above is right
 * for a curated selection and wrong for a full listing: with these spans it
 * puts `Tenun` on a row of its own and strands half a row of empty space on
 * either side of it. On the real catalogue that measured 3802px of page for
 * three works, with ~700px of dead gutter in two of the three rows.
 *
 * The span is overridden at placement rather than in the data, so the card's
 * image request width, its `sizes` attribute and its crop all follow the
 * column it actually lands in.
 */
export const Catalogue: Story = {
  args: { projects, layout: 'catalogue' },
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
