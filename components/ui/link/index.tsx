'use client'

import NextLink from 'next/link'
import {
  type AnchorHTMLAttributes,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useSyncExternalStore,
} from 'react'

import {
  Link as IntlLink,
  usePathname as useLocalePathname,
} from '@/lib/i18n/navigation'
import {
  isLocalizableRoute,
  localeFromPath,
  templateFromLocalizedPath,
} from '@/lib/i18n/paths'
import { announceNavigation } from '@/lib/motion/navigation-signal'

type CustomLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof ComponentProps<typeof NextLink> | 'href'
> &
  /*
   * `locale` is dropped, not forgotten. `next/link` types it `string | false`
   * (false meaning "do not add a prefix"); next-intl's Link types it
   * `string | undefined`, and the two do not unify. More importantly, setting
   * it here would let a caller pin one link to a language while the rest of
   * the page follows the URL — which is how a site ends up serving two
   * languages at once. Locale comes from the route, in one place.
   */
  Omit<ComponentProps<typeof NextLink>, 'href' | 'locale'> & {
    href?: string
    onClick?: (e: MouseEvent<HTMLElement>) => void
    scroll?: boolean
    /**
     * Force new-tab behavior (target="_blank" + rel="noopener noreferrer")
     * even for a relative/internal href. `isExternalHref` already covers
     * absolute http(s) URLs automatically — this is only for the rare case
     * of an internal route that should still open in a new tab (e.g. a
     * proxied Storybook route).
     */
    newTab?: boolean | undefined
  }

/**
 * Single source of truth for "is this href external". Absolute http(s) URLs
 * are external; everything else (relative paths, hashes, mailto:, etc.) is
 * treated as internal. Exported so callers that build their own nav data
 * (e.g. Header) can derive the same external-arrow/new-tab intent instead of
 * hand-authoring a parallel `external` flag that can drift from this logic.
 */
export function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://')
}

/**
 * Whether an href names a page this app serves under a locale prefix.
 *
 * Three kinds of href look internal but must never be prefixed:
 *
 *  - a hash (`#work`), a `mailto:`, a `tel:` — not routes at all. Handing
 *    `#work` to next-intl's `Link` rewrites it to `/en#work`, which forces a
 *    full navigation away from the page the reader is on.
 *  - a static endpoint (`/llms.txt`, `/sitemap.xml`) — `/en/llms.txt` 404s.
 *  - `/studio`, `/api`, `/agent-content` — deliberately locale-free.
 *
 * The last two rules live in `lib/i18n/paths.ts` as `isLocalizableRoute`,
 * rather than being restated here where they would drift out of step with
 * routing.
 */
function isLocalizableHref(href: string) {
  if (isExternalHref(href) || !isLocalizableRoute(href)) return false

  /*
   * An href that already starts with a locale segment is already localized.
   *
   * Prefixing it again produces `/en/en/work/foo`, which matches the CMS
   * catch-all instead of the work route and renders a not-found page — with a
   * 200 status, because Cache Components flushes the shell before
   * `notFound()` resolves. Every card in the work grid pointed at one of
   * these, and nothing failed: not the build, not a test, not axe. Callers
   * should pass templates (`/work/foo`), and this makes the other case
   * harmless rather than silently broken.
   */
  return localeFromPath(href) === null
}

/**
 * Single source of truth for a link's "intent" — whether it's external (and
 * should therefore open in a new tab) and whether it matches the current
 * pathname (and should therefore render as active). Both `Link` itself and
 * callers that build their own nav markup (e.g. Header) derive from this
 * instead of hand-rolling the same two checks, which drift on the first
 * matching-logic change.
 */
export function getLinkIntent(
  href: string,
  pathname: string | null,
  { newTab = false }: { newTab?: boolean | undefined } = {}
) {
  return {
    isExternal: isExternalHref(href) || newTab,
    isActive: isActiveHref(href, pathname),
  }
}

/**
 * Active-state comparison, done on templates rather than raw strings.
 *
 * Every page is served under a locale prefix, so a raw comparison asks
 * whether `'/id' === '/'` and is permanently false — the bug that left every
 * nav item rendering as inactive on both locales. Both sides are reduced to
 * their locale-free template first, so a caller may pass either the
 * next-intl pathname (`/work`) or a full localized one (`/id/work`) and get
 * the same answer.
 */
function isActiveHref(href: string, pathname: string | null) {
  if (pathname === null) return false
  return toTemplate(pathname) === toTemplate(href)
}

/** A path reduced to its locale-free form; already-template paths pass through. */
function toTemplate(path: string) {
  return templateFromLocalizedPath(path) ?? path
}

// Browser Network Information API (not in the DOM lib types). Present on Chromium.
function getConnection():
  | (EventTarget & { effectiveType: string; saveData: boolean })
  | undefined {
  // SAFETY: Network Information API's `navigator.connection` is present on
  // Chromium but absent from the DOM lib types; callers already treat the
  // result as possibly undefined.
  return (
    navigator as Navigator & {
      connection?: EventTarget & { effectiveType: string; saveData: boolean }
    }
  ).connection
}

