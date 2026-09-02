import type { Browser } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { PRACTICES } from '../lib/content/practices'
import { routing } from '../lib/i18n/routing'

/**
 * The pages that must be readable with JavaScript switched off.
 *
 * Roadmap §1.5 lists this as an exit criterion and Tahap 3 marked it passed.
 * It was not passing — it was untested against content. With a seeded dataset
 * the home page rendered **28 characters**: "Skip to main content Loading".
 * The real markup was in the DOM, inside a `<div hidden>` that only an inline
 * script reveals, so a crawler that does not execute JavaScript saw one word.
 * The header was hidden too.
 *
 * The cause was a single `app/[locale]/loading.tsx`, which put a Suspense
 * boundary around every localized route including the ones that read no
 * request data at all. Moving it down to the segments that genuinely need it
 * took the home page from 28 characters to its full 1073.
 *
 * ## The catalogue is covered here now, and that took a route change
 *
 * Tahap 9 exempted `/work` and `/work/[slug]` from this file, on the grounds
 * that they read request data — `searchParams` and `draftMode()` — and
 * therefore had to keep a Suspense boundary. The exemption was honest about
 * the limitation and wrong about its necessity. Both reads were removable:
 *
 *   - `draftMode()` bought live preview of *unpublished* project edits, which
 *     `docs/PANDUAN-STUDIO.md` never taught and nothing depended on;
 *   - `searchParams` bought `?practice=`, which is now three static routes.
 *
 * Measured before the change: `/en/work/arus-balik` 28 characters,
 * `/en/work` its heading plus the word *Loading* and not one project. After:
 * 498 and 513, byte-identical to the JavaScript-enabled render. This file is
 * what stops that regressing, so it asserts on **project links**, not only
 * character counts — a fallback that grew a paragraph would satisfy a length
 * check while still showing no work.
 */

/** Enough text that the page is demonstrably rendering content, not a shell. */
const MIN_CHARS = 400

/**
 * Renders `path` in a context with no JavaScript runtime and reports what a
 * crawler would actually see.
 */
async function renderWithoutJavaScript(browser: Browser, path: string) {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    return await page.evaluate(() => {
      const text = (document.body.innerText || '').trim()
      return {
        chars: text.length,
        headings: document.querySelectorAll('h1').length,
        heading: document.querySelector('h1')?.textContent?.trim() ?? '',
        // Links into a project detail page — the catalogue's actual payload.
        // `/work/practice/…` is a filter view, not a work, so it is excluded.
        projectLinks: [
          ...document.querySelectorAll<HTMLAnchorElement>('a[href*="/work/"]'),
        ].filter((a) => !a.pathname.includes('/work/practice/')).length,
        // The chip the server marked active. Rendering this at all proves the
        // filter state came from the route rather than from a client effect.
        activeChip:
          document
            .querySelector('nav a[aria-current="true"]')
            ?.getAttribute('href') ?? null,
        text: text.slice(0, 120),
      }
    })
  } finally {
    await context.close()
  }
}

test.describe('readable without JavaScript', () => {
  for (const locale of routing.locales) {
    test(`/${locale} renders its content server-side`, async ({ browser }) => {
      const rendered = await renderWithoutJavaScript(browser, `/${locale}`)

      expect(rendered.chars, `only rendered: ${rendered.text}`).toBeGreaterThan(
        MIN_CHARS
      )
      expect(rendered.headings, 'exactly one h1').toBe(1)
    })

    test(`/${locale}/work lists work server-side`, async ({ browser }) => {
      const rendered = await renderWithoutJavaScript(browser, `/${locale}/work`)

      expect(rendered.chars, `only rendered: ${rendered.text}`).toBeGreaterThan(
        MIN_CHARS
      )
      expect(rendered.headings, 'exactly one h1').toBe(1)
      // The assertion that matters. A Suspense fallback has a heading and
      // prose; it has no links to individual works.
      expect(
        rendered.projectLinks,
        `catalogue rendered no project links: ${rendered.text}`
      ).toBeGreaterThan(0)
    })
  }

  for (const practice of PRACTICES) {
    test(`/en/work/practice/${practice} renders server-side`, async ({
      browser,
    }) => {
      const rendered = await renderWithoutJavaScript(
        browser,
        `/en/work/practice/${practice}`
      )

      // No `projectLinks` assertion: a practice the studio has not published
      // under yet legitimately renders the empty state, and this gate must not
      // fail on a truthful empty catalogue.
      expect(rendered.headings, 'exactly one h1').toBe(1)
      // What is asserted instead is the filter's own state. `aria-current` is
      // set from the route segment during the server render, so finding it on
      // the right chip proves both that this view is distinct from `/work`
      // and that its selected state survives with no JavaScript at all — the
      // property a client-side filter cannot have.
      expect(rendered.activeChip, 'active chip marks this practice').toBe(
        `/en/work/practice/${practice}`
      )
    })
  }

  test('a project page renders server-side', async ({ browser, request }) => {
    // Take a real slug from the sitemap rather than hardcoding one, so the
    // test does not silently pass against a dataset that no longer has it.
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const match = sitemap.match(
      /<loc>[^<]*?(\/en\/work\/(?!practice\/)[^<]+)<\/loc>/
    )
    test.skip(!match, 'no published project in the sitemap to check')

    const rendered = await renderWithoutJavaScript(browser, match?.[1] ?? '')

    expect(rendered.chars, `only rendered: ${rendered.text}`).toBeGreaterThan(
      MIN_CHARS
    )
    expect(rendered.headings, 'exactly one h1').toBe(1)
  })

  test('/en/ai renders its content server-side', async ({ browser }) => {
    const rendered = await renderWithoutJavaScript(browser, '/en/ai')

    // The machine view is the site's AEO surface. If anything must survive
    // without a JavaScript runtime it is this.
    expect(rendered.chars).toBeGreaterThan(MIN_CHARS)
  })
})
