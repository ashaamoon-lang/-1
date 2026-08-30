/**
 * Guards the locale handling in `components/ui/link`.
 *
 * Both failures this covers are silent — no error, no warning, just a reader
 * quietly moved into the wrong language:
 *
 *  - a root-relative href rendered without a locale prefix sends someone
 *    reading `/id/...` to `/work`, which `proxy.ts` re-negotiates from their
 *    browser's `Accept-Language`. The language they chose is discarded.
 *  - active state compared as raw strings asks whether `'/id' === '/'`, which
 *    is never true, so every nav item renders inactive on every page.
 *
 * The rendering half is asserted at the routing decision (`isLocalizableHref`
 * via the exported helpers) rather than by mounting React: what matters is
 * which branch an href takes, and that is a pure function.
 */

import { describe, expect, it } from 'bun:test'

import { isLocalizableRoute, localeFromPath } from '@/lib/i18n/paths'

import { getLinkIntent, isExternalHref } from './index'

describe('isExternalHref', () => {
  it('treats absolute http(s) URLs as external', () => {
    expect(isExternalHref('https://example.com')).toBe(true)
    expect(isExternalHref('http://example.com')).toBe(true)
  })

  it('treats routes, hashes and schemes as not-external', () => {
    for (const href of ['/', '/work', '#work', 'mailto:a@b.c', 'tel:+1']) {
      expect(isExternalHref(href), `${href} misread as external`).toBe(false)
    }
  })
})

describe('getLinkIntent active state', () => {
  it('matches a template href against the next-intl pathname', () => {
    // next-intl's usePathname strips the prefix, so both sides are templates.
    expect(getLinkIntent('/work', '/work').isActive).toBe(true)
    expect(getLinkIntent('/', '/').isActive).toBe(true)
  })

  it('still matches when the caller passes a localized pathname', () => {
    // A caller using next/navigation's usePathname gets `/id/work`. Reducing
    // both sides to templates means either import produces the same answer,
    // rather than one of them silently never matching.
    expect(getLinkIntent('/work', '/id/work').isActive).toBe(true)
    expect(getLinkIntent('/work', '/en/work').isActive).toBe(true)
  })

  it('matches the home route across locales', () => {
    // The regression that shipped: '/id' === '/' is false, so the home link
    // rendered dim on every page of every locale.
    expect(getLinkIntent('/', '/id').isActive).toBe(true)
    expect(getLinkIntent('/', '/en').isActive).toBe(true)
  })

  it('does not match a different route', () => {
    expect(getLinkIntent('/work', '/id/studio').isActive).toBe(false)
    expect(getLinkIntent('/', '/id/work').isActive).toBe(false)
  })

  it('returns inactive when the pathname is unavailable', () => {
    expect(getLinkIntent('/work', null).isActive).toBe(false)
  })

  it('reports newTab hrefs as external regardless of shape', () => {
    expect(
      getLinkIntent('/storybook/', '/en', { newTab: true }).isExternal
    ).toBe(true)
  })
})

describe('which hrefs take a locale prefix', () => {
  it('prefixes real routes', () => {
    for (const href of ['/', '/work', '/work/mural', '/ai']) {
      expect(isLocalizableRoute(href), `${href} should be localized`).toBe(true)
    }
  })

  it('never prefixes a static endpoint', () => {
    // `/en/llms.txt` 404s. This shipped briefly: routing internal hrefs
    // through next-intl prefixed the 404 page's recovery links, which are the
    // links a reader uses precisely when everything else has failed.
    for (const href of [
      '/llms.txt',
      '/sitemap.xml',
      '/robots.txt',
      '/manifest.webmanifest',
      '/icon.png',
    ]) {
      expect(isLocalizableRoute(href), `${href} must not be prefixed`).toBe(
        false
      )
    }
  })

  it('never prefixes a deliberately locale-free route', () => {
    // `/en/studio` does not exist — Studio lives under `app/(chrome)/`,
    // outside the localized tree. Prefixing it takes the CMS offline while
    // every page still looks fine.
    for (const href of [
      '/studio',
      '/studio/structure',
      '/api/draft-mode/enable',
      '/agent-content',
    ]) {
      expect(isLocalizableRoute(href), `${href} must not be prefixed`).toBe(
        false
      )
    }
  })

  it('does not confuse a prefix with a route that merely starts like one', () => {
    for (const href of ['/studios', '/studio-notes', '/api-design']) {
      expect(isLocalizableRoute(href), `${href} is a real page`).toBe(true)
    }
  })

  it('never prefixes something that is not a path', () => {
    for (const href of ['#work', 'mailto:a@b.c', 'tel:+1', 'https://x.test']) {
      expect(isLocalizableRoute(href), `${href} is not a route`).toBe(false)
    }
  })
})

describe('never double-prefixes an already-localized href', () => {
  it('treats a path that starts with a locale as already localized', () => {
    // The failure: a caller pre-localizes with `localizedPath`, Link prefixes
    // again, and the result is `/en/en/work/foo`. That matches the CMS
    // catch-all rather than the work route, so every card in the grid led to
    // a not-found page — served with a 200 status, because Cache Components
    // flushes the shell before `notFound()` resolves. Nothing failed.
    for (const href of ['/en', '/id', '/en/work/panas-sore', '/id/ai']) {
      expect(
        isLocalizableRoute(href) && localeFromPath(href) === null,
        `${href} would be prefixed twice`
      ).toBe(false)
    }
  })

  it('still prefixes a template', () => {
    for (const href of ['/', '/work/panas-sore', '/ai']) {
      expect(
        isLocalizableRoute(href) && localeFromPath(href) === null,
        `${href} should be prefixed`
      ).toBe(true)
    }
  })

  it('does not mistake a path that merely starts with those letters', () => {
    // `/energy` begins with "en" but its first segment is not a locale.
    for (const href of ['/energy', '/id-cards', '/index-of-works']) {
      expect(localeFromPath(href), `${href} misread as localized`).toBeNull()
    }
  })
})
