import type { Meta, StoryObj } from '@storybook/react'

import { Link } from '@/components/ui/link'

import { SectionHeader } from './index'

const meta = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    eyebrow: 'Karya pilihan',
    title: 'Commissioned work for people who notice',
  },
}

/** The eyebrow is optional — omitted rather than filled with decoration. */
export const WithoutEyebrow: Story = {
  args: { title: 'Studio' },
}

/**
 * The trailing slot carries a count or a link. It drops to its own line when
 * the title runs out of room rather than squeezing the heading.
 */
export const WithAside: Story = {
  args: {
    eyebrow: 'Selected work',
    title: 'Twelve commissions, 2019 – 2025',
    aside: <Link href="/work">See all</Link>,
  },
}

/** Heading level is independent of size: this renders `h3` at `h2` scale. */
export const AsSubheading: Story = {
  args: {
    eyebrow: 'Process',
    title: 'How a commission actually runs',
    as: 'h3',
  },
}

/**
 * Nothing here animates, so reduced motion changes nothing — the component
 * is static by construction rather than by a media query. This story exists
 * to make that claim checkable rather than assumed.
 */
export const ReducedMotion: Story = {
  args: {
    eyebrow: 'Reduced motion',
    title: 'Identical: this component declares no transition',
  },
  parameters: {
    chromatic: { prefersReducedMotion: 'reduce' },
  },
}
