import type { Meta, StoryObj } from '@storybook/react'

import { ReadingProgress } from './index'

/**
 * The bar is `position: fixed` and driven by the *document's* scroll, so a
 * story that renders it alone shows a hairline pinned to the top of the
 * preview frame with nothing to report on.
 *
 * This gives it a page's worth of text to sit above. Scroll the docs page and
 * the line fills — which is the only state worth documenting, because the
 * component has exactly one.
 */
function Reading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        maxWidth: '46ch',
        paddingBlock: '2rem',
        color: 'var(--color-secondary)',
      }}
    >
      {Array.from({ length: 12 }, (_, index) => (
        <p key={index}>
          A commission begins as a conversation about a room, a wall, a surface,
          and the light that falls on it. What follows is drawing, then
          material, then the slow part nobody photographs.
        </p>
      ))}
    </div>
  )
}

const meta = {
  title: 'Vault/Motion/ReadingProgress',
  component: ReadingProgress,
  parameters: {
    docs: {
      description: {
        component:
          'A hairline under the header reporting how far through a long page the reader is. CSS `animation-timeline: scroll()` where the browser has it, a ScrollTrigger on the shared loop where it does not, and nothing at all under `prefers-reduced-motion`.',
      },
    },
  },
  render: () => (
    <>
      <ReadingProgress />
      <Reading />
    </>
  ),
} satisfies Meta<typeof ReadingProgress>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
