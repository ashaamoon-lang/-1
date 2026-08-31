import { expect, test } from '@playwright/test'

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
 * request data at all. Moving it down to the four segments that genuinely
 * need it took the home page from 28 characters to its full 1073.
 *
 * ## What this deliberately does not assert
 *
 * `/[locale]/work` reads `searchParams` and the project pages read
 * `draftMode()`. Both are request data by definition, so both keep the
 * boundary and still show the fallback without JavaScript. That is a real
 * limitation, recorded in `docs/stages/TAHAP-9.md` rather than hidden by
 * choosing softer routes here — every work is individually listed in the
 * sitemap, so nothing becomes undiscoverable.
 */

/** Enough text that the page is demonstrably rendering content, not a shell. */
const MIN_CHARS = 400

test.describe('readable without JavaScript', () => {
  for (const locale of routing.locales) {
    test(`/${locale} renders its content server-side`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false })
      const page = await context.newPage()

      await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' })

      const rendered = await page.evaluate(() => ({
        chars: (document.body.innerText || '').trim().length,
        headings: document.querySelectorAll('h1').length,
        text: (document.body.innerText || '').trim().slice(0, 80),
      }))

      await context.close()

      expect(rendered.chars, `only rendered: ${rendered.text}`).toBeGreaterThan(
        MIN_CHARS
      )
      expect(rendered.headings, 'exactly one h1').toBe(1)
    })
  }

  test('/en/ai renders its content server-side', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('/en/ai', { waitUntil: 'domcontentloaded' })
    const chars = await page.evaluate(
      () => (document.body.innerText || '').trim().length
    )
    await context.close()

    // The machine view is the site's AEO surface. If anything must survive
    // without a JavaScript runtime it is this.
    expect(chars).toBeGreaterThan(MIN_CHARS)
  })
})
