import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'

import { useParallax } from './index'

/**
 * A picture that drifts against the page as it passes.
 *
 * ## Why a hook has a story at all
 *
 * `useParallax` renders nothing, so there is no component to put in a
 * catalogue — but the thing worth documenting is not markup, it is **how far
 * it moves and what it is allowed to move**. Both are judgements, and both
 * were previously only readable in the source. `vault/motion/reveal` set the
 * precedent: a small demo is the honest way to show a motion primitive.
 *
 * ## The two rules that are not preferences
 *
 * **Attach it to media, never to a text block.** The travel is a fraction of
 * the element's own height, so on a paragraph it shifts the words against
 * their own heading and reads as a layout bug rather than as depth.
 *
 * **Travel is anchored on the midpoint**, `+distance/2` to `-distance/2`,
 * rather than `0 → -distance`. That is what keeps a plate aligned with its
 * caption at the moment the reader is actually looking at it; the naive range
 * leaves every plate offset from its caption for most of its pass.
 *
 * Under `prefers-reduced-motion` the hook creates no ScrollTrigger at all and
 * the media sits exactly where the layout put it — `CLAUDE.md` #5, and visible
 * by switching the toolbar rather than by reading this sentence.
 */

interface DemoProps {
  distance?: number
  smoothing?: number
}

function ParallaxDemo({ distance, smoothing }: DemoProps) {
  const media = useRef<HTMLDivElement>(null)
  useParallax(media, {
    ...(distance !== undefined && { distance }),
    ...(smoothing !== undefined && { smoothing }),
  })

  return (
    <>
      <div style={{ minHeight: '80vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll. The plate drifts against the page.</p>
      </div>

      {/* `overflow: hidden` on the frame is what makes the drift read as depth
          rather than as an element sliding around loose on the page. */}
      <div style={{ overflow: 'hidden', aspectRatio: '3 / 2' }}>
        <div
          ref={media}
          style={{
            blockSize: '120%',
            background:
              'linear-gradient(160deg, var(--surface-2), var(--surface))',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <p className="caption">the media box</p>
        </div>
      </div>

      <div style={{ minHeight: '80vh' }} />
    </>
  )
}

const meta = {
  title: 'Vault/Motion/Parallax',
  component: ParallaxDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '`useParallax(ref, { distance, smoothing })`. The media box is deliberately taller than its frame — without that overhead the travel exposes the page behind it at one end of the pass.',
      },
    },
  },
} satisfies Meta<typeof ParallaxDemo>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The defaults: `distance: 6`, `smoothing: 0.5`.
 *
 * Six is the quiet end of the preset's 5–15 range, and that is a house
 * decision rather than the preset's — `DESIGN-SYSTEM.md` opens by saying the
 * measured difference between a competent site and an award one is restraint
 * applied consistently.
 */
export const Default: Story = {}

/**
 * The top of the preset's range, so the choice above is visible as a choice.
 *
 * Nothing on the site uses this. It is here because "we picked the quiet end"
 * means nothing in a catalogue that only ever shows the quiet end.
 */
export const FarTravel: Story = {
  args: { distance: 15 },
}

/**
 * No smoothing — the transform follows the scroll position exactly.
 *
 * This is the trackpad jitter `smoothing` exists to remove. Worth being able
 * to see: the default is not a stylistic softening, it is the difference
 * between a drift and a twitch.
 */
export const Unsmoothed: Story = {
  args: { smoothing: 0 },
}
