import type { Meta, StoryObj } from '@storybook/react'

import { ErrorView } from './index'

/**
 * The error boundary's view, shown by `app/[locale]/error.tsx` and
 * `app/global-error.tsx`.
 *
 * It had no story until Tahap 5, which is why its styling went unnoticed for
 * so long: it was written with Tailwind's default scales (`px-6`, `text-4xl`,
 * `bg-gray-100`), and this project resets those to `initial`. An error page is
 * the one screen nobody looks at until it is already a bad day.
 */
const meta = {
  title: 'UI/ErrorView',
  component: ErrorView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorView>

export default meta

type Story = StoryObj<typeof meta>

const error = Object.assign(new Error('Failed to fetch project'), {
  digest: '3921884471',
})

/** Storybook has no error boundary to reset, so retrying just logs. */
const reset = () => {
  console.info('ErrorView reset() called')
}

export const Default: Story = {
  args: { error, reset },
}

/** Custom copy, for a boundary that knows what failed. */
export const CustomCopy: Story = {
  args: {
    error,
    reset,
    title: 'This work could not be loaded',
    description:
      'The page is fine; the request for it was not. Trying again usually works.',
  },
}

/**
 * The development-only details block. It renders the stack, so it must never
 * push the page sideways — the `<pre>` scrolls inside its own container.
 */
export const WithLongStack: Story = {
  args: {
    error: Object.assign(
      new Error(
        'A genuinely long message that keeps going past any sensible width'
      ),
      {
        digest: '3921884471',
        stack: Array.from(
          { length: 12 },
          (_, i) =>
            `    at someDeeplyNestedFunctionName${i} (/very/long/path/to/a/file.tsx:${i}:${i})`
        ).join('\n'),
      }
    ),
    reset,
  },
}
