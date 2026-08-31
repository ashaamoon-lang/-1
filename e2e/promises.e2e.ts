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
