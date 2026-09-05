import type { Meta, StoryObj } from '@storybook/react'

import { StepSequence } from './index'

const meta = {
  title: 'Vault/Blocks/StepSequence',
  component: StepSequence,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The studio page’s process, as a scroll-led sequence rather than ' +
          'four stacked cards. The step at the reading line leads and the ' +
          'others recede to `--step-recede`; Tahap 27 set that value with an ' +
          'axe sweep rather than by eye, and Tahap 43 re-swept it for the ' +
          'light theme, where the same number gave 3.8:1. Numbered because ' +
          'the steps genuinely are a sequence — what happens first ' +
          'constrains what is possible next.',
      },
    },
  },
} satisfies Meta<typeof StepSequence>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'How we work',
    steps: [
      {
        key: 'scope',
        title: 'Scope',
        body: 'A week, sometimes two. We read what exists, talk to the people who maintain it, and write down what the engagement is and is not.',
      },
      {
        key: 'read',
        title: 'Read',
        body: 'We map the decisions that are still open and the constraints that are not. Every trade-off gets written where the team can argue with it.',
      },
      {
        key: 'decide',
        title: 'Decide',
        body: 'One recommendation, with the reasoning attached and the alternatives named.',
      },
      {
        key: 'deliver',
        title: 'Deliver',
        body: 'We build the smaller thing, and we leave the reasoning behind where the next team will find it.',
      },
    ],
  },
}

/** Two steps still reads as a sequence; the lead has somewhere to move. */
export const Short: Story = {
  args: { label: 'How we work', steps: Default.args.steps.slice(0, 2) },
}
