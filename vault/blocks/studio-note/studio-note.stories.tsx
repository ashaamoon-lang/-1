import type { Meta, StoryObj } from '@storybook/react'

import { StudioNote } from './index'

/**
 * The About / Philosophy section: statement on the left, portrait on the
 * right, stacking on mobile with the text first.
 *
 * The portrait is `null` in every story. `SanityImage` builds its URL through
 * `urlForImage`, and the dataset holds no published assets — a fabricated
 * asset ref would render a broken image and prove less than nothing. What
 * these stories do exercise is the layout: the 7/5 split, the 65ch measure on
 * the prose, and the fact that the section reads correctly with no image at
 * all, which is its state today on the live site.
 */
const meta = {
  title: 'Blocks/StudioNote',
  component: StudioNote,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof StudioNote>

export default meta

type Story = StoryObj<typeof meta>

const statement = (
  <>
    <p className="p-big">
      Arth works to commission. Every piece starts from a conversation about the
      room it will live in — its light, its scale, what it is already doing —
      and not from a catalogue of available styles.
    </p>
    <p className="p-big">
      The work runs from a two-week architecture review to a build carried for
      several months. The scope and the estimate are agreed before anything
      starts rather than after, and what is delivered is measured against them.
    </p>
  </>
)

export const Default: Story = {
  args: {
    id: 'studio',
    eyebrow: 'Studio',
    title: 'How the work is made',
    children: statement,
  },
}

/** Indonesian, to check the measure holds with longer average word length. */
export const Indonesian: Story = {
  args: {
    id: 'studio',
    eyebrow: 'Studio',
    title: 'Bagaimana karyanya dikerjakan',
    children: (
      <p className="p-big">
        Arth bekerja berdasarkan pesanan. Setiap karya dimulai dari percakapan
        tentang ruang yang akan menampungnya — cahayanya, ukurannya, apa yang
        sudah dilakukannya — bukan dari katalog gaya yang tersedia.
      </p>
    ),
  },
}

/** One paragraph is a legitimate statement, not a state to pad out. */
export const SingleParagraph: Story = {
  args: {
    id: 'studio',
    eyebrow: 'Studio',
    title: 'Studio',
    children: <p className="p-big">Commissions, by conversation.</p>,
  },
}

/**
 * Nothing here animates: this is a Server Component with no reveal, because a
 * paragraph of prose does not need to fade in to be taken seriously. The story
 * exists to make that claim checkable rather than assumed.
 */
export const ReducedMotion: Story = {
  args: {
    id: 'studio',
    eyebrow: 'Reduced motion',
    title: 'Identical: this section declares no transition',
    children: statement,
  },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
