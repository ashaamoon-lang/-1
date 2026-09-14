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

/**
 * The horizontal run — and until Tahap 70 **nothing drew it**.
 *
 * Tahap 64 built the pinned sideways track: tokenised, reduced-motion aware,
 * with an epic marker and an accessible label in both dictionaries, and the
 * project page passes `run`. But the mode only engages at `RUN_MINIMUM`, and
 * three separate things had to be true for that — none of them were. Every one
 * of the six seeded projects carries exactly two plates; no story passed `run`;
 * and the unit tests cover plate widths and `loneHalves`, not the condition.
 *
 * `Five` above is the sharpest version of it: five images, clear of the
 * minimum with room to spare, still drawing a grid — because the prop that
 * chooses the mode was never handed over. A catalogue that demonstrates the
 * wrong mode at exactly the count built for the other one documents the block
 * wrong, which is the lesson Tahap 67 paid fifty-five stages for.
 *
 * Four, not five, because four is the floor the block argues for: at `34vw`
 * per item a run has to out-measure its own box by about a screen to read as
 * travel rather than as a nudge, and three items clear the viewport by roughly
 * 320px against four's 800px. This story is the smallest honest run.
 */
export const Run: Story = { args: { images: images(4), run: true } }
