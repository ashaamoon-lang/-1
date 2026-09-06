import type { Meta, StoryObj } from '@storybook/react'

import { PracticeHero } from './index'

/**
 * The top of a practice's own page: four text elements and nothing else,
 * which is the ceiling `e2e/taste-preflight.e2e.ts` sets for a hero.
 *
 * Its `<h1>` sits inside a `<ViewTransition>` so the practice name on the home
 * page morphs into it. That half needs two pages, so it cannot be shown here —
 * what a story can show is the composition the morph lands in.
 */
const meta = {
  title: 'Vault/Blocks/PracticeHero',
  component: PracticeHero,
  parameters: {
    docs: {
      description: {
        component:
          'The practice page hero. `data-epic="practice-morph"` since Tahap 52 — the moment had been listed in `MOTION-SPEC.md` §9.5 since Tahap 15 and had never been marked in the DOM.',
      },
    },
  },
  args: {
    value: 'commission',
    eyebrow: 'Practice',
    label: 'Commission',
    intro:
      'Work made for one room and one client: a wall, a surface, and the light that falls on it.',
    count: '3 commissions',
  },
} satisfies Meta<typeof PracticeHero>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * A practice with nothing listed under it yet. The count is the only line that
 * changes, and it says so rather than disappearing — a hero that loses an
 * element on an empty branch reads as broken rather than as empty.
 */
export const Empty: Story = {
  args: {
    value: 'ai-data',
    label: 'AI & Data',
    intro:
      'Systems that read a collection: catalogues, provenance, and the questions a studio asks of its own archive.',
    count: 'No work listed yet',
  },
}
