import type { Meta, StoryObj } from '@storybook/react'

import { Horizontal } from './index'

import s from './horizontal.module.css'

/**
 * A plate, so the run has something with width to carry.
 *
 * Deliberately plain: what this story is for is the *geometry* — that the
 * track is wider than its box and that each item keeps its declared width
 * rather than being squeezed to fit. Putting real cards in would make the
 * story about the cards.
 */
function Plate({ index }: { index: number }) {
  return (
    <li className={s.item} data-run-item="">
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          aspectRatio: '4 / 3',
          background:
            'linear-gradient(135deg, var(--color-secondary), var(--surface-2))',
          color: 'var(--color-primary)',
        }}
      >
        {/* A focusable child, because the keyboard path is half the contract. */}
        <button type="button">{String(index + 1).padStart(2, '0')}</button>
      </div>
    </li>
  )
}

const meta = {
  title: 'Vault/Motion/Horizontal',
  component: Horizontal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'A run that travels sideways while the page scrolls down.',
          '',
          'The pin and the scrub need a real scroll container, which a story',
          'frame does not have — so what this shows is the **resting**',
          'geometry: a track wider than its viewport, each item at its own',
          'width, clipped rather than scrollable.',
          '',
          'Two things are worth checking here rather than in the app, because',
          'they are properties of the component and not of the page:',
          '',
          '- **Tab through the items.** The viewport is `overflow: clip`, so',
          '  the browser has no scrollable ancestor to move. In the app,',
          '  `focusin` converts the focused item into a page scroll position',
          '  instead; here there is no pin, so focus simply stays put.',
          '- **Toggle reduced motion.** The track stops being a track and',
          '  becomes a wrapping row with every item visible — the promise the',
          '  script cannot make, so the stylesheet makes it.',
        ].join('\n'),
      },
    },
  },
} satisfies Meta<typeof Horizontal>

export default meta
type Story = StoryObj<typeof meta>

export const Resting: Story = {
  args: {
    name: 'story-run',
    label: 'A run of six plates',
    children: Array.from({ length: 6 }, (_, index) => (
      <Plate key={index} index={index} />
    )),
  },
}

/**
 * Two items — shorter than the viewport, so there is nothing to travel.
 *
 * `travel()` clamps at zero and the component creates a pin that never moves
 * rather than a negative one. A run with less content than screen is a run
 * that should simply sit there.
 */
export const NothingToTravel: Story = {
  args: {
    name: 'story-run-short',
    label: 'A run of two plates',
    children: Array.from({ length: 2 }, (_, index) => (
      <Plate key={index} index={index} />
    )),
  },
}
