import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { RouteMarker } from './index'

/**
 * The rule under the current item, carried to the one you press.
 *
 * Press a word: the rule slides to it and takes its width, then the word
 * becomes current. Buttons stand in for the header's links so the story never
 * navigates, and the words name places in an index, not anything the studio
 * made.
 */
const WORDS = ['Work', 'Studio', 'Journal'] as const

function Index() {
  const [current, setCurrent] = useState<(typeof WORDS)[number]>('Work')

  return (
    <nav
      aria-label="Index"
      className="caption"
      style={{
        position: 'relative',
        display: 'inline-flex',
        gap: 'calc(var(--gap) * 1.5)',
      }}
    >
      {WORDS.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => setCurrent(word)}
          {...(word === current && { 'aria-current': 'true' as const })}
        >
          {word}
        </button>
      ))}
      <RouteMarker />
    </nav>
  )
}

const meta = {
  title: 'Vault/Motion/RouteMarker',
  component: RouteMarker,
  parameters: {
    docs: {
      description: {
        component:
          'One hairline under the current item of its parent. A press slides it to the pressed item; nothing else moves it. Reduced motion places it at once.',
      },
    },
  },
  render: () => <Index />,
} satisfies Meta<typeof RouteMarker>

export default meta

type Story = StoryObj<typeof meta>

export const Pressed: Story = {}
