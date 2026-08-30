import { describe, expect, test } from 'bun:test'

import { getLinkAttributes, urlForReference } from './link'

describe('urlForReference — external scheme allowlist', () => {
  test('passes through safe schemes verbatim', () => {
    for (const url of [
      'https://example.com/path?q=1#frag',
      'http://example.com',
      'mailto:hello@example.com',
      'tel:+14155552671',
    ]) {
      expect(urlForReference({ linkType: 'external', externalUrl: url })).toBe(
        url
      )
    }
  })

  test('rejects dangerous schemes with an inert #', () => {
    for (const url of [
      'javascript:alert(document.cookie)',
      'JavaScript:alert(1)',
      '  javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
    ]) {
      expect(urlForReference({ linkType: 'external', externalUrl: url })).toBe(
        '#'
      )
    }
  })

  test('allows relative targets', () => {
    for (const url of ['/safe-path', '#hash', '?query']) {
      expect(urlForReference({ linkType: 'external', externalUrl: url })).toBe(
        url
      )
    }
  })

  test('rejects protocol-relative and backslash-prefixed external targets', () => {
    for (const url of ['//evil.example', '/\\evil.example']) {
      expect(urlForReference({ linkType: 'external', externalUrl: url })).toBe(
        '#'
      )
    }
  })
})

describe('urlForReference — internal document resolution', () => {
  test('a page slug maps to its own path, including `home` → /home', () => {
    for (const [slug, expected] of [
      ['about', '/about'],
      // `/` is the developer-owned starter page; the catch-all can't match
      // an empty segment, so `home` must not claim the root.
      ['home', '/home'],
    ] as const) {
      expect(
        urlForReference({
          linkType: 'internal',
          internalLink: { _type: 'page', slug: { current: slug } },
        })
      ).toBe(expected)
    }
  })

  test('articles resolve under /articles', () => {
    expect(
      urlForReference({
        linkType: 'internal',
        internalLink: { _type: 'article', slug: { current: 'hello' } },
      })
    ).toBe('/articles/hello')
  })

  test('rejects internal slugs that could escape the canonical route shape', () => {
    for (const slug of [
      '//evil.example',
      '\\evil.example',
      '../ai',
      'foo/bar',
      'foo?bar',
      'foo#bar',
      '.',
      '..',
      '%2f%2fevil.example',
      'invalid%encoding',
      'a'.repeat(97),
    ]) {
      expect(
        urlForReference({
          linkType: 'internal',
          internalLink: { _type: 'page', slug: { current: slug } },
        })
      ).toBe('#')
    }
  })

  test('preserves safe slugs instead of narrowing the CMS naming policy', () => {
    for (const slug of [
      'lowercase-kebab-slug',
      'release_notes',
      'café',
      'Uppercase',
    ]) {
      expect(
        urlForReference({
          linkType: 'internal',
          internalLink: { _type: 'page', slug: { current: slug } },
        })
      ).toBe(`/${slug}`)
    }
  })
})

describe('getLinkAttributes', () => {
  test('a rejected scheme yields href="#" and no new-tab attrs', () => {
    expect(
      getLinkAttributes(
        {
          linkType: 'external',
          externalUrl: 'javascript:alert(1)',
          openInNewTab: true,
        },
        // Locale is irrelevant for an external link — asserted below by the
        // href coming back unprefixed.
        'en'
      )
    ).toEqual({ href: '#', target: '_blank', rel: 'noopener noreferrer' })
  })

  test('external new-tab link carries rel="noopener noreferrer"', () => {
    expect(
      getLinkAttributes(
        {
          linkType: 'external',
          externalUrl: 'https://example.com',
          openInNewTab: true,
        },
        'en'
      )
    ).toEqual({
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  })
})

describe('getLinkAttributes — locale prefixing', () => {
  test('prefixes an internal document link with the active locale', () => {
    // Without this, every internal CMS link points at the unprefixed path and
    // takes a redirect on each click, in the wrong language.
    const link = {
      linkType: 'internal' as const,
      internalLink: { _type: 'page', slug: { current: 'about' } },
    }

    expect(getLinkAttributes(link, 'id').href).toBe('/id/about')
    expect(getLinkAttributes(link, 'en').href).toBe('/en/about')
  })

  test('leaves an external URL unprefixed', () => {
    expect(
      getLinkAttributes(
        { linkType: 'external', externalUrl: 'https://example.com' },
        'id'
      ).href
    ).toBe('https://example.com')
  })

  test('leaves the "#" fallback alone', () => {
    // Prefixing it would produce "/id/#", a real navigation to a page that
    // does not exist, instead of an inert link.
    expect(getLinkAttributes({ linkType: 'internal' }, 'id').href).toBe('#')
  })
})

describe('urlForReference — document type to path', () => {
  const cases = [
    ['page', 'about', '/about'],
    ['article', 'a-post', '/articles/a-post'],
    ['project', 'panas-sore', '/work/panas-sore'],
  ] as const

  for (const [type, slug, expected] of cases) {
    test(`maps ${type} to ${expected}`, () => {
      expect(
        urlForReference({
          linkType: 'internal',
          internalLink: { _type: type, slug: { current: slug } },
        })
      ).toBe(expected)
    })
  }

  test('gives projects their own namespace, so a name can exist as both', () => {
    // Sanity enforces slug uniqueness per type, not across types. A work and a
    // page can both be called "About"; without separate namespaces they would
    // both resolve to `/about` and one would silently never be reachable.
    const asPage = urlForReference({
      linkType: 'internal',
      internalLink: { _type: 'page', slug: { current: 'about' } },
    })
    const asProject = urlForReference({
      linkType: 'internal',
      internalLink: { _type: 'project', slug: { current: 'about' } },
    })

    expect(asPage).not.toBe(asProject)
  })
})
