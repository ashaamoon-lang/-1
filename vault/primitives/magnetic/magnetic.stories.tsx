import type { Meta, StoryObj } from '@storybook/react'

import { Magnetic } from './index'

const meta = {
  title: 'Vault/Primitives/Magnetic',
  component: Magnetic,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Pointer-attracted wrapper. The child drifts toward the cursor ' +
          'within `radius`, then springs back.\n\n' +
          'Adds no semantics — always put a real <button> or <a> inside. ' +
          'Inert under prefers-reduced-motion and on coarse pointers (touch), ' +
          'where the control still works normally.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Magnetic>

export default meta

type Story = StoryObj<typeof meta>

const buttonStyle = {
  padding: '16px 32px',
  border: '1px solid currentColor',
  borderRadius: '999px',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
} as const

/** Default strength (0.3) — a firm, confident pull. */
export const Default: Story = {
  args: { children: null },
  render: () => (
    <div style={{ padding: 120 }}>
      <Magnetic>
        <button type="button" style={buttonStyle}>
          Start a project
        </button>
      </Magnetic>
    </div>
  ),
}

/** Subtle (0.15) — appropriate for nav items, where several sit close together. */
export const Subtle: Story = {
  args: { children: null },
  render: () => (
    <div style={{ padding: 120 }}>
      <Magnetic strength={0.15} radius={48}>
        <button type="button" style={buttonStyle}>
          Work
        </button>
      </Magnetic>
    </div>
  ),
}

/**
 * Deliberately overdone (0.6). Included as a counter-example: the element
 * outruns the cursor and reads as unstable rather than premium. Keep strength
 * at or below ~0.5.
 */
export const TooStrong: Story = {
  args: { children: null },
  render: () => (
    <div style={{ padding: 120 }}>
      <Magnetic strength={0.6} radius={120}>
        <button type="button" style={buttonStyle}>
          Too much
        </button>
      </Magnetic>
    </div>
  ),
}
