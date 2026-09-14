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

/**
 * A block that is already on the first screen when the page loads.
 *
 * The default `rootMargin` insets the observer's root by −25% at the bottom, so
 * a block opens once it is a quarter of the way up the screen. That is right
 * for everything a reader scrolls to, and wrong for anything sitting in the
 * lower quarter of the *first* screen: the trigger line is above it, the scroll
 * that would cross it never happens, and the block holds `opacity: 0` on a
 * screen the reader is looking at.
 *
 * Measured on `/studio` in Tahap 69, moving the capability band into the foot
 * of a hero that holds `100svh`: band top **764** against a line at **675** of
 * a 900px viewport, still `opacity: 0` six seconds after load. `CLAUDE.md` #5
 * calls stranded content a defect, and no one had written a bug to cause it.
 *
 * This story exists because the argument a block is designed around belongs in
 * the catalogue — Tahap 67 shipped a hero whose own story omitted the prop that
 * composed it, and documented the block wrong for fifty-five stages.
 */
export const OnFirstScreen: Story = {
  args: {
    rootMargin: '0px',
  },
}
