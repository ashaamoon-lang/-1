import type { Meta, StoryObj } from '@storybook/react'

import { GridPattern } from './index'

/**
 * A ground layer has no size of its own — it fills whatever it is placed in.
 * Every story therefore supplies a relatively-positioned box, and that box is
 * the story as much as the component is.
 */
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
  title: 'Vault/Magic/GridPattern',
  component: GridPattern,
  parameters: {
    docs: {
      description: {
        component:
          'The studio grid made visible. Two line segments in one `<pattern>` ' +
          'tile into an arbitrarily large grid, which is the reason this ' +
          'technique was taken from Magic UI rather than the sibling ' +
          '`dot-pattern`, whose implementation renders one element per cell. ' +
          'Strokes come from `--line`, the derived hairline token, so the ' +
          'pattern is theme-aware and already contrast-measured.',
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
} satisfies Meta<typeof GridPattern>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

/**
 * The state the site actually uses it in: fine enough to read as a surface
 * rather than as a table.
 */
export const Fine: Story = {
  args: { width: 24, height: 24 },
}

/**
 * `squares` is what lets the ground say something — `arth-passage` lights the
 * cells a work is about to land in. It stays decoration: the work is in the
 * DOM either way.
 */
export const LitCells: Story = {
  args: {
    width: 48,
    height: 48,
    squares: [
      [1, 1],
      [2, 3],
      [4, 2],
      [5, 4],
    ],
  },
}

/** A dashed tile, for a ground that should read as provisional. */
export const Dashed: Story = {
  args: { width: 40, height: 40, strokeDasharray: '4 4' },
}
