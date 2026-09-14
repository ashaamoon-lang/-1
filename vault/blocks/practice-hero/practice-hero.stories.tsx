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

/**
 * The nameplate with the column its measure leaves free — Tahap 75.
 *
 * Without the index this block gave its subject **600px of a 1440px first
 * screen** and left 824px bare beside it: 42% of the width used, against
 * 95–97% on every other route. The `max-width: 60ch` behind that is right
 * about the nameplate and was silent about the rest of the screen.
 *
 * The story exists because the prop that composes a block belongs in its
 * catalogue entry. Tahap 67 shipped a hero whose own story omitted exactly
 * that, and documented the block wrong for fifty-five stages.
 *
 * Plain text here rather than links: the route supplies `<Link>` nodes, and a
 * catalogue that routes nowhere would document a navigation it cannot perform.
 */
export const WithIndex: Story = {
  args: {
    index: {
      label: 'Related practice',
      items: [
        { key: 'ai-data', node: 'AI & Data' },
        { key: 'consulting', node: 'Consulting' },
      ],
    },
  },
}
