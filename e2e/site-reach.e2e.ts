import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { PRACTICES, practiceTemplate } from '../lib/content/practices'
import { FEATURED_WORK } from './fixtures'

/**
 * Whether a reader can get anywhere from where they landed.
 *
 * ## The measurement that produced this
 *
 * Tahap 20 counted the real onward links on every route, at both viewports,
 * separating header, footer and content:
 *
 * | Route                  | onward links in content            |
 * | ---------------------- | ---------------------------------- |
 * | `/en`                  | 12                                 |
 * | `/en/work`             | 11, including three practice chips |
 * | `/en/practice/<value>` | 3                                  |
 * | **`/en/work/<slug>`**  | **1** — the next project           |
 *
 * And on every single route the footer carried **no navigation at all** —
 * an email address and two social accounts. A project page is the one most
 * likely to be a landing page, from a search result or a shared link, and it
 * offered a reader exactly one way onward.
 *
 * ## Why this asserts reachability rather than a count
 *
 * "At least three links" is a magic number that a page could satisfy while
 * still stranding someone. This asserts the two destinations that actually
 * matter — the catalogue, and every practice — so it stays true whatever the
 * page's composition becomes.
 */

/*
 * `/ai` is excluded, and the exemption is deliberate rather than an oversight:
 * `app/[locale]/ai/layout.tsx` bypasses the app layout on purpose because the
 * route is a plain-HTML index for crawlers and agents. It has no header and no
 * footer by design, and a rule about the site's chrome cannot apply to the one
 * page that has none.
 */
const ROUTES = [
  '/en',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  ...PRACTICES.map((value) => `/en/practice/${value}`),
  '/id',
]

/** Every internal destination the page links to, hrefs only. */
async function destinations(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .map((anchor) => anchor.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('/'))
  )
}

test.describe('every page offers a way into the rest of the site', () => {
  for (const route of ROUTES) {
    test(`${route} reaches the catalogue and every practice`, async ({
      page,
    }) => {
      await page.goto(route)
      await page.waitForTimeout(1800)

      const hrefs = await destinations(page)
      const locale = route.startsWith('/id') ? 'id' : 'en'

      // The catalogue. Matched by suffix so it holds whether the link is
      // written localized (`/en/work`) or as a template next-intl prefixes.
      expect(
        hrefs.some((href) => href === '/work' || href === `/${locale}/work`),
        `${route} offers no link to the work index; internal links seen: ${hrefs.join(' ')}`
      ).toBe(true)

      for (const value of PRACTICES) {
        const template = practiceTemplate(value)
        expect(
          hrefs.some(
            (href) => href === template || href === `/${locale}${template}`
          ),
          `${route} offers no link to ${value}; internal links seen: ${hrefs.join(' ')}`
        ).toBe(true)
      }
    })
  }
})

/**
 * A URL guessed from a nav label, and where it lands.
 *
 * The mapping itself is unit-tested in `lib/i18n/guessed-paths.test.ts`; what
 * this adds is proof that `proxy.ts` actually runs it, and that the status is
 * a **real 308** rather than the 200 the not-found page is forced to return
 * (`e2e/not-found.e2e.ts` documents why). Middleware executes before
 * rendering, so this is the one layer of the app where a genuine redirect
 * status is available — and an assertion that never checked the status would
 * pass just as happily against a soft 404.
 */
const GUESSED: [typed: string, lands: string][] = [
  ['/en/contact', '/en#contact'],
  ['/id/kontak', '/id#contact'],
  ['/en/practice', '/en#practice'],
  ['/id/praktik', '/id#practice'],
  ['/id/karya', '/id/work'],
]

test.describe('a URL guessed from a nav label goes somewhere', () => {
  for (const [typed, lands] of GUESSED) {
    test(`${typed} redirects to ${lands}`, async ({ page }) => {
      const response = await page.goto(typed)

      /*
       * The first hop of the chain, not the final response.
       *
       * Written carefully, because the obvious version cannot fail: an
       * expression like `hop ? (await hop.response())?.status() : 308`
       * substitutes the expected value when no redirect happened at all, so
       * it passes hardest exactly when the feature is missing. Assert the hop
       * exists first, then read its status.
       */
      const hop = response?.request().redirectedFrom()
      expect(hop, `${typed} produced no redirect at all`).not.toBeNull()

      const status = (await hop?.response())?.status()
      expect(
        status,
        `${typed} answered ${status} — a 200 here means the reader got the not-found page instead of being sent on`
      ).toBe(308)

      const landed = new URL(page.url())
      expect(
        landed.pathname + landed.hash,
        `${typed} landed on ${landed.pathname}${landed.hash}`
      ).toBe(lands)
    })
  }

  test('a real route is never redirected away', async ({ page }) => {
    // `/en/work` is the catalogue and `/en/practice/consulting` a real page;
    // a redirect table that caught either would be worse than the 404s it
    // exists to remove.
    for (const route of ['/en/work', '/id/work', '/en/practice/consulting']) {
      await page.goto(route)
      expect(new URL(page.url()).pathname, `${route} was redirected`).toBe(
        route
      )
    }
  })
})

