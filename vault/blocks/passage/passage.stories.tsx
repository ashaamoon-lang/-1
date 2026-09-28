import type { Meta, StoryObj } from '@storybook/react'

import { SectionHeader } from '@/components/ui/section-header'

import { Passage } from './index'

const meta = {
  title: 'Vault/Blocks/Passage',
  component: Passage,
  parameters: {
    docs: {
      description: {
        component:
          "The home page's third choreographed moment. What is shown here is " +
          'its **resting state** — the one a reader sees with JavaScript off ' +
          'or reduced motion on — because the choreography is a pinned, ' +
          'scrubbed timeline and a story frame has no page to scroll. That ' +
          'resting state is the point of the story: every tween is a ' +
          '`fromTo`, so nothing is ever stranded invisible, and this is what ' +
          'the block looks like when none of them run.',
      },
    },
  },
} satisfies Meta<typeof Passage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * What the home page passes it: the work section's own header, with its own
 * title and count. No copy was added for the passage — the page has no spare
 * words, and that constraint is what made this a slot rather than a block
 * with props.
 */
export const Default: Story = {
  args: {
    children: <SectionHeader title="Work" aside="Six works" />,
  },
}

/**
 * Indonesian, which is a real locale here rather than a demonstration — and
 * the check that a longer count string does not push the header off its
 * own row.
 */
export const Indonesian: Story = {
  args: {
    children: <SectionHeader title="Karya" aside="Enam karya" />,
  },
}

/**
 * A plate for the reel. The catalogue has no CMS images, so each plate is a
 * lit gradient — the reel is `aria-hidden` and its media decorative, which
 * is what the home page passes too (`alt=""`).
 */
function plate(id: string, title: string, meta: string, hue: number) {
  return {
    id,
    title,
    meta,
    media: (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 30% 20%, oklch(0.78 0.08 ${hue}), oklch(0.3 0.06 ${hue}) 70%)`,
        }}
      />
    ),
  }
}

/**
 * With a reel — what the home page passes since the fork. At rest, which is
 * what a story shows: the first plate in the frame, index `01`, its caption,
 * and the title below. The other plates wait under the frame until the
 * pinned timeline wipes them up.
 */
export const WithReel: Story = {
  args: {
    children: (
      <SectionHeader title="Recent engagements" aside="4 engagements" />
    ),
    plates: [
      plate(
        'fixture-1',
        'Panas Sore',
        'Architecture review, six weeks · 2025',
        55
      ),
      plate('fixture-2', 'Tenun', 'Retainer, six months · 2025', 160),
      plate('fixture-3', 'Arus', 'Evaluation build, ten weeks · 2024', 285),
      plate('fixture-4', 'Takar', 'Data pipeline, fixed scope · 2024', 320),
    ],
  },
}
