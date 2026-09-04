import type { Meta, StoryObj } from '@storybook/react'
import { NextIntlClientProvider } from 'next-intl'

import type { SearchEntry } from '@/lib/content/search-index'

import { CommandPalette } from './palette'

/**
 * The search palette, over a fixed index.
 *
 * ## Why this story exists, having been declined twice
 *
 * Tahap 28 and 29 both recorded "no Storybook story" with the same reason:
 * the palette fetches its index from a route and reads next-intl's locale, so
 * a story would have to stub both and would then be showing a mock.
 *
 * Half of that was true and half was laziness.
 * `components/ui/language-switcher` has had a story with
 * `NextIntlClientProvider` since it shipped, so the locale half was already
 * solved here. The index half was fixed by changing the component rather than
 * by faking the network: `entries` is a prop, and when it is given the
 * component renders it instead of fetching. Nothing here is a mock of the
 * palette — it is the palette, over entries that hold still.
 *
 * ## What it is worth beyond a catalogue
 *
 * `e2e/storybook-a11y.e2e.ts` audits every story, so these add an axe pass on
 * an open palette in isolation from any page — including its two states that
 * a page-level gate can only reach by breaking the network.
 */

/*
 * The `search` namespace, written out rather than imported from
 * `messages/en.json`, for the reason `language-switcher.stories.tsx` records:
 * the JSON is typed through `messages/en.d.json.ts`, which needs
 * `allowArbitraryExtensions`, and turning that on for one story would loosen
 * module resolution repo-wide.
 */
const messages = {
  search: {
    open: 'Search',
    shortcut: '⌘K',
    label: 'Search the site',
    placeholder: 'Search work, practices and writing',
    empty: 'Nothing matches that.',
    emptyHint: 'Try a client name, a year, or a practice.',
    loading: 'Building the index…',
    failed:
      'Search is unavailable right now. Every page is still reachable from the header and the footer.',
    hint: 'Enter to open, Escape to close.',
    close: 'Close search',
    groups: {
      page: 'Pages',
      practice: 'Practices',
      project: 'Work',
      journal: 'Journal',
    },
  },
}

/*
 * A slice of the **real** index, copied from what `/en/search.json` serves —
 * not written to look like one.
 *
 * The first draft of this file invented a client name for a real project, and
 * that is the line this project does not cross: `lib/content/home-fallback.ts`
 * records the reasoning, and a Storybook story is a browsable catalogue, not a
 * private test double. One of each kind, so every group heading and every rail
 * variant — a path, a client and year, a date — is on screen at once.
 */
const entries: SearchEntry[] = [
  {
    id: 'page:/work',
    kind: 'page',
    label: 'Work',
    description:
      'The full catalogue of completed engagements, with client, year, engagement and scope for each.',
    href: '/en/work',
    meta: '/work',
  },
  {
    id: 'page:/studio',
    kind: 'page',
    label: 'Studio',
    description:
      'How the studio scopes, decides and delivers, the practices it covers, and the colophon for this site.',
    href: '/en/studio',
    meta: '/studio',
  },
  {
    id: 'page:/practice/consulting',
    kind: 'practice',
    label: 'Consulting',
    description:
      'Consulting engagements — strategy, architecture and the decisions that come before a build.',
    href: '/en/practice/consulting',
    meta: '/practice/consulting',
  },
  {
    id: 'project:arus-balik',
    kind: 'project',
    label: 'Arus Balik',
    description: 'Architecture review, six weeks',
    href: '/en/work/arus-balik',
    meta: 'Rumah Tanjung · 2025',
  },
  {
    id: 'journal:scope-is-the-deliverable',
    kind: 'journal',
    label: 'Scope is the deliverable',
    description:
      'The week spent deciding what a piece of work is not is the week that decides whether it ships.',
    href: '/en/journal/scope-is-the-deliverable',
    meta: 'February 11, 2026',
  },
]

const meta = {
  title: 'UI/CommandPalette',
  component: CommandPalette,
  parameters: {
    layout: 'fullscreen',
    // The rows render as anchors and navigate through Next's router, which
    // needs the App Router mock rather than the Pages one.
    nextjs: { appDirectory: true },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
    entries,
  },
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
} satisfies Meta<typeof CommandPalette>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The resting state: every group, and all three kinds of rail — a path, a
 * client and year, a date.
 */
export const Default: Story = {}

/**
 * The dead end, which is the one state that has to offer a way out. A bare
 * "no results" is a wall; this names things the index actually holds, so
 * following the suggestion works.
 */
export const NoResults: Story = {
  args: { entries: [] },
}
