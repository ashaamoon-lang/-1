import type { Meta, StoryObj } from '@storybook/react'

import { DotPattern } from './index'

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
  title: 'Vault/Magic/DotPattern',
  component: DotPattern,
  parameters: {
    docs: {
      description: {
        component:
          'The quieter ground, for reading surfaces. Original work: upstream ' +
          'renders one `<circle>` per dot from JavaScript behind a resize ' +
          'listener — 5,130 SVG nodes at 1440x900 — and imports `motion`, ' +
          'which this project does not have. One `<pattern>` and one circle ' +
          'do the same job on the server with no JavaScript at all.',
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
} satisfies Meta<typeof DotPattern>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

/**
 * Wide spacing, which is what a page of prose wants: present when looked for,
 * invisible while reading.
 */
export const Sparse: Story = {
  args: { width: 32, height: 32, cr: 1 },
}

/**
 * The comparison that matters. Beside `GridPattern`, dots at the same colour
 * read lighter because they cover less area — which is why both exist rather
 * than one with a prop.
 */
export const Dense: Story = {
  args: { width: 12, height: 12, cr: 1 },
}
