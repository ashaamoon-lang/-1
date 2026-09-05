import type { Meta, StoryObj } from '@storybook/react'

import { Icon } from './index'
import { arrowLeft } from './paths/arrow-left'
import { arrowRight } from './paths/arrow-right'
import { caretRight } from './paths/caret-right'
import { close } from './paths/close'
import { search } from './paths/search'
import { zoomIn } from './paths/zoom-in'
import { zoomOut } from './paths/zoom-out'

const meta = {
  title: 'Vault/Primitives/Icon',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          'Phosphor Icons (MIT, Copyright (c) 2023 Phosphor Icons), path data ' +
          'copied rather than installed so no icon library reaches the routes ' +
          '`e2e/route-budget.e2e.ts` allows no JavaScript on — and split one ' +
          'glyph per module so a route downloads only the glyphs it draws. ' +
          'Every glyph here names an action something in the interface ' +
          'performs; there are no decorative icons and no set to grow into.',
      },
    },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

/** At `1em`, so the icon is the size of the text it sits with. */
export const InText: Story = {
  args: { path: caretRight },
  render: (args) => (
    <p style={{ display: 'flex', alignItems: 'center', gap: '0.5ch' }}>
      Work <Icon {...args} /> Arus Balik
    </p>
  ),
}

/** The whole set, which is deliberately this short. */
export const Every: Story = {
  args: { path: search },
  render: () => (
    <ul
      style={{
        display: 'flex',
        gap: '2rem',
        listStyle: 'none',
        padding: 0,
        fontSize: '2rem',
      }}
    >
      {(
        [
          ['caret-right', caretRight],
          ['arrow-left', arrowLeft],
          ['arrow-right', arrowRight],
          ['search', search],
          ['zoom-in', zoomIn],
          ['zoom-out', zoomOut],
          ['close', close],
        ] as const
      ).map(([label, path]) => (
        <li key={label} style={{ textAlign: 'center' }}>
          <Icon path={path} />
          <small style={{ fontSize: '0.5rem' }}>{label}</small>
        </li>
      ))}
    </ul>
  ),
}

/**
 * The one case that gets a name: an icon that is the entire content of a
 * control with no label of its own. Everywhere else the control is labelled
 * and the glyph stays `aria-hidden`, so a screen reader announces it once.
 */
export const Named: Story = {
  args: { path: close, title: 'Close' },
}
