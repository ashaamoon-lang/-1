import type { Meta, StoryObj } from '@storybook/react'

import { NoiseTexture } from './index'

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '320px',
        background: 'var(--color-primary)',
        color: 'var(--color-secondary)',
      }}
    >
      {children}
    </div>
  )
}

const meta = {
  title: 'Vault/Magic/NoiseTexture',
  component: NoiseTexture,
  parameters: {
    docs: {
      description: {
        component:
          'Grain, so a flat ground reads as a surface. Three filter passes in ' +
          'order — fractal turbulence, desaturate to grey, then a linear ' +
          'slope per channel — and the third is what stops it reading as ' +
          'television static. It is deliberately the only texture in the ' +
          'system: a second one would make this decoration rather than a ' +
          'material. Toggle the Storybook theme to see both weights.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Field>
        <Story />
      </Field>
    ),
  ],
} satisfies Meta<typeof NoiseTexture>

export default meta
type Story = StoryObj<typeof meta>

/** The shipped defaults, and the only values any page should need. */
export const Default: Story = {
  args: {},
}

/**
 * Coarser. Included as the boundary rather than as an option: below about
 * 0.2 the grain stops being grain and starts being a pattern, which is the
 * failure this component exists to avoid.
 */
export const Coarse: Story = {
  args: { frequency: 0.15 },
}

/** Higher slope — the grain at the point where it becomes visible as noise. */
export const Strong: Story = {
  args: { slope: 0.4 },
}