// Prefetch on fast, non-data-saving connections. Exposed via useSyncExternalStore
// so the value is SSR-safe (server snapshot below) without a mount effect, and
// re-reads if the connection quality changes.
function subscribeConnection(onChange: () => void) {
  const connection = getConnection()
  connection?.addEventListener('change', onChange)
  return () => connection?.removeEventListener('change', onChange)
}
function getShouldPrefetch() {
  const connection = getConnection()
  if (!connection) return true
  return connection.effectiveType === '4g' && !connection.saveData
}
function getServerShouldPrefetch() {
  return false
}

export function Link({
  href,
  children,
  onClick,
  scroll = false, // Default to false to prevent scroll restoration warnings with fixed/sticky elements
  newTab = false,
  ...props
}: CustomLinkProps) {
  // next-intl's `usePathname`, not the one from `next/navigation`: it returns
  // the path with the locale prefix already stripped, which is the form
  // `isActiveHref` compares against.
  const pathname = useLocalePathname()

  // Derived during render straight from `href`. The string check is
  // deterministic on both server and client, so the SSR markup and the first
  // client render always agree — no mirror state + effect needed.
  const { isExternal, isActive } = href
    ? getLinkIntent(href, pathname, { newTab })
    : { isExternal: false, isActive: false }
  const opensNewTab = isExternal

  // Prefetch hint from the browser Network Information API. Read via
  // useSyncExternalStore so it's SSR-safe (server snapshot = false) with no
  // mount effect, and re-reads if the connection quality changes.
  const shouldPrefetch = useSyncExternalStore(
    subscribeConnection,
    getShouldPrefetch,
    getServerShouldPrefetch
  )

  // No href + onClick → button
  if (!href && onClick) {
    const { target: _t, rel: _r, ...buttonProps } = props
    // `buttonProps` is `CustomLinkProps` minus the explicit named props above
    // and `target`/`rel` — its `ref`/`onMouseEnter`/etc. are typed for an
    // anchor element, which don't structurally overlap with a button's event
    // handler types. Neither this branch's callers pass anchor-specific
    // values here, since it only renders when there is no `href` (a
    // button-shaped `Link` usage) — widen to `unknown` first (never flagged,
    // since `buttonProps` isn't a literal, so it carries no evidence to
    // discard), then assert the one shape this element actually needs.
    const buttonPropsUnknown: unknown = buttonProps
    // SAFETY: see the two-step comment above this statement.
    const typedButtonProps =
      buttonPropsUnknown as ComponentPropsWithoutRef<'button'>
    return (
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => onClick(e)}
        type="button"
        {...typedButtonProps}
      >
        {children}
      </button>
    )
  }

  // No href and no onClick → div
  if (!href) {
    const { target: _t, rel: _r, ...divProps } = props
    // See the `buttonProps` two-step comment above — same reasoning, for a div.
    const divPropsUnknown: unknown = divProps
    // SAFETY: see the two-step comment above `buttonPropsUnknown`.
    const typedDivProps = divPropsUnknown as ComponentPropsWithoutRef<'div'>
    return <div {...typedDivProps}>{children}</div>
  }

  const shared = {
    prefetch: opensNewTab ? false : shouldPrefetch,
    scroll,
    'data-active': isActive || undefined,
    ...(opensNewTab && { target: '_blank', rel: 'noopener noreferrer' }),
    ...(onClick && { onClick }),
    /*
     * Tells `vault/motion/page-transition` a navigation has begun.
     *
     * `onNavigate` rather than `onClick` because Next only fires it for real
     * client-side navigations: a cmd-click, a middle-click, a new-tab click
     * and an external href all skip it. Doing this from `onClick` would mean
     * re-deriving those cases here and getting one of them wrong — the
     * failure being an overlay covering the page the reader stayed on.
     *
     * The signal is a `window` event (`lib/motion/navigation-signal.ts`), so
     * this component knows nothing about animation and nothing listens when
     * the overlay is absent under reduced motion.
     */
    onNavigate: announceNavigation,
    ...props,
  }

  // A route in this app: rendered through next-intl's Link so the reader's
  // locale prefix survives the navigation. Without this, `/work` sends
  // someone reading `/id/...` to `/work`, which proxy.ts re-negotiates from
  // their browser's Accept-Language — silently discarding the language they
  // chose. `lib/i18n/navigation.ts` documents the same failure.
  if (isLocalizableHref(href) && !opensNewTab) {
    return (
      // SAFETY: hrefs arrive as arbitrary strings (CMS links, nav data), which
      // typed routes cannot verify statically; `isLocalizableHref` has already
      // established this one is a root-relative path. The cast only exists
      // against `next typegen` output, so an un-typegen'd tsc run calls it
      // redundant.
      <IntlLink
        href={href as ComponentProps<typeof IntlLink>['href']}
        {...shared}
      >
        {children}
      </IntlLink>
    )
  }

  // Everything else — absolute URLs, explicit new-tab, hashes, mailto:, tel:.
  // NextLink passes `target`/`rel` through to the anchor, skips client routing
  // for absolute URLs on its own, and prefetching a new-tab destination is
  // waste. None of these take a locale prefix.
  return (
    <NextLink
      // SAFETY: see the cast above — same reasoning, for the non-route branch.
      href={href as ComponentProps<typeof NextLink>['href']}
      {...shared}
    >
      {children}
    </NextLink>
  )
}
