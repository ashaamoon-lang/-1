import type { Meta, StoryObj } from '@storybook/react'

import { PracticeList } from './index'

/**
 * The home page's three practices, each a `<details>` that opens in place.
 *
 * The disclosure is the point: `MOTION-SPEC.md` treats a control as a
 * pressable noun, and this one answers by changing the page under the reader
 * rather than by navigating away from it.
 */
const meta = {
  title: 'Vault/Blocks/PracticeList',
  component: PracticeList,
  parameters: {
    docs: {
      description: {
        component:
          'The practices, disclosed in place. Each row links onward to the catalogue filtered to that practice — `/work?practice=<value>`, which `app/[locale]/work/hrefs.ts` keeps deliberately distinct from the practice page itself.',
      },
    },
  },
  args: {
    id: 'practice',
    eyebrow: 'Practice',
    title: 'Three ways of working',
    linkLabel: 'See the work',
    entries: [
      {
        value: 'commission',
        label: 'Commission',
        intro:
          'Work made for one room and one client: a wall, a surface, and the light that falls on it.',
      },
      {
        value: 'consulting',
        label: 'Consulting',
        intro:
          'Strategy, architecture and the decisions that come before a build.',
      },
      {
        value: 'ai-data',
        label: 'AI & Data',
        intro:
          'Systems that read a collection: catalogues, provenance, and the questions a studio asks of its own archive.',
      },
    ],
  },
} satisfies Meta<typeof PracticeList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * One practice. The list is a list at any length, and a single row must not
 * read as a broken three.
 */
export const Single: Story = {
  args: {
    entries: [
      {
        value: 'commission',
        label: 'Commission',
        intro:
          'Work made for one room and one client: a wall, a surface, and the light that falls on it.',
      },
    ],
  },
}
