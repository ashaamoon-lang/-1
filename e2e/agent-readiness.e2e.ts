import { expect, test } from '@playwright/test'

/*
 * Identity is read from `lib/seo/site.ts`, not retyped.
 *
 * These assertions used to spell out the starter's identity — `# Satūs`, a
 * `## Developer resources` section, and a link to the darkroom GitHub repo.
 * They passed for exactly as long as the fork had not been rebranded, which
 * means the suite was holding the *wrong* identity in place rather than
 * guarding the right one.
 */
import { isLocalizableRoute } from '../lib/i18n/paths'
import { SITE } from '../lib/seo/site'
const NEXT_VARY_FIELDS = [
  'rsc',
  'next-router-state-tree',
  'next-router-prefetch',
  'next-router-segment-prefetch',
]

function varyFields(response: { headers(): Record<string, string> }): string[] {
  return (response.headers().vary ?? '')
    .split(',')
    .map((field) => field.trim().toLowerCase())
    .filter(Boolean)
}

function readableText(html: string): string {
  return html
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

test.describe('agent-readable HTML', () => {
  test('the initial homepage response carries substantive, structured content', async ({
    request,
  }) => {
    const response = await request.get('/', {
      headers: { Accept: 'text/html' },
    })
    const html = await response.text()

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')

    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((match) =>
      Number(match[1])
    )
    expect(headings.filter((level) => level === 1)).toHaveLength(1)
    expect(headings[0]).toBe(1)

    for (const [index, level] of headings.entries()) {
      if (index === 0) continue
      expect(
        level,
        `heading ${index + 1} skips from h${headings[index - 1]} to h${level}`
      ).toBeLessThanOrEqual((headings[index - 1] ?? 1) + 1)
    }

    expect(readableText(html).length).toBeGreaterThanOrEqual(500)
  })

  test('the prerendered HTML carries the site chrome, not just a shell', async ({
    request,
  }) => {
    /*
     * A regression guard with a specific cause behind it.
     *
     * Under Cache Components, a clock read during render — `new Date()` in a
     * component body — makes the enclosing boundary dynamic. When that
     * boundary is inside a Client Component, React bails it to client-side
     * rendering and the prerendered HTML arrives as a shell: skip link,
     * `<script>` tags, nothing else. The build still succeeds, dev still
     * renders correctly, and only the served bytes show it. That shipped once
     * (the footer's copyright year) and was found by reading the HTML, not by
     * a failing test.
     *
     * The heading assertions above would also fail in that state, but they
     * would say "no h1", which sends you looking at the page component. This
     * one names the actual failure.
     */
    for (const path of ['/en', '/id']) {
      const html = await (await request.get(path)).text()

      expect(
        html,
        `${path} prerendered without the header — a boundary bailed to client-side rendering`
      ).toContain('id="header-nav"')
      expect(html, `${path} prerendered without the footer`).toContain(
        '<footer'
      )
    }
  })

  test('the home page renders its content without JavaScript', async ({
    browser,
    request,
  }) => {
    /*
     * This replaces a characterization test, and the swap is the point.
     *
     * That test recorded a defect rather than a requirement: with scripts
     * disabled `/en` rendered **28 characters** — "Skip to main content
     * Loading" — while the real markup sat in the DOM inside a `<div hidden>`
     * that only an inline script reveals. It ended with an instruction:
     * "if this ever starts failing because the page renders fully without
     * scripts, that is good news: delete the characterization and restore the
     * original assertion." Tahap 9 made it fail. This is that restoration.
     *
     * Its diagnosis was also half wrong, and correcting it matters more than
     * the assertion. It blamed `defineLive` reading `draftMode()`. The home
     * page had already stopped reading draft mode two stages earlier and
     * still showed the shell. The actual cause was one file in the wrong
     * place: `app/[locale]/loading.tsx` put a Suspense boundary around the
     * whole `[locale]` segment, including routes that read no request data at
     * all. Moving it down to the four segments that need it took this page
     * from 28 characters to its full 1073.
     *
     * `docs/stages/TAHAP-9.md` §1 carries the measurement.
     */
    const html = await (await request.get('/en')).text()
    expect(html).toContain('<h1')
    expect(readableText(html).length).toBeGreaterThanOrEqual(500)

    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    try {
      const response = await page.goto('/en')
      expect(response?.status()).toBe(200)

      // Present *and* exposed. The old test asserted the opposite of the
      // second line: one `h1` in the DOM, zero in the accessibility tree.
      expect(await page.locator('h1').count()).toBe(1)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      const visible = (await page.locator('body').innerText()).trim()
      expect(
        visible.length,
        `only rendered: ${visible.slice(0, 60)}`
      ).toBeGreaterThan(500)
    } finally {
      await context.close()
    }
  })
})

test.describe('Markdown content negotiation', () => {
  test('serves the homepage as Markdown with guidance and resource discovery', async ({
    request,
  }) => {
    // '/en', not '/': with `localePrefix: 'always'` the bare root only ever
    // redirects, so negotiation happens on the locale home.
    const htmlResponse = await request.get('/en', {
      headers: { Accept: 'text/html' },
    })
    const response = await request.get('/en', {
      headers: { Accept: 'text/markdown' },
    })
    const body = await response.text()
    const htmlVary = varyFields(htmlResponse)
    const markdownVary = varyFields(response)

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe(
      'text/markdown; charset=utf-8'
    )
    expect(markdownVary).toContain('accept')
    for (const field of NEXT_VARY_FIELDS) {
      if (htmlVary.includes(field)) expect(markdownVary).toContain(field)
    }

    expect(body).toContain(`# Home | ${SITE.name}`)
    expect(body).toContain('## When to use')
    expect(body).toContain('## How to use')
  })

  test('honors qualities and rejects requests for unsupported representations', async ({
    request,
  }) => {
    const htmlPreferred = await request.get('/', {
      headers: { Accept: 'text/html;q=0.9, text/markdown;q=0.3' },
    })
    const markdownPreferred = await request.get('/', {
      headers: { Accept: 'text/html;q=0.3, text/markdown;q=0.9' },
    })
    const unsupported = await request.get('/', {
      headers: { Accept: 'application/json' },
    })

    expect(htmlPreferred.headers()['content-type']).toContain('text/html')
    expect(markdownPreferred.headers()['content-type']).toBe(
      'text/markdown; charset=utf-8'
    )
    expect(unsupported.status()).toBe(406)
    expect(varyFields(unsupported)).toContain('accept')
    await expect(unsupported.text()).resolves.toContain(
      'text/html, text/markdown'
    )
  })

  test('never 406s a route mixed Accept ranks Markdown-first when it has no Markdown representation — a genuinely absent route still 404s truthfully', async ({
    request,
  }) => {
    const response = await request.get('/missing-agent-page', {
      headers: { Accept: 'text/html;q=0.5, text/markdown;q=0.9' },
    })
    const body = await response.text()

    expect(response.status()).toBe(404)
    expect(body).toContain('/ai')
  })

  test('the HTML format override wins even when Accept still prefers Markdown, breaking the negotiation loop', async ({
    request,
  }) => {
    const response = await request.get('/?format=html', {
      headers: { Accept: 'text/markdown' },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
  })

  test('HEAD advertises the Markdown representation without sending a body', async ({
    request,
  }) => {
    const response = await request.head('/en', {
      headers: { Accept: 'text/markdown' },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe(
      'text/markdown; charset=utf-8'
    )
    expect(varyFields(response)).toContain('accept')
    expect(await response.body()).toHaveLength(0)
  })

  test('supports explicit Markdown aliases without an Accept header', async ({
    request,
  }) => {
    // Aliases follow the localized routes: markdownPathForRoute('/en') is
    // '/en.md'. '/index.md' only ever existed for the unprefixed root.
    for (const path of ['/en.md', '/en/ai.md', '/id.md', '/id/ai.md']) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(200)
      expect(response.headers()['content-type'], path).toBe(
        'text/markdown; charset=utf-8'
      )
      expect(await response.text(), path).toContain(`| ${SITE.name}`)
    }
  })

  test('unknown Markdown documents return a recoverable real 404', async ({
    request,
  }) => {
    const responses = [
      await request.get('/missing.md'),
      await request.get('/missing-agent-page', {
        headers: { Accept: 'text/markdown' },
      }),
    ]

    for (const response of responses) {
      const body = await response.text()
      expect(response.status()).toBe(404)
      expect(response.headers()['content-type']).toBe(
        'text/markdown; charset=utf-8'
      )
      expect(body).toContain('/ai')
      expect(body).toContain('/llms.txt')
      expect(body).toContain('/sitemap.xml')
    }
  })

  test('does not expose the internal Markdown handler through a forged header', async ({
    request,
  }) => {
    const response = await request.get('/agent-content', {
      headers: { 'x-satus-markdown-source-path': '/' },
    })

    expect(response.status()).toBe(404)
    expect(response.headers()['content-type']).toContain('text/plain')
  })

  test('does not negotiate router requests or public assets as page documents', async ({
    request,
  }) => {
    const routerResponse = await request.get('/', {
      headers: { Accept: 'application/json', Purpose: 'prefetch' },
    })
    expect(routerResponse.status()).not.toBe(406)

    const assetResponse = await request.get('/icon.png', {
      headers: { Accept: 'text/markdown' },
    })
    expect(assetResponse.status()).toBe(200)
    expect(assetResponse.headers()['content-type']).toContain('image/png')
  })
})

test.describe('machine-readable discovery files', () => {
  test('publishes the agent index, policy, sitemap, and instructions', async ({
    request,
  }) => {
    const llms = await request.get('/llms.txt')
    const llmsBody = await llms.text()
    expect(llms.status()).toBe(200)
    expect(llms.headers()['content-type']).toContain('text/plain')
    expect(llmsBody).toContain(`# ${SITE.name}`)
    expect(llmsBody).toContain('## When to use')
    expect(llmsBody).toContain('## How to use')

    /*
     * Every advertised content URL carries a locale prefix.
     *
     * `localePrefix` is 'always', so a bare `/work/<slug>` is not a page —
     * it 307s to whatever the fetching agent's Accept-Language implies. This
     * file shipped exactly that for every artwork: a URL in no sitemap, and
     * no page's canonical, on the surface whose whole job is handing a
     * crawler an address to record. See `localizedContentRoutes`.
     */
    const advertised = [...llmsBody.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(
      (match) => new URL(match[1] ?? '').pathname
    )
    expect(advertised.length).toBeGreaterThan(0)
    for (const path of advertised) {
      expect(path).toMatch(/^\/(en|id)(\/|$)/)
    }

    const ai = await request.get('/ai')
    const aiBody = await ai.text()
    expect(ai.status()).toBe(200)
    expect(ai.headers()['content-type']).toContain('text/html')
    expect(aiBody).toContain('When to use')
    expect(aiBody).toContain('How to use')
    expect(aiBody).toContain(SITE.name)

    /*
     * Same rule as /llms.txt above, for the HTML machine view: no internal
     * link may skip the locale prefix.
     *
     * Anchors only. A bare `href="…"` match also picks up the stylesheet
     * `<link>` in the head (`/_next/static/chunks/*.css`), which is neither
     * internal navigation nor localizable.
     */
    const aiLinks = [...aiBody.matchAll(/<a[^>]+href="(\/[^"#]*)"/g)].map(
      (match) => match[1] ?? ''
    )
    // `isLocalizableRoute` is the app's own rule for which paths take a
    // prefix — it excludes `/robots.txt`, `/sitemap.xml` and friends because
    // a dotted last segment is a file, not a page. Reusing it beats keeping
    // a second exclusion list here that could disagree with the first.
    const internal = aiLinks.filter(isLocalizableRoute)
    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(href).toMatch(/^\/(en|id)(\/|$)/)
    }

    const sitemap = await request.get('/sitemap.xml')
    const sitemapBody = await sitemap.text()
    expect(sitemap.status()).toBe(200)
    expect(sitemap.headers()['content-type']).toContain('application/xml')
    expect(sitemapBody).toContain('<urlset')
    expect(sitemapBody).toContain('/ai</loc>')

    const robots = await request.get('/robots.txt')
    const robotsBody = await robots.text()
    expect(robots.status()).toBe(200)
    expect(robots.headers()['content-type']).toContain('text/plain')
    expect(robotsBody).toContain('User-Agent: GPTBot')
    expect(robotsBody).toContain('Sitemap:')
  })
})
