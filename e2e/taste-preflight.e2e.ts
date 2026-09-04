import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * The `taste-skill` pre-flight, made mechanical — Tahap 34.
 *
 * ## Why this file exists
 *
 * `.claude/skills/taste-skill/SKILL.md` §14 ships a sixty-box pre-flight
 * check and says, in bold, that it is not optional. A checklist a human reads
 * is a checklist a human skips: this project already learned that three
 * separate times, in stages where every gate was green and the page was still
 * wrong.
 *
 * So the boxes that are **mechanical and apply here** become assertions.
 * `docs/stages/TAHAP-34.md` §5 lists which rules were adopted and the defect
 * each closes; §6 lists the five that were rejected and why. This file holds
 * only the adopted ones.
 *
 * ## What was measured before a line of it was fixed
 *
 * Every assertion below went red against the site as it stood on 2026-09-04:
 *
 * | box                        | measured                                        |
 * | -------------------------- | ----------------------------------------------- |
 * | zero em-dashes in copy     | 6 (`messages/en.json`), 8 (`id.json`), 4 more in `lib/seo/site.ts` |
 * | nav height <= 80px         | `--header-height` desktop = **98px**             |
 * | zero scroll cues           | `home.scrollCue` renders at `hero/index.tsx:168` |
 * | hero <= 4 text elements    | **5** — index, headline, subline, CTA, cue       |
 * | eyebrow <= ceil(n/3)       | 33 `text-transform: uppercase` declarations repo-wide, six different letter-spacings |
 *
 * ## What is deliberately NOT here
 *
 * - **Button and form contrast.** `axe-core` already runs WCAG 2.2 AA on
 *   every route in `route-sweep.e2e.ts`, and colour-contrast is one of its
 *   rules. A second, worse implementation of the same check is not coverage.
 * - **One corner-radius system.** There is no radius token yet — eighteen
 *   distinct `border-radius` declarations ship. Asserting a number before the
 *   token exists would be picking one arbitrarily. It lands with the radius
 *   token in Tahap 37.
 * - **The judgement boxes** (serif discipline, premium-consumer palette,
 *   bento rhythm, "motion motivated"). They cannot be counted, and pretending
 *   otherwise is how a gate starts lying.
 */

const JOURNAL_ENTRY = 'scope-is-the-deliverable'

/** Every route a person reads, in both locales where the content differs. */
const ROUTES = [
  '/en',
  '/id',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  '/en/practice/consulting',
  '/en/studio',
  '/en/journal',
  `/en/journal/${JOURNAL_ENTRY}`,
]

async function settle(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  // Entrance motion is choreographed up to 1200ms; measure the settled page.
  await page.waitForTimeout(1600)
}

/*
 * The em-dash rule is NOT here, and that is a design decision.
 *
 * It was here first, and it worked: it went red on all eight routes and drove
 * out eighteen em-dashes across `messages/`, `lib/content/`, `lib/seo/` and
 * the fixture seed. Then it stayed red on one string that this file cannot
 * honestly own — the home page's subline is served from Sanity, and a gate
 * that fails the build because someone wrote an em-dash in the CMS makes CI
 * depend on mutable external content the studio, not this repo, is
 * responsible for.
 *
 * So the rule moved to `lib/styles/scripts/taste-rules.test.ts`, where it is
 * strictly stronger: it reads every string this repo ships, including copy
 * that reaches no route yet, needs no server, and cannot be flaked by a CMS
 * write. That is the same source-versus-DOM split `motion-rules.test.ts`
 * already draws.
 *
 * What that gives up is real and is written down rather than glossed:
 * nothing now fails when studio-authored CMS copy carries an em-dash.
 * `docs/stages/TAHAP-34.md` §9 records the one string that is still live.
 */

