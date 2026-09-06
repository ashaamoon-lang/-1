import type { Meta, StoryObj } from '@storybook/react'

import { Reveal } from './index'

/**
 * The site's standard entrance: an IntersectionObserver flips `data-reveal` on
 * the container, and CSS staggers the `[data-reveal-item]` children.
 *
 * ## Why it is CSS and not a tween
 *
 * The transition runs on the compositor, off the main thread and unaffected by
 * React hydration — the same argument `vault/blocks/project-grid` makes at
 * length. With JavaScript disabled the attribute never appears, the hidden
 * state never applies, and the content renders visible, which is the
 * behaviour `CLAUDE.md` #5 requires.
 *
 * The story sits below a screen of empty space so the reveal happens *on scroll*,
 * where it can actually be seen, rather than firing before the docs page has
 * settled.
 */
const meta = {
  title: 'Vault/Motion/Reveal',
  component: Reveal,
  parameters: {
    docs: {
      description: {
        component:
          'Container-level scroll entrance. `rootMargin` has a −25% bottom inset by default, which mirrors a ScrollTrigger `start: "top 75%"` — the block opens once it is a quarter of the way up the screen.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Reveal {...args}>
        <p data-reveal-item className="caption">
          Practice
        </p>
        <h2 data-reveal-item className="h2">
          Three ways of working
        </h2>
        <p data-reveal-item style={{ maxWidth: '46ch' }}>
          Each child carries `data-reveal-item` and inherits its own delay from
          `--reveal-index`, so the block arrives as a sequence rather than as
          one fade.
        </p>
      </Reveal>
      <div style={{ minHeight: '40vh' }} />
    </>
  ),
  args: {
    as: 'section',
    // `render` above supplies the real children; this only satisfies the
    // required prop so a story can override `data-epic` on its own.
    children: null,
  },
} satisfies Meta<typeof Reveal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * The same block naming one of the page's choreographed moments.
 *
 * The prop is declared rather than spread, and Tahap 52 found out why the hard
 * way: this component spreads nothing, so an attribute passed without a prop
 * for it vanishes silently — and `MOTION-SPEC.md` §9.5's budget gate then
 * measures correct markup as missing. Three routes were in that state.
 */
export const Named: Story = {
  args: {
    'data-epic': 'journal-index',
  },
}
