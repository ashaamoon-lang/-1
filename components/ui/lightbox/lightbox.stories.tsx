import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'

import { Lightbox, type LightboxImage } from './index'

/**
 * The full-screen viewer a gallery plate opens into.
 *
 * ## What this story documents, and what it cannot
 *
 * The stage is deliberately empty. `SanityImage` returns `null` without a live
 * asset reference, and the catalogue has none — the same reason
 * `vault/blocks/project-gallery`'s stories pass `null` covers and say so:
 * *"what these stories show is the width rhythm rather than the pictures."*
 *
 * So this documents the part that is actually the hard part, and the part that
 * has no pictures in it either way: **the dialog, the focus contract, the
 * keyboard, and the zoom control.** Those are the reasons this component is
 * forty lines of pan maths and a Base UI dialog instead of an `<img>` in a
 * `<div>`.
 *
 * ## The focus contract, which is the thing to check
 *
 * Focus enters on open and returns to **the image that was clicked**, not to
 * the first one — the gallery passes the trigger in as `finalFocus`. The
 * wrapper below keeps a real ref to the button it renders, so opening and
 * closing here exercises the same path the site does rather than a stub.
 *
 * Arrow keys move between works, Escape closes, and the zoom control carries a
 * spoken name and `aria-pressed`. The counter is `aria-hidden` on purpose: the
 * dialog is labelled with the same position in words, and hearing both is
 * duplication.
 *
 * `e2e/lightbox.e2e.ts` holds all of it against the real route;
 * `storybook-a11y.e2e.ts` runs axe over this story as it stands.
 */

const images = (count: number): LightboxImage[] =>
  Array.from({ length: count }, (_, index) => ({
    _key: `image-${index}`,
    alt: `Detail ${index + 1} of ${count}`,
  }))

interface DemoProps {
  count: number
  startAt: number
}

function LightboxDemo({ count, startAt }: DemoProps) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(startAt)
  // A real trigger, so `finalFocus` returns focus to something that exists —
  // which is the whole assertion this component's accessibility rests on.
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="cta"
        onClick={() => setOpen(true)}
      >
        Open the viewer
      </button>

      <Lightbox
        images={images(count)}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
        finalFocus={trigger}
      />
    </>
  )
}

const meta = {
  title: 'UI/Lightbox',
  component: LightboxDemo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Controlled: the gallery owns `index` and `open` so the position survives a close and reopen. The stage is empty here because the catalogue has no Sanity assets — the dialog, focus return, keyboard and zoom are what this documents.',
      },
    },
  },
  args: { count: 4, startAt: 0 },
} satisfies Meta<typeof LightboxDemo>

export default meta

type Story = StoryObj<typeof meta>

/** Four works, opening on the first. */
export const Default: Story = {}

/**
 * Opening part-way through, which is the normal case.
 *
 * A reader clicks the third plate, not the first, and the index the gallery
 * hands over is what decides where the viewer opens. Worth a story of its own:
 * "opens at 0" is the one case that hides an off-by-one.
 */
export const OpensPartWay: Story = {
  args: { count: 5, startAt: 2 },
}

/**
 * A single work.
 *
 * There is nowhere to go, and the navigation has to say so rather than wrap
 * around to itself or leave dead controls on screen.
 */
export const Single: Story = {
  args: { count: 1, startAt: 0 },
}
