import type { Meta, StoryObj } from '@storybook/react'

import { Curtain } from './index'

/**
 * The curtain is `position: fixed` and animates once on mount, so a story
 * that simply renders it shows an empty frame by the time anyone looks.
 *
 * This puts page-shaped content behind it and gives the reader a way to
 * replay the entrance, which is the only state worth documenting.
 */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '420px',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-primary)',
        color: 'var(--color-secondary)',
      }}
    >
      <p className="p-big" style={{ maxWidth: '32ch', textAlign: 'center' }}>
        The page is already rendered and painted underneath. That is the whole
        difference between this and a preloader.
      </p>
      {children}
    </div>
  )
}

const meta = {
  title: 'Vault/Motion/Curtain',
  component: Curtain,
  parameters: {
    docs: {
      description: {
        component:
          'The entrance, once per session. Pure CSS with fixed timing — hold ' +
          '400ms, wordmark out 200ms, panel up 400ms — so it works with ' +
          'JavaScript off and cannot tell the reader the site was slow ' +
          'today. Reload the story frame to replay it; under reduced motion ' +
          'it is never painted.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Stage>
        <Story />
      </Stage>
    ),
  ],
} satisfies Meta<typeof Curtain>

export default meta
type Story = StoryObj<typeof meta>

/** What ships: the studio's own name, and nothing else. */
export const Default: Story = {
  args: { label: 'Arth' },
}

/**
 * A longer wordmark, because the panel centres its label rather than sizing
 * to it — this is the check that a rename does not need a layout change.
 */
export const LongerWordmark: Story = {
  args: { label: 'Arth Studio' },
}
