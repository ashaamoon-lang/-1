import { expect, test } from '@playwright/test'

/**
 * The header is placed, not distributed — Tahap 87.
 *
 * ## The defect this exists for
 *
 * `components/layout/header` laid its four desktop items out with
 * `justify-content: space-between`, so each one sat wherever the leftover
 * space put it. Measured on the production build: the nav's centre ran
 * **138px left of the header's at 800 and 313px left at 1920**, its start
 * wandered across columns 4 and 5 by up to 59px, and the Indonesian labels
 * moved it again. The repo owner reported it from `/studio` as "not
 * symmetric, not placed where it belongs".
 *
 * ## What is held
 *
 * - The nav's centre is the header's centre, within a pixel.
 * - The wordmark and the language switcher sit exactly `--safe` in from the
 *   header's two edges — mirror images, on the same edges the content uses.
 * - No two items come closer than one `--gap`.
 *
 * Every desktop width from the breakpoint to a wide screen, in both locales,
 * because the old layout's position depended on both.
 *
 * ## Red-proof
 *
 * Against the `space-between` header: the centre assertion failed at every
 * width, by 138px at 800 up to 313px at 1920.
 *
 * Desktop only. Below 800px the nav is a disclosure and the header is a
 * different layout, which `responsive.e2e.ts` covers.
 */

const WIDTHS = [800, 1024, 1280, 1440, 1600, 1920] as const

test.describe('the header is balanced on its centre', () => {
  for (const path of ['/en', '/id'] as const) {
    test(`${path} at every desktop width`, async ({ page }) => {
      const faults: string[] = []

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)

        const g = await page.evaluate(() => {
          const header = document.querySelector('header')
          const box = (element: Element | null | undefined) => {
            if (!element) return null
            const rect = element.getBoundingClientRect()
            return { left: rect.left, right: rect.right }
          }
          const probe = document.createElement('div')
          probe.style.cssText =
            'position:absolute;visibility:hidden;width:var(--safe);height:var(--gap)'
          document.body.append(probe)
          const safe = probe.getBoundingClientRect().width
          const gap = probe.getBoundingClientRect().height
          probe.remove()
          return {
            header: box(header),
            brand: box(header?.querySelector(':scope > a')),
            nav: box(header?.querySelector('#header-nav ul')),
            search: box(header?.querySelector('[data-search-trigger]')),
            language: box(header?.querySelector('nav:not(#header-nav)')),
            safe,
            gap,
          }
        })

        const { header, brand, nav, search, language, safe, gap } = g
        if (!header || !brand || !nav || !search || !language) {
          faults.push(`${width}: a header item is missing`)
          continue
        }

        const centre = (header.left + header.right) / 2
        const navCentre = (nav.left + nav.right) / 2
        if (Math.abs(navCentre - centre) > 1) {
          faults.push(
            `${width}: nav centre ${navCentre.toFixed(0)} vs header centre ${centre.toFixed(0)} (${(navCentre - centre).toFixed(0)}px)`
          )
        }

        if (Math.abs(brand.left - (header.left + safe)) > 1) {
          faults.push(
            `${width}: wordmark starts at ${brand.left.toFixed(0)}, not ${safe}px in`
          )
        }
        if (Math.abs(header.right - safe - language.right) > 1) {
          faults.push(
            `${width}: language switcher ends at ${language.right.toFixed(0)}, not ${safe}px in from ${header.right.toFixed(0)}`
          )
        }

        const ordered = [brand, nav, search, language]
        for (let i = 1; i < ordered.length; i++) {
          const space = (ordered[i]?.left ?? 0) - (ordered[i - 1]?.right ?? 0)
          if (space < gap) {
            faults.push(
              `${width}: items ${i} and ${i + 1} are ${space.toFixed(0)}px apart, under one gap (${gap}px)`
            )
          }
        }
      }

      expect(faults, faults.join('\n')).toEqual([])
    })
  }

  /*
   * A nav one link longer still leaves the gap — Tahap 87.
   *
   * `next dev`, and any build with `NEXT_PUBLIC_STORYBOOK_URL` set, give the
   * nav a fourth link. With the first shape of the fix (`minmax(0, 1fr)`
   * outer tracks) that left the nav and the search trigger **1px apart** at
   * 800: the right-hand group outgrew its track and spilled into the gap.
   * CI sets no Storybook URL, so without this the gate would only ever see
   * three links and never ask.
   *
   * The link is cloned from the last real one, so it carries the real
   * typography and spacing. Only the gap is held here: when the content does
   * not fit symmetrically, the nav is allowed to give up centre — 14.6px at
   * `/en` 800, measured — rather than the space between items.
   */
  for (const path of ['/en', '/id'] as const) {
    test(`${path} with a fourth nav link still leaves every gap at 800`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 800, height: 900 })
      await page.goto(path)

      const spaces = await page.evaluate(() => {
        const list = document.querySelector('#header-nav ul')
        const last = list?.lastElementChild
        if (!list || !last) return null
        const extra = last.cloneNode(true)
        if (extra instanceof HTMLElement) {
          const link = extra.querySelector('a')
          if (link) link.textContent = 'Storybook ↗'
          list.append(extra)
        }
        const header = document.querySelector('header')
        const edges = [
          header?.querySelector(':scope > a'),
          list,
          header?.querySelector('[data-search-trigger]'),
          header?.querySelector('nav:not(#header-nav)'),
        ].map((element) => element?.getBoundingClientRect())
        const probe = document.createElement('div')
        probe.style.cssText =
          'position:absolute;visibility:hidden;height:var(--gap)'
        document.body.append(probe)
        const gap = probe.getBoundingClientRect().height
        probe.remove()
        return {
          gap,
          links: list.children.length,
          between: edges
            .slice(1)
            .map((rect, i) => (rect?.left ?? 0) - (edges[i]?.right ?? 0)),
        }
      })

      expect(spaces, 'the header nav was not found').not.toBeNull()
      expect(
        spaces?.links,
        'the fourth link was not added'
      ).toBeGreaterThanOrEqual(4)
      for (const [i, space] of (spaces?.between ?? []).entries()) {
        expect(
          space,
          `items ${i + 1} and ${i + 2} are ${space.toFixed(1)}px apart with four links`
        ).toBeGreaterThanOrEqual((spaces?.gap ?? 0) - 0.5)
      }
    })
  }
})
