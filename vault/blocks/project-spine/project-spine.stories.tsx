import type { Meta, StoryObj } from '@storybook/react'

import { ProjectSpine } from './index'

/**
 * The project page's index, and the one that reports reading position.
 *
 * `MOTION-SPEC.md` §9.5 excludes it from the epic budget for a stated reason:
 * it responds to scroll *continuously*, with no beginning, band or end. That
 * makes it third-category — and a story is where the shape can be seen
 * without a whole project page around it.
 */
function Region({ id, title }: { id: string; title: string }) {
  return (
    <section
      id={id}
      data-region
      style={{
        minHeight: '70vh',
        display: 'grid',
        alignContent: 'center',
        gap: '0.75rem',
        borderTop: '1px solid var(--line)',
        paddingBlock: '2rem',
      }}
    >
      <h2 className="h2">{title}</h2>
      <p style={{ maxWidth: '46ch' }}>
        Scroll: the row for the region you are in takes the lead, and the others
        stand down. Nothing animates on arrival — the index answers where you
        are, continuously.
      </p>
    </section>
  )
}

const REGIONS = [
  { id: 'brief', label: 'Brief' },
  { id: 'making', label: 'Making' },
  { id: 'gallery', label: 'Gallery' },
] as const

const meta = {
  title: 'Vault/Blocks/ProjectSpine',
  component: ProjectSpine,
  parameters: {
    docs: {
      description: {
        component:
          'A sticky index down the side of a long project page. The caller passes only the regions that actually rendered — it is the only thing that knows whether a gallery exists.',
      },
    },
  },
  args: {
    label: 'On this page',
    regions: REGIONS,
    children: REGIONS.map((region) => (
      <Region key={region.id} id={region.id} title={region.label} />
    )),
  },
} satisfies Meta<typeof ProjectSpine>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
