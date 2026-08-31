/**
 * Guards the locale literals in `sanity.config.ts`.
 *
 * That file cannot import `lib/i18n/routing.ts`: it is dual-compiled into the
 * client bundle for the embedded Studio route, and pulling the routing module
 * across that boundary drags next-intl in with it. So the locale list and the
 * preview prefix are written out by hand — and hand-written duplicates drift.
 *
 * Every failure guarded here is silent. A language offered in the Studio but
 * not routed produces content no page can render; a preview URL without a
 * locale prefix only redirects, so visual editing stops highlighting anything.
 * Nothing logs an error in either case. Source-level assertions are crude but
 * catch it, in the same spirit as `proxy.test.ts`'s rate-limit tripwire.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'

import { routing } from '@/lib/i18n/routing'

const CONFIG_PATH = join(import.meta.dir, 'sanity.config.ts')
const readConfig = () => Bun.file(CONFIG_PATH).text()

describe('sanity.config.ts locale wiring', () => {
  it('previews under the default locale', async () => {
    const source = await readConfig()
    expect(source).toContain(
      `const PREVIEW_LOCALE = '${routing.defaultLocale}'`
    )
  })

  it('maps preview routes under a :locale segment', async () => {
    const source = await readConfig()

    // Every page is served under a locale prefix. A route without `:locale`
    // never matches, and Presentation quietly loses its document mapping.
    for (const route of ['/:locale/:slug', '/:locale/work/:slug']) {
      expect(source, `missing Presentation route ${route}`).toContain(
        `route: '${route}'`
      )
    }
  })

  it('resolves hrefs with a locale prefix, never a bare slug', async () => {
    const source = await readConfig()

    // A bare `/${slug}` would send the editor to a URL that only redirects.
    expect(source).toContain('${PREVIEW_LOCALE}')
  })

  it('offers exactly the locales the app routes', async () => {
    const source = await readConfig()

    for (const locale of routing.locales) {
      expect(source, `Studio offers no "${locale}" language`).toContain(
        `{ id: '${locale}',`
      )
    }

    // And the reverse: a language in the Studio the app cannot serve.
    const offered = [...source.matchAll(/\{ id: '([a-z-]+)', title:/g)]
      .map((match) => match[1])
      // `noUncheckedIndexedAccess` types a capture group as possibly
      // undefined; the regex guarantees group 1 exists on every match.
      .filter((id): id is string => id !== undefined)
    expect(offered.length, 'no languages found in config').toBeGreaterThan(0)
    for (const id of offered) {
      expect(
        routing.locales as readonly string[],
        `Studio offers "${id}", which the app does not route`
      ).toContain(id)
    }
  })

  it('registers the field types the schemas reference', async () => {
    const source = await readConfig()

    // A field typed `internationalizedArrayText` when only 'string' is
    // registered disappears from the Studio without an error.
    expect(source).toContain("fieldTypes: ['string', 'text', 'richText']")
  })
})
