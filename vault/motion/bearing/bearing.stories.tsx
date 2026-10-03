import type { Meta, StoryObj } from '@storybook/react'

import { Bearing } from './index'

/**
 * The frame stands, then the load settles onto it.
 *
 * Three bays in a row: each is a post and a beam (`data-bearing="span
 * post"`), and each carries one load (`data-reveal-item
 * data-bearing="load"`), pressable so it takes the press grammar's
 * compression. The labels name the parts, not anything the studio made —
 * this shows the motion, not content.
 *
 * Like `Reveal`'s story, it sits below a screen of empty space so the motion
 * happens on scroll, where it can be seen.
 */
const meta = {
  title: 'Vault/Motion/Bearing',
  component: Bearing,
  parameters: {
    docs: {
      description: {
        component:
          'Posts rise and beams span; then each load lands, takes the weight in the press grammar’s compression, and settles without passing rest. Reduced motion and no script both show the finished frame.',
      },
    },
  },
  render: (args) => (
    <>
      <div style={{ minHeight: '90vh', display: 'grid', alignContent: 'end' }}>
        <p className="caption">Scroll down.</p>
      </div>
      <Bearing {...args}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          }}
        >
          {['Bay one', 'Bay two', 'Bay three'].map((label) => (
            <div
              key={label}
              data-bearing="span post"
              style={{
                display: 'grid',
                alignContent: 'end',
                minHeight: '8rem',
              }}
            >
              {/*
                A pressable load, because the compression is the press
                grammar's own `--press-scale` (`index.tsx`).
              */}
              <button
                type="button"
                data-reveal-item
                data-bearing="load"
                data-press="chip"
                className="caption"
                style={{ display: 'block' }}
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      </Bearing>
    </>
  ),
} satisfies Meta<typeof Bearing>

export default meta

type Story = StoryObj<typeof meta>

export const Frame: Story = {
  args: { children: null },
}
