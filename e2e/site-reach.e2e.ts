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
