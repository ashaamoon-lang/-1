import type { Meta, StoryObj } from '@storybook/react'

import { Breadcrumbs } from './index'

const meta = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumbs>

export default meta

type Story = StoryObj<typeof meta>

const SITE = 'https://arth.example'

export const Default: Story = {
  args: {
    label: 'Breadcrumb',
    trail: [
      { href: '/', label: 'Home', url: `${SITE}/en` },
      { href: '/work', label: 'Work', url: `${SITE}/en/work` },
      { label: 'Arus Balik', url: `${SITE}/en/work/arus-balik` },
    ],
  },
}

/**
 * The last crumb is text, not a link, and carries `aria-current="page"`. A
 * link to the page you are already on is a control that does nothing.
 */
export const InIndonesian: Story = {
  args: {
    label: 'Remah roti',
    trail: [
      { href: '/', label: 'Beranda', url: `${SITE}/id` },
      { href: '/journal', label: 'Jurnal', url: `${SITE}/id/journal` },
      {
        label: 'Lingkup adalah hasilnya',
        url: `${SITE}/id/journal/scope-is-the-deliverable`,
      },
    ],
  },
}

/**
 * A trail of one is not a trail: the component renders `null` rather than a
 * single crumb that says only where you already are. Nothing appears below.
 */
export const TooShortToRender: Story = {
  args: {
    label: 'Breadcrumb',
    trail: [{ href: '/', label: 'Home', url: `${SITE}/en` }],
  },
}

/**
 * Under reduced motion the hover treatment loses its transform and its
 * transition; the colour change from tokens stays, so the control still
 * answers a pointer. Toggle the story's reduced-motion preference to check.
 */
export const ReducedMotion: Story = {
  args: {
    label: 'Breadcrumb',
    trail: [
      { href: '/', label: 'Home', url: `${SITE}/en` },
      { href: '/work', label: 'Work', url: `${SITE}/en/work` },
      { label: 'Takar', url: `${SITE}/en/work/takar` },
    ],
  },
  parameters: { reducedMotion: 'reduce' },
}