/**
 * The site can be walked, not just entered — Tahap 38.
 *
 * ## Measured before any of it was built
 *
 * Links inside `<main>`, which is the page's own content. The footer is
 * excluded on purpose: it is identical on every route, so it is not wayfinding
 * *from* this page.
 *
 * | route                  | links in main | route links in header |
 * | ---------------------- | ------------: | --------------------: |
 * | `/en`                  |             7 |                     0 |
 * | `/en/work`             |            10 |                     0 |
 * | `/en/work/<slug>`      |         **1** |                     0 |
 * | `/en/practice/<v>`     |             3 |                     0 |
 * | `/en/studio`           |         **1** |                     0 |
 * | `/en/journal`          |             3 |                     0 |
 * | `/en/journal/<slug>`   |         **1** |                     0 |
 * | 404                    |             4 |                     0 |
 *
 * Three pages offered one way out, and the one element present on every route
 * carried no route link at all. The 404's four were `/en/ai`, `/llms.txt`,
 * `/sitemap.xml` and `/en` — surfaces for crawlers, offered to a person who
 * just got lost.
 */

const HUMAN_ROUTES = [
  '/en',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  '/en/practice/consulting',
  '/en/studio',
  '/en/journal',
  '/en/journal/scope-is-the-deliverable',
] as const

/** Paths a person can act on. `/llms.txt` is not one of them. */
const MACHINE_ONLY = /^\/(llms\.txt|sitemap\.xml|robots\.txt)|\/ai$/