test.describe('taste pre-flight: hard layout rules', () => {
  test('the header is one line and no taller than 80px at desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await settle(page, '/en')

    const header = page.locator('header').first()
    const box = await header.boundingBox()
    expect(box).not.toBeNull()

    // 80px is `taste-skill` SKILL.md section 4.7. At 816px design height a
    // 98px header eats 12% of the viewport before any content is reached.
    expect(
      box?.height ?? 0,
      'nav height cap: `--header-height` in lib/styles/layout.mjs'
    ).toBeLessThanOrEqual(80)

    /*
     * Single line, measured as one band rather than one `top` value.
     *
     * The first shape bucketed every control's `top` into 8px bins and
     * demanded one bucket. It failed on a header that is plainly one line:
     * the wordmark sits at 26, the anchors at 28, the search trigger at 20
     * and the language switcher at 14, because they are different heights
     * centred in the same 72px bar. It also read the mobile `Menu` toggle at
     * `top: 0` — `display: none` elements report a zero rect.
     *
     * What "two-line nav" actually means is that the controls no longer fit
     * in the bar's own height. So: visible controls only, and their combined
     * vertical extent must not exceed the header.
     */
    const band = await header.evaluate((el) => {
      const rects = [...el.querySelectorAll('a, button')]
        .filter((child) => (child as HTMLElement).offsetParent !== null)
        .map((child) => child.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0)

      return {
        counted: rects.length,
        extent: rects.length
          ? Math.max(...rects.map((r) => r.bottom)) -
            Math.min(...rects.map((r) => r.top))
          : 0,
        header: el.getBoundingClientRect().height,
      }
    })

    // Anti-vacuum: a header with no visible controls must not pass.
    expect(band.counted).toBeGreaterThan(2)
    expect(
      band.extent,
      'a two-line nav at desktop is broken design'
    ).toBeLessThanOrEqual(band.header)
  })

  for (const path of ['/en', '/id']) {
    test(`${path} hero holds at most four text elements`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, path)

      const count = await page.evaluate(() => {
        const hero = document.querySelector('[data-epic="hero-arrival"]')
        if (!hero) return -1
        // The stack `taste-skill` counts: eyebrow-or-brand-strip, headline,
        // subtext, CTAs. Everything the hero reveals as its own beat is one
        // of those, plus the headline, which reveals through SplitText.
        const beats = hero.querySelectorAll('[data-reveal-item]').length
        const headline = hero.querySelector('h1') ? 1 : 0
        return beats + headline
      })

      // Anti-vacuum: a hero that was not found reports -1, not 0.
      expect(count).toBeGreaterThan(0)
      expect(
        count,
        'hero stack discipline: the hero is a single moment, not a feature list'
      ).toBeLessThanOrEqual(4)
    })
  }

  for (const path of ROUTES) {
    test(`${path} shows no scroll cue`, async ({ page }) => {
      await settle(page, path)

      const cues = await page.evaluate(() => {
        const pattern = /^(scroll|gulir)\b/i
        /*
         * Direct text nodes, not `textContent`, and not "leaf elements only".
         *
         * The first shape of this required `children.length === 0`, and it
         * passed on `/en` while the cue was right there: the hero's cue is a
         * `<p>` holding the word and a decorative `<span>` rule, so it is not
         * a leaf and was skipped. Reading each element's own text nodes finds
         * the word wherever it is spelled.
         */
        const own = (el: Element) =>
          [...el.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent ?? '')
            .join('')
            .trim()

        return [...document.querySelectorAll('main *, header *')]
          .map(own)
          .filter((text) => text.length > 0 && text.length < 30)
          .filter((text) => pattern.test(text))
      })

      expect(
        cues,
        'a scroll cue tells the reader something the page already tells them'
      ).toEqual([])
    })
  }

  for (const path of ROUTES) {
    test(`${path} keeps eyebrows under the ceiling`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, path)

      const counted = await page.evaluate(() => {
        const main = document.querySelector('main')
        if (!main) {
          return { eyebrows: 0, sections: -1, found: false, samples: [] }
        }

        /*
         * Sections are counted inside `<main>` only, and with a floor of 1.
         *
         * Counting `document` instead was the first shape, and it was wrong
         * in the flattering direction: the footer is built from four
         * `<section>` elements, so every page got four free sections and a
         * ceiling of two eyebrows it had not earned.
         *
         * The floor of 1 exists because two routes genuinely have neither.
         * `/en/work` and `/en/work/<slug>` render **zero `<section>` and zero
         * `<h2>` inside `<main>`** — measured, not assumed. A page with no
         * declared structure does not get a larger eyebrow allowance for
         * having none; it gets the smallest one. The structure itself is
         * Tahap 40's problem, not this gate's.
         */
        const sections = Math.max(
          main.querySelectorAll('section').length,
          main.querySelectorAll('h2').length,
          1
        )
        const samples: string[] = []
        let eyebrows = 0

        /*
         * An eyebrow is not "any uppercase text". SKILL.md section 4.7
         * defines it precisely: "the small uppercase wide-tracking label
         * sitting **above a section headline**". Both halves matter, and the
         * first shape of this only checked the first half — it reported five
         * on the project page, of which four were `Client / Year / Engagement
         * / Scope`, the `<dt>` labels of a metadata `<dl>`, and it counted
         * the home page's `See the work` button.
         *
         * Those are the pattern the rule *endorses* (mono carrying metadata,
         * `docs/TEARDOWN.md` section 4), not the templated rhythm it bans. So
         * a candidate only counts when a heading follows it closely in
         * document order.
         */
        const order = [...main.querySelectorAll('*')]
        const isHeading = (el: Element) => /^H[1-3]$/.test(el.tagName)

        order.forEach((el, index) => {
          if (el.children.length > 0) return
          const text = (el.textContent ?? '').trim()
          if (!text || text.length > 40) return

          const style = getComputedStyle(el)
          if (style.textTransform !== 'uppercase') return

          // Plain uppercase with no tracking is a word someone typed.
          const tracking = Number.parseFloat(style.letterSpacing)
          if (!Number.isFinite(tracking) || tracking < 1) return

          // Sitting above a headline.
          if (!order.slice(index + 1, index + 4).some(isHeading)) return

          /*
           * A label on an item in a collection is metadata, not a section
           * eyebrow. The rule's unit is the section: "Every AI-built site
           * puts an eyebrow above EVERY section header, producing the same
           * templated rhythm." A journal index whose rows each carry their
           * practice is doing the opposite of templating; it is telling the
           * reader which row is which.
           *
           * Stated plainly because this exclusion took `/en/journal` from red
           * to green: 4 over 3 sections became 1. That is the rule being read
           * correctly, not the gate being tuned until it passed. `/en`, `/id`
           * and `/en/practice/<value>` stay red, and they are the real
           * finding.
           */
          if (el.closest('li, article')) return

          eyebrows += 1
          if (samples.length < 8) samples.push(text)
        })

        return { eyebrows, sections, found: true, samples }
      })

      // Anti-vacuum: a page whose `<main>` was never found must not pass.
      expect(counted.found).toBe(true)
      expect(counted.sections).toBeGreaterThan(0)

      const ceiling = Math.ceil(counted.sections / 3)
      expect(
        counted.eyebrows,
        `${counted.eyebrows} eyebrows over ${counted.sections} sections (ceiling ${ceiling}): ${counted.samples.join(' / ')}`
      ).toBeLessThanOrEqual(ceiling)
    })
  }
})

