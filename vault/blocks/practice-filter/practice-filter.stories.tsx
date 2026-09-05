import type { Meta, StoryObj } from '@storybook/react'

import { PracticeFilter } from './index'

const meta = {
  title: 'Vault/Blocks/PracticeFilter',
  component: PracticeFilter,
  parameters: {
    docs: {
      description: {
        component:
          'The work index’s category chips. Every chip is a real `<a>` to a ' +
          'real URL and the narrowing happens in GROQ on the server, so this ' +
          'ships zero client JavaScript and works with scripting off. Since ' +
          'Tahap 43 each chip also states how much work it narrows to — in ' +
          'the DOM, not only in the custom cursor, which never mounts on a ' +
          'coarse pointer.',
      },
    },
  },
} satisfies Meta<typeof PracticeFilter>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  {
    value: 'consulting',
    label: 'Consulting',
    href: '/work?practice=consulting',
    count: 2,
  },
  {
    value: 'ai-data',
    label: 'AI & Data',
    href: '/work?practice=ai-data',
    count: 2,
  },
  {
    value: 'commission',
    label: 'Commission',
    href: '/work?practice=commission',
    count: 2,
  },
]

/** Nothing narrowed: "All" is current, and its count is the whole catalogue. */
export const All: Story = {
  args: {
    allLabel: 'All',
    allHref: '/work',
    options,
    allCount: 6,
    active: null,
    label: 'Filter work by practice',
  },
}

/**
 * One practice selected. Before Tahap 39 this state could not be reached at
 * all: the chips navigated away and `active` was always `null`, so "All" was
 * permanently current and no chip ever appeared selected.
 */
export const Narrowed: Story = {
  args: { ...All.args, active: 'consulting' },
}

/**
 * Fewer than two options renders nothing. One chip is not a filter, it is a
 * label, and a control that cannot change anything should not be drawn.
 */
export const TooFewToFilter: Story = {
  args: { ...All.args, options: options.slice(0, 1) },
}
