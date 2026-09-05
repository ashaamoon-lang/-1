import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'

/**
 * The site keeps the promises it makes about itself.
 *
 * Every assertion here corresponds to a sentence the codebase writes down and
 * then failed to honour. A broken promise is worse than a missing feature:
 * it makes someone else act on something untrue.
 *
 *   - `SITE.agentGuidance` told agents to browse /en/work. Soft-404.
 *   - The skip link said "Skip to main content". It moved nothing.
 *   - `lang="id-ID"` on pages whose every visible string was English.
 *
 * None of it was catchable by the gates in place: a soft-404 returns 200, a
 * skip link that does nothing still has the right `href`, and axe's
 * `html-has-lang` only checks the attribute exists.
 */

test.describe('URLs the site tells agents to visit', () => {
  test('every path named in the agent guidance resolves to a real page', async ({
    request,
  }) => {
    // The prose is the source of truth here on purpose: this is testing what
    // the site *says*, so reading it back out of the rendered page is the
    // point. A constant would let the two drift apart again.
    const guidance = await (await request.get('/llms.txt')).text()
    const paths = [
      ...guidance.matchAll(/(?:^|[\s(])(\/(?:en|id)\/[a-z0-9\-/]*)/gm),
    ]
      .map((match) => match[1] ?? '')
      .filter(Boolean)

    expect(
      paths.length,
      'agent guidance names no paths at all'
    ).toBeGreaterThan(0)

    for (const path of new Set(paths)) {
      const response = await request.get(path)
      expect(response.status(), `${path} status`).toBe(200)

      // A soft-404 answers 200 and renders the not-found view, so the status
      // alone proves nothing — which is exactly how /en/work passed for six
      // stages.
      const body = await response.text()
      expect(body, `${path} renders the 404 view`).not.toContain(
        'NEXT_HTTP_ERROR_FALLBACK;404'
      )
    }
  })
})

test.describe('the skip link', () => {
  for (const locale of routing.locales) {
    test(`/${locale}: moves focus into main`, async ({ page }) => {
      await page.goto(`/${locale}`, { waitUntil: 'networkidle' })

      await page.keyboard.press('Tab')
      const focused = await page.evaluate(
        () => document.activeElement?.textContent?.trim() ?? ''
      )
      expect(
        focused.length,
        'first Tab should reach the skip link'
      ).toBeGreaterThan(0)

      await page.keyboard.press('Enter')

      // The assertion the old test never made. Checking `href` and visibility
      // passes on a link that does nothing at all.
      const landedInMain = await page.evaluate(() => {
        const main = document.getElementById('main-content')
        const active = document.activeElement
        return Boolean(
          main && active && (main === active || main.contains(active))
        )
      })

      expect(landedInMain, 'focus must land inside <main>').toBe(true)
    })
  }
})

test.describe('locale parity', () => {
  test('the machine view is not the same document in both languages', async ({
    request,
  }) => {
    const strip = (html: string) =>
      html
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 3)

    const en = strip(await (await request.get('/en/ai')).text())
    const id = strip(await (await request.get('/id/ai')).text())

    expect(en.length).toBeGreaterThan(10)

    const shared = new Set(id)
    const identical = en.filter((line) => shared.has(line)).length
    const ratio = identical / en.length

    /*
     * Not zero, and deliberately not.
     *
     * Proper nouns, URLs, the studio's email and its entity copy are the same
     * in both languages and should be. What must differ is the labels — and
     * when this page shipped with none of them translated the ratio was 1.0
     * (37 of 37). The threshold catches that class of regression without
     * demanding that a studio name be translated.
     */
    expect(
      ratio,
      `${identical} of ${en.length} visible strings are identical across locales`
    ).toBeLessThan(0.8)
  })

  test('entity copy is stated in the language of the page', async ({
    request,
  }) => {
    /*
     * The half of a bilingual site a reader never sees.
     *
     * `lib/seo/site.ts` held one English string per fact until Tahap 10, so
     * `/id` shipped an English `<meta name="description">` and an English
     * `schema.org` `description` under `lang="id-ID"`. Nothing caught it: the
     * test above reads *visible* strings, and axe's `html-has-lang` only
     * checks the attribute exists.
     *
     * The assertion is that the two locales disagree, not that either says
     * something particular — a wording change should not break this, a
     * regression to one shared string must.
     */
    const read = async (path: string) => {
      const html = await (await request.get(path)).text()

      const meta = html.match(/<meta name="description" content="([^"]*)"/)?.[1]

      const organization = [
        ...html.matchAll(
          /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
        ),
      ]
        .map((match) => JSON.parse(match[1] ?? '{}'))
        .find((node) => node['@type'] === 'Organization')

      return {
        meta,
        description: organization?.description as string | undefined,
        knowsAbout: JSON.stringify(organization?.knowsAbout),
      }
    }

    const en = await read('/en')
    const id = await read('/id')

    expect(en.meta, 'no meta description on /en').toBeTruthy()
    expect(en.description, 'no Organization description on /en').toBeTruthy()
    expect(en.knowsAbout, 'no knowsAbout on /en').toBeTruthy()

    expect(id.meta, 'meta description is not translated').not.toBe(en.meta)
    expect(id.description, 'schema.org description is not translated').not.toBe(
      en.description
    )
    expect(id.knowsAbout, 'knowsAbout is not translated').not.toBe(
      en.knowsAbout
    )

    // The `@id` must NOT move: it is the same studio in both languages, and
    // two ids would make two entities out of one.
    const organizationId = async (path: string) => {
      const html = await (await request.get(path)).text()
      return html.match(/"@id":"([^"]*#organization)"/)?.[1]
    }
    expect(await organizationId('/id')).toBe(await organizationId('/en'))
  })
})

