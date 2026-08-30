import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { PageTransition } from './index'

/**
 * The overlay runs on a pathname change, and Storybook has no router
 * navigation to trigger one. Each story therefore remounts the component with
 * a key, which replays the same cover → reveal timeline the route change
 * produces — press the button and watch it wipe.
 *
 * What the stories are actually for: confirming the overlay is decoration
 * (`aria-hidden`, no pointer events, no focus trap), that the budget stays
 * inside `MOTION-SPEC.md` §7's 0.8–1.2s, and that under reduced motion it is
 * not rendered at all rather than rendered instantly.
 */
const meta = {
  title: 'Motion/PageTransition',
  component: PageTransition,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof PageTransition>

export default meta

type Story = StoryObj<typeof meta>

function Replayer({ total }: { total?: number | undefined }) {
  const [run, setRun] = useState(0)

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        gap: 16,
      }}
    >
      <PageTransition key={run} {...(total !== undefined && { total })} />
      <p className="p-big" style={{ margin: 0, textAlign: 'center' }}>
        Content underneath. The overlay covers it, then leaves.
      </p>
      <button
        type="button"
        className="cta"
        onClick={() => setRun((n) => n + 1)}
        style={{
          border: '1px solid var(--color-secondary)',
          padding: '10px 20px',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Replay transition
      </button>
    </div>
  )
}

/** The default budget: 1s, the confident end of the 0.8–1.2s range. */
export const Default: Story = {
  render: () => <Replayer />,
}

/** The fast end of the permitted range. */
export const Fast: Story = {
  render: () => <Replayer total={0.8} />,
}

/**
 * Under `prefers-reduced-motion` the component returns `null` — there is no
 * overlay to see, and nothing is left mid-animation. Set the OS preference to
 * verify: the button still replays, and nothing wipes.
 */
export const ReducedMotion: Story = {
  render: () => <Replayer />,
  parameters: { chromatic: { prefersReducedMotion: 'reduce' } },
}
