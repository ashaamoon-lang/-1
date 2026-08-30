import type { Meta, StoryObj } from '@storybook/react'

import { ContactBlock } from './index'

/**
 * One action, and it is the email address — rendered at display scale because
 * it *is* the call to action, not a detail below one.
 *
 * There is no form, deliberately: a contact form adds a field to fill in, a
 * route to maintain, a spam surface, and a message the sender keeps no copy
 * of, in exchange for nothing the reader wanted.
 */
const meta = {
  title: 'Blocks/ContactBlock',
  component: ContactBlock,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ContactBlock>

export default meta

type Story = StoryObj<typeof meta>

const socials = [
  { label: 'Instagram', url: 'https://instagram.com/' },
  { label: 'Are.na', url: 'https://are.na/' },
]

export const Default: Story = {
  args: {
    id: 'contact',
    eyebrow: 'Commissions',
    title: 'Start a conversation',
    email: 'studio@arth.example',
    emailLabel: 'Email Arth',
    socials,
    socialsHeading: 'Elsewhere',
  },
}

/** A studio with no social presence yet: the column disappears, not empties. */
export const NoSocials: Story = {
  args: {
    id: 'contact',
    eyebrow: 'Commissions',
    title: 'Start a conversation',
    email: 'studio@arth.example',
    emailLabel: 'Email Arth',
    socials: [],
    socialsHeading: 'Elsewhere',
  },
}

/**
 * A long address is the layout's real stress case: at display scale it will
 * either wrap or push the page sideways, and `overflow-wrap: anywhere` plus
 * `min-width: 0` is what makes it the former.
 */
export const LongAddress: Story = {
  args: {
    id: 'contact',
    eyebrow: 'Commissions',
    title: 'Start a conversation',
    email: 'commissions.and.enquiries@arth-studio.example',
    emailLabel: 'Email Arth',
    socials,
    socialsHeading: 'Elsewhere',
  },
}

/**
 * The only motion is a fade on hover, removed under the preference. Nothing
 * starts hidden, so nothing can be left invisible.
 */
export const ReducedMotion: Story = {
  args: {
    id: 'contact',
    eyebrow: 'Commissions',
    title: 'Start a conversation',
    email: 'studio@arth.example',
    emailLabel: 'Email Arth',
    socials,
    socialsHeading: 'Elsewhere',
  },
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