/**
 * Honesty about what the site does not yet know — Tahap 35.
 *
 * `CLAUDE.md` §Honesty says: if something was skipped or failed, say so
 * explicitly rather than quietly narrowing scope. These four assertions are
 * that rule pointed at the site's own published surfaces, and all four went
 * red against the site as it stood.
 */
test.describe('the site does not assert what it does not know', () => {
  /*
   * `.example` is RFC 2606's reserved TLD: it exists so that an address can
   * never resolve. Showing one to a person is a placeholder; publishing one
   * as `schema.org/Organization.email` hands a machine a fact it will index.
   *
   * Human surfaces are deliberately not covered here — see
   * `docs/stages/TAHAP-35.md` §3.1 for why the split runs where it does.
   */
  const MACHINE_SURFACES = [
    '/llms.txt',
    '/sitemap.xml',
    '/en/ai',
    '/id/ai',
  ] as const

  for (const path of MACHINE_SURFACES) {
    test(`${path} publishes no reserved-TLD address`, async ({ request }) => {
      const body = await (await request.get(path)).text()

      // Anti-vacuum: an empty response must not pass.
      expect(body.length, `${path} returned nothing`).toBeGreaterThan(200)
      expect(body, `${path} publishes a .example address`).not.toContain(
        '.example'
      )
    })
  }

  for (const locale of routing.locales) {
    test(`the ${locale} JSON-LD publishes no reserved-TLD address`, async ({
      request,
    }) => {
      const html = await (await request.get(`/${locale}`)).text()
      const blocks = [
        ...html.matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
        ),
      ].map((match) => match[1] ?? '')

      expect(blocks.length, 'no JSON-LD on the page').toBeGreaterThan(0)
      for (const block of blocks) {
        expect(block, 'JSON-LD publishes a .example address').not.toContain(
          '.example'
        )
      }
    })
  }

  /*
   * The defect this was written for: `isPlaceholder` was
   * `settings === null`, while every field fell back independently. With a
   * half-filled settings document the flag read false, the note went unshown,
   * and the fallback paragraphs shipped as if the studio had written them.
   */
  for (const locale of routing.locales) {
    test(`${locale} labels fallback prose as fallback`, async ({ page }) => {
      await page.goto(`/${locale}`)
      await page.waitForLoadState('networkidle')

      const shown = await page.evaluate(() => {
        const note = document.querySelector('[data-placeholder-note]')
        const statement = document.querySelector('[data-statement]')
        return {
          hasNote: note !== null,
          fromFallback:
            statement?.getAttribute('data-statement') === 'fallback',
          foundStatement: statement !== null,
        }
      })

      // Anti-vacuum: the statement block must exist for the claim to mean
      // anything.
      expect(shown.foundStatement, 'no statement block on the page').toBe(true)

      if (shown.fromFallback) {
        expect(
          shown.hasNote,
          'the page shows fallback prose without saying so'
        ).toBe(true)
      }
    })
  }

  /*
   * A 308 still answers 200 once the client follows it, which is why the
   * older assertion above passed while the guidance pointed at
   * `/en/work/practice/consulting` — a path that has redirected since the
   * route was renamed. Sending an agent to a redirect is stale guidance.
   */
  test('agent guidance names no path that redirects', async ({ request }) => {
    const guidance = await (await request.get('/llms.txt')).text()
    const paths = [
      ...guidance.matchAll(/(?:^|[\s(])(\/(?:en|id)\/[a-z0-9\-/]*)/gm),
    ]
      .map((match) => match[1] ?? '')
      .filter(Boolean)

    expect(paths.length).toBeGreaterThan(0)

    for (const path of new Set(paths)) {
      const response = await request.get(path, { maxRedirects: 0 })
      expect(
        response.status(),
        `${path} redirects; name the destination instead`
      ).toBeLessThan(300)
    }
  })

  test('the Indonesian machine view uses an Indonesian conjunction', async ({
    page,
  }) => {
    /*
     * The site-facts list only, not the page.
     *
     * The first shape of this scanned all of `/id/ai` and stayed red after
     * the fix landed — correctly, but for the wrong reason: the machine view
     * lists every static route in **both** locales with `hrefLang`, so the
     * English descriptions are supposed to be there. `formatList` feeds this
     * one list, and this list is what the rule is about.
     */
    await page.goto('/id/ai')
    const text = await page
      .locator('[data-site-facts]')
      .evaluate((el) => el.textContent ?? '')

    // Anti-vacuum: the list must have been found and must hold the services.
    expect(text.length, 'no site-facts list on /id/ai').toBeGreaterThan(60)
    expect(text, 'an English conjunction in Indonesian copy').not.toMatch(
      /,\s+and\s+\S/
    )
    expect(text, 'the Indonesian conjunction is missing').toMatch(
      /,\s+dan\s+\S/
    )
  })
})
