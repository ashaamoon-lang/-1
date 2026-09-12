import { expect, test } from '@playwright/test'

import { FEATURED_WORK } from './fixtures'

/**
 * A plate that hands its image to the canvas must leave a hole to the canvas.
 *
 * ## The defect this exists for
 *
 * `vault/webgl/material-image` hides its DOM `<img>` once the mesh reports a
 * frame, and the mesh draws into **one fixed layer behind `<main>`**
 * (`lib/webgl/components/canvas/webgl.module.css`). So a plate is only visible
 * while nothing opaque sits over its box. Both halves are load-bearing and
 * only one of them lives in the component: the shell can do everything right
 * and still render an empty rectangle, because the occluder belongs to
 * whatever block is using it.
 *
 * That is not hypothetical. It has now happened **three times**:
 *
 *   - **Tahap 14**, on the home grid — the card's own placeholder covering the
 *     mesh, "measured `oklab(0.23 …)` covering the mesh completely, with no
 *     error and no failing gate". Fixed by `.media:has([data-material])`.
 *   - **Tahap 14**, same stage — the hero's background quad writing depth.
 *   - **Tahap 45 → 58 → 59**, on the project page — `project-hero` copied the
 *     opt-in from `project-card` and **did not copy the guard**, so its
 *     `.media` kept `background-color: var(--surface-2)`. Measured on the
 *     production build: the cover sampled `#201d1b` (the placeholder, oklab
 *     L 0.234) where the same artwork on `/en/work` sampled `#8d4725`.
 *
 * Tahap 58 spent five instrumented builds eliminating four hypotheses about
 * why the *mesh* was not drawing. The mesh was drawing. Nothing asked what was
 * painted over it.
 *
 * ## Why this does not take a screenshot
 *
 * The obvious gate compares rendered pixels, and `e2e/material-layer.e2e.ts`
 * records why that was tried and rejected: on a headless software renderer the
 * WebGL layer is present in some captures and absent from others, run to run,
 * with the page in an identical state. A flaky gate teaches you to re-run.
 *
 * But occlusion is not a rendering question — it is a **paint-order** question,
 * and paint order is in the CSSOM whether or not a GPU exists. So this reads
 * computed backgrounds, and it raises `data-material` **itself** rather than
 * waiting for a mesh to raise it. The contract under test is conditional —
 * *"if this plate hands its image over, is there a hole to the canvas?"* — so
 * asserting it against a forced attribute tests exactly the right thing and
 * makes the result identical on a workstation, in CI, and on a machine with no
 * WebGL at all.
 *
 * ## Where the walk stops, and why `<main>` is the boundary
 *
 * The canvas sits behind `<main>`, so everything from the shell up to and
 * including `<main>` must be transparent, and everything below it — the theme
 * ground, `<body>` — legitimately paints the page. Measured, 1440x900:
 *
 *   div.theme-module__ground    lab(4.43 0.587 1.35)   below the canvas, fine
 *   main                        rgba(0, 0, 0, 0)       boundary
 *   div.project-card__media     rgba(0, 0, 0, 0)       guarded
 *   div.project-hero__media     oklab(0.23352 …)       the defect
 */

/** Every route that mounts a material shell. */
const MATERIAL_ROUTES = ['/en', '/en/work', `/en/work/${FEATURED_WORK}`]

test.describe('material occlusion', () => {
  for (const route of MATERIAL_ROUTES) {
    test(`${route} leaves every handed-over plate a hole to the canvas`, async ({
      page,
    }) => {
      await page.goto(route, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)

      const findings = await page.evaluate(() => {
        /*
         * Opaque unless proven otherwise.
         *
         * `backgroundColor` computes to whatever colour space the author
         * wrote — this project authors in `oklch()` and derives with
         * `color-mix(in oklab, …)`, so the values here arrive as `oklab(…)`
         * and `lab(…)`, not as `rgb()`. An earlier draft of this walk matched
         * only `rgba?()` and reported **zero occluders on the page that was
         * visibly broken**. Defaulting to opaque means a colour space nobody
         * has thought of yet produces a false red, which is the direction a
         * gate should fail in.
         */
        const transparent = (value: string): boolean => {
          if (value === 'transparent' || value === '') return true
          const slash = value.match(/\/\s*([\d.]+%?)\s*\)/)
          if (slash?.[1] !== undefined) return Number.parseFloat(slash[1]) === 0
          const rgba = value.match(/^rgba?\(([^)]+)\)$/)
          if (rgba?.[1] !== undefined) {
            const parts = rgba[1].split(',').map((n) => Number.parseFloat(n))
            return parts.length === 4 && parts[3] === 0
          }
          return false
        }

        const results: {
          index: number
          occluders: { tag: string; cls: string; bg: string }[]
        }[] = []

        const shells = [...document.querySelectorAll('[data-material-shell]')]

        shells.forEach((shell, index) => {
          // Raise the state ourselves: the question is conditional, and a
          // headless runner may never mount a mesh to raise it for us.
          const had = shell.hasAttribute('data-material')
          if (!had) shell.setAttribute('data-material', '')

          const occluders: { tag: string; cls: string; bg: string }[] = []
          let el: Element | null = shell
          while (el) {
            const bg = getComputedStyle(el).backgroundColor
            if (!transparent(bg)) {
              occluders.push({
                tag: el.tagName.toLowerCase(),
                cls: String((el as HTMLElement).className).slice(0, 40),
                bg,
              })
            }
            if (el.tagName === 'MAIN') break
            el = el.parentElement
          }

          if (!had) shell.removeAttribute('data-material')
          results.push({ index, occluders })
        })

        return { shellCount: shells.length, results }
      })

      expect(
        findings.shellCount,
        `${route} is listed as a material route but renders no material shells`
      ).toBeGreaterThan(0)

      for (const plate of findings.results) {
        expect(
          plate.occluders.map((o) => `${o.tag}.${o.cls} → ${o.bg}`),
          `plate ${plate.index} on ${route} hands its image to the canvas, but something opaque is painted over its box — the plate will render as that flat colour`
        ).toEqual([])
      }
    })
  }
})
