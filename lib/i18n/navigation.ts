/**
 * Locale-aware navigation.
 *
 * Import `Link`, `redirect`, `usePathname`, `useRouter` and `getPathname`
 * from here rather than from `next/link` or `next/navigation` — these
 * wrappers keep the active locale prefix on every internal navigation.
 * Using the bare Next APIs drops the prefix and silently sends a reader from
 * `/id/...` back to the default locale.
 *
 * Note `components/ui/link` remains the house link component for anything
 * that also needs external-href detection, new-tab handling, or active
 * state; it is built on top of these.
 */

import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
