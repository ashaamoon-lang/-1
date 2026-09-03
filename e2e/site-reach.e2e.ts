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