test.describe('taste pre-flight: consistency locks', () => {
  for (const path of ROUTES) {
    test(`${path} runs one theme`, async ({ page }) => {
      await settle(page, path)

      const themes = await page.evaluate(() => {
        const values = [...document.querySelectorAll('[data-theme]')].map(
          (el) => el.getAttribute('data-theme') ?? ''
        )
        return { distinct: [...new Set(values)], counted: values.length }
      })

      expect(themes.counted).toBeGreaterThan(0)
      expect(
        themes.distinct.length,
        'page theme lock: the reader must not feel they walked into a different website mid-scroll'
      ).toBe(1)
    })
  }

  for (const path of ROUTES) {
    test(`${path} offers one contact intent`, async ({ page }) => {
      await settle(page, path)

      const labels = await page.evaluate(() =>
        [
          ...new Set(
            [...document.querySelectorAll('a[href^="mailto:"]')]
              .map((el) => (el.textContent ?? '').trim().toLowerCase())
              .filter((text) => text.length > 0)
          ),
        ].sort()
      )

      expect(
        labels.length,
        `two CTAs with the same intent is a fail: ${labels.join(' / ')}`
      ).toBeLessThanOrEqual(1)
    })
  }

  for (const path of ROUTES) {
    test(`${path} does not wrap a CTA label`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await settle(page, path)

      const wrapped = await page.evaluate(() => {
        const hits: string[] = []
        let counted = 0
        for (const el of document.querySelectorAll<HTMLElement>(
          '[data-press="cta"], [data-press="email"], [data-press="chip"]'
        )) {
          counted += 1
          const lines = el.getClientRects().length
          if (lines > 1) hits.push(`${el.textContent?.trim()} (${lines} lines)`)
        }
        return { hits, counted }
      })

      expect(wrapped.counted).toBeGreaterThanOrEqual(0)
      expect(
        wrapped.hits,
        'a CTA label that wraps to two lines is a broken button, not a long label'
      ).toEqual([])
    })
  }

  for (const path of ROUTES) {
    test(`${path} runs at most one marquee`, async ({ page }) => {
      await settle(page, path)

      const marquees = await page.evaluate(
        () =>
          document.querySelectorAll('[class*="marquee"], [data-marquee]').length
      )

      expect(
        marquees,
        'two horizontal scrolling strips on one page reads as filler'
      ).toBeLessThanOrEqual(1)
    })
  }
})
