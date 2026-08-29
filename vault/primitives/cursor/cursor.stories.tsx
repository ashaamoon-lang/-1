import type { Meta, StoryObj } from '@storybook/react'

import { Link } from '@/components/ui/link'

import { Cursor } from './index'

const meta = {
  title: 'Vault/Primitives/Cursor',
  component: Cursor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Additive custom cursor. The native cursor is never hidden — this ' +
          'is a ring drawn on top, so a script failure degrades to the normal ' +
          'pointer rather than to no cursor at all.\n\n' +
          'Elements opt into states with `data-cursor="link" | "view" | "hidden"`. ' +
          'Renders nothing on coarse pointers. Under prefers-reduced-motion the ' +
          'cursor still tracks the pointer, but without follow lag or transitions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Cursor>

export default meta

type Story = StoryObj<typeof meta>

const tile = {
  display: 'grid',
  placeItems: 'center',
  height: 180,
  border: '1px solid currentColor',
  borderRadius: 8,
} as const

export const States: Story = {
  args: {},
  render: (args) => (
    <div style={{ padding: 48, minHeight: '100vh' }}>
      <Cursor {...args} />
      <p style={{ marginBottom: 32, opacity: 0.7 }}>
        Move the pointer across each tile. (No effect on touch devices.)
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div style={tile}>default</div>
        <Link href="#top" data-cursor="link" style={tile}>
          data-cursor=&quot;link&quot;
        </Link>
        <div data-cursor="view" style={tile}>
          data-cursor=&quot;view&quot;
        </div>
        <div data-cursor="hidden" style={tile}>
          data-cursor=&quot;hidden&quot;
        </div>
      </div>
    </div>
  ),
}

/** Custom label for the `view` state. */
export const CustomLabel: Story = {
  args: { viewLabel: 'Open' },
  render: (args) => (
    <div style={{ padding: 48, minHeight: '100vh' }}>
      <Cursor {...args} />
      <div data-cursor="view" style={{ ...tile, height: 320 }}>
        Hover me
      </div>
    </div>
  ),
}
