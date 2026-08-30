import type { Meta, StoryObj } from '@storybook/react'

import { ProjectGallery } from './index'

/**
 * The images of one work.
 *
 * Covers are `null` here, as elsewhere, so what these stories show is the
 * width rhythm rather than the pictures: every third image full width, and a
 * trailing half that has nobody to pair with promoted to full. The counts
 * below are exactly the ones where a naive `index % 3` rule orphans the last
 * image — `isFullWidth` is unit-tested at every count in
 * `project-gallery.test.ts`.
 *
 * There is no lightbox, deliberately. That is a modal dialog with a focus
 * trap and a keyboard story of its own; a gallery without one is not
 * degraded.
 */
const meta = {
  title: 'Blocks/ProjectGallery',
  component: ProjectGallery,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProjectGallery>

export default meta

type Story = StoryObj<typeof meta>

const images = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    _key: `image-${index}`,
    alt: `Detail ${index + 1}`,
  }))

/** Full, half, half — the rhythm at its most typical. */
export const Three: Story = { args: { images: images(3) } }

/** Two images: both full, because a lone half beside six empty columns
 * reads as a picture that failed to load. */
export const Two: Story = { args: { images: images(2) } }

/** Five is the other count where the last image would otherwise be orphaned. */
export const Five: Story = { args: { images: images(5) } }

/** One image is a legitimate gallery, not an edge case. */
export const Single: Story = { args: { images: images(1) } }

/** An empty gallery renders nothing at all — no heading, no empty grid. */
export const Empty: Story = { args: { images: [] } }
