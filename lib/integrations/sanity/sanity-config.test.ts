/**
 * Guards the locale literals in `sanity.config.ts`.
 *
 * That file cannot import `lib/i18n/routing.ts`: it is dual-compiled into the
 * client bundle for the embedded Studio route, and pulling the routing module
 * across that boundary drags server-only config with it. So the locale prefix
 * is written out by hand — and hand-written duplicates drift.
 *
 * The failure is silent and expensive: Presentation resolves a preview URL
 * that only redirects, visual editing stops highlighting anything, and nothing
 * logs an error. A source-level assertion is crude but catches it, in the same
 * spirit as `proxy.test.ts`'s rate-limit tripwire.
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
    for (const route of ['/:locale/:slug', '/:locale/articles/:slug']) {
      expect(source, `missing Presentation route ${route}`).toContain(
        `route: '${route}'`
      )
    }
  })

  it('resolves hrefs with a locale prefix, never a bare slug', async () => {
    const source = await readConfig()

    // `/${slug}` would send the editor to a URL that only redirects.
    expect(source).not.toContain('return slug ? `/${slug}`')
    expect(source).toContain('${PREVIEW_LOCALE}')
  })
})