test.describe('every page offers a way onward', () => {
  for (const route of HUMAN_ROUTES) {
    test(`${route} carries the route navigation`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const nav = await page.evaluate(() => {
        const links = [...document.querySelectorAll('header a[href]')].map(
          (a) => ({
            href: a.getAttribute('href') ?? '',
            current: a.getAttribute('aria-current'),
          })
        )
        return {
          hrefs: links.map((l) => l.href),
          current: links.filter((l) => l.current === 'page').length,
        }
      })

      // Anti-vacuum: a header with no links at all must not pass.
      expect(nav.hrefs.length).toBeGreaterThan(2)

      for (const destination of ['/work', '/studio', '/journal']) {
        expect(
          nav.hrefs.some((href) => href.endsWith(destination)),
          `no header link to ${destination}`
        ).toBe(true)
      }

      // At most one, and exactly one wherever the header names this page.
      expect(nav.current).toBeLessThanOrEqual(1)
    })
  }

  for (const route of HUMAN_ROUTES) {
    test(`${route} offers three ways onward from its own content`, async ({
      page,
    }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const onward = await page.evaluate((from: string) => {
        const here = new URL(from, location.origin).pathname
        return [
          ...new Set(
            [...document.querySelectorAll('main a[href^="/"]')]
              .map((a) => a.getAttribute('href') ?? '')
              .filter((href) => href !== '' && !href.startsWith('#'))
              .map((href) => new URL(href, location.origin).pathname)
              .filter((path) => path !== here)
          ),
        ]
      }, route)

      expect(
        onward.length,
        `${route} offers ${onward.length}: ${onward.join(' ')}`
      ).toBeGreaterThanOrEqual(3)
    })
  }

  /*
   * With JavaScript, and that limit is stated rather than implied.
   *
   * Measured during this stage, on the production build with JS disabled:
   * `/en/no-such-page-here` renders **28 characters** ("Skip to main content /
   * Loading"), zero `<h1>` and zero links; `/id/tidak-ada` 30; the root
   * variant 28. The 404 lives inside `app/[locale]/[...slug]`, which is `◐`,
   * so `notFound()` resolves inside the dynamic hole and the not-found UI
   * arrives in a streamed chunk only JavaScript can commit.
   *
   * Two fixes were tried and measured in the same session — deleting the
   * segment's `loading.tsx` with `export const instant = false`, and dropping
   * its `draftMode()` read. Neither worked; the first took the no-JS render
   * from 28 characters to **0**, because `RouteLoading` was the only static
   * content the shell had. Both were reverted rather than shipped.
   *
   * So this asserts what the stage actually delivered: the 404 offers three
   * human destinations to a reader with a browser. Making it offer them to a
   * crawler is a rendering defect, not a navigation one, and
   * `docs/stages/TAHAP-38.md` §Hasil carries it open with these numbers.
   */
  test('the 404 offers somewhere a person would go', async ({ page }) => {
    await page.goto('/en/no-such-page-here')
    await page.waitForLoadState('networkidle')

    const human = await page.evaluate((pattern: string) => {
      const machineOnly = new RegExp(pattern)
      return [
        ...new Set(
          [...document.querySelectorAll('main a[href^="/"]')]
            .map((a) => a.getAttribute('href') ?? '')
            .filter((href) => !machineOnly.test(href))
        ),
      ]
    }, MACHINE_ONLY.source)

    expect(
      human.length,
      `the 404 offers ${human.length} human destinations: ${human.join(' ')}`
    ).toBeGreaterThanOrEqual(3)
  })

  test('every journal entry is announced to machines', async ({ request }) => {
    const [sitemap, llms] = await Promise.all([
      (await request.get('/sitemap.xml')).text(),
      (await request.get('/llms.txt')).text(),
    ])

    const slugs = [
      'scope-is-the-deliverable',
      'a-decision-you-can-defend',
      'evaluation-before-pipeline',
    ]

    expect(sitemap.length).toBeGreaterThan(200)
    for (const slug of slugs) {
      expect(sitemap, `${slug} missing from the sitemap`).toContain(
        `/journal/${slug}`
      )
      expect(llms, `${slug} missing from llms.txt`).toContain(
        `/journal/${slug}`
      )
    }
  })

  for (const route of [
    `/en/work/${FEATURED_WORK}`,
    '/en/practice/consulting',
    '/en/journal/scope-is-the-deliverable',
  ]) {
    test(`${route} publishes a breadcrumb trail`, async ({ request }) => {
      const html = await (await request.get(route)).text()
      const blocks = [
        ...html.matchAll(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
        ),
      ].map((match) => match[1] ?? '')

      expect(blocks.length).toBeGreaterThan(0)
      const trail = blocks.find((block) => block.includes('BreadcrumbList'))
      expect(trail, 'no BreadcrumbList on an inner page').toBeDefined()
      // A trail of one is not a trail.
      expect(trail ?? '').toContain('"position":2')
    })
  }

  /**
   * Every link the site's own chrome renders reaches a page of the site.
   *
   * ## The defect this exists for, measured
   *
   * `site-reach`'s header assertion above matched hrefs by suffix, so
   * `href="/studio"` satisfied "there is a header link to /studio" while
   * serving something else entirely. On the production build, before this:
   *
   * ```
   * curl -s localhost:3000/en | grep -o 'href="[^"]*studio[^"]*"'
   *   href="#studio"
   *   href="/studio"          <- the footer's link to the studio page
   * curl -s -o /dev/null -w '%{http_code}' localhost:3000/studio  ->  200
   * curl -s localhost:3000/studio | grep -o '<title>[^<]*</title>'
   *   <title>Sanity Studio</title>
   * ```
   *
   * A reader who pressed "Studio" in the footer — the site's only route
   * navigation until this stage — landed on the CMS login. It had shipped
   * that way since Tahap 24, and `docs/stages/TAHAP-15.md` §1.3 had already
   * written down that `/studio` was taken.
   *
   * ## Why the locale prefix is the thing asserted
   *
   * The cause was not a typo. `lib/i18n/paths.ts` listed `/studio` as
   * deliberately locale-free (it was Sanity Studio's base path), so
   * `components/ui/link` correctly declined to prefix it — and a correct
   * refusal to localize is indistinguishable, in the rendered href, from a
   * link that was never meant to be a page. Every page of this site is served
   * under a locale, so an unprefixed href in the chrome is that bug's exact
   * signature, whatever caused it.
   */
  const CHROME_MACHINE_HREFS =
    /^\/(llms\.txt|sitemap\.xml|robots\.txt|cms|api\/|agent-content)/

  for (const route of ['/en', `/en/work/${FEATURED_WORK}`, '/id/studio']) {
    test(`${route}: the chrome links to localized pages`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')

      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll('header a[href], footer a[href]')]
          .map((a) => a.getAttribute('href') ?? '')
          .filter((href) => href.startsWith('/'))
      )

      // Anti-vacuum: a chrome with nothing in it must not pass.
      expect(hrefs.length).toBeGreaterThan(4)

      const unprefixed = hrefs.filter(
        (href) =>
          !CHROME_MACHINE_HREFS.test(href) && !/^\/(en|id)(\/|$)/.test(href)
      )

      expect(
        unprefixed,
        `${route} renders chrome links that are not localized pages: ${unprefixed.join(' ')}`
      ).toEqual([])
    })
  }

  test('Sanity Studio does not sit on a public page path', async ({
    request,
  }) => {
    // The rename is the fix, so it is the thing asserted: `/studio` must be
    // the studio page, and the CMS must be somewhere no page wants.
    const studio = await request.get('/en/studio')
    expect(studio.status()).toBe(200)
    expect(await studio.text()).not.toContain('<title>Sanity Studio</title>')

    const cms = await request.get('/cms')
    expect(cms.status()).toBe(200)
  })

  test('the catalogue publishes its items', async ({ request }) => {
    const html = await (await request.get('/en/work')).text()
    expect(html).toContain('CollectionPage')
    expect(html).toContain('ItemList')
  })
})
