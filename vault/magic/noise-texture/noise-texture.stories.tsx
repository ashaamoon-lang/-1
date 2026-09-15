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
          'Grain, so a flat ground reads as a surface. Five filter passes: ' +
          'fractal turbulence, desaturate to grey, a linear slope per ' +
          'channel, an alpha pinned to 1, and an arithmetic composite that ' +
          'adds the grain to the ground colour and subtracts its own mean ' +
          'back out. That last pair is what makes it grain rather than a ' +
          "wash — the layer has the ground's mean at any opacity, so " +
          'opacity is a texture strength and cannot tint the page. ' +
          'It is deliberately the only texture in the system: a second one ' +
          'would make this decoration rather than a material. Toggle the ' +
          'Storybook theme to see both weights.',
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

/**
 * The shipped defaults, and the only values any page should need.
 *
 * It is *supposed* to be quiet here. The layer's mean is the ground it sits
 * on, so at the shipped strength the ground's colour is unchanged and only
 * its surface differs — measured at a standard deviation of 1.6 (dark) to
 * 2.4 (light) of 255. `Strong` below is the same component with the
 * amplitude turned up far enough to photograph.
 */
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

/**
 * Higher slope — the grain at the point where it becomes visible as noise.
 *
 * Note what does *not* happen at this amplitude: the field stays the same
 * colour. `slope` widens the excursions and the composite subtracts half of
 * it back, so a louder grain is louder, not lighter. Before Tahap 55 this
 * story rendered a visibly grey panel, and that greyness was the defect.
 */
export const Strong: Story = {
  args: { slope: 0.4 },
}
