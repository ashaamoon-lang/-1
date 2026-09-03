import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import { PRACTICES } from '../lib/content/practices'
import { grain, legibility, tone } from '../lib/styles/scripts/luminance'
import { material } from '../vault/motion/tokens'
import { FEATURED_WORK } from './fixtures'
/**
 * The bucket the WebGL hook below fills, declared rather than asserted at each
 * use — three chained `as unknown as` casts is how a test starts lying about
 * what it measured.
 */
declare global {
  interface Window {
    __shear?: number[]
  }
}

/**
 * What a reader actually sees, measured rather than inferred.
 *
 * ## The class of defect this exists for
 *
 * Every other gate here reads the DOM, the network, or the source. None had
 * ever looked at where content sits or what a surface renders as, and two
 * defects shipped through that gap:
 *
 *   - **Tahap 17.** The hero's WebGL wash rendered *darker* than the page
 *     behind it — mean luminance 4.0/255 against the ground's 15.5. Every
 *     gate was green. "Is there a canvas" and "does the canvas draw something
 *     worth drawing" are different questions, and only the second one matters
 *     to a reader.
 *   - **Tahap 18.** Every practice page rendered its content flush against
 *     the viewport edge — `h1` at x=0 while the header's wordmark sat at 14 —
 *     on three routes, both viewports, both languages. Nothing asked where
 *     content starts.
 *
 * ## What this cannot catch
 *
 * Composition. A page can have a correct gutter, a correct tonal range, and
 * still be badly arranged; that judgement needs eyes, and
 * `docs/stages/TAHAP-18.md` records the pass that used them. This gate holds
 * the two properties that turned out to be mechanically checkable.
 */

const GUTTER_ROUTES = [
  '/en',
  '/en/work',
  `/en/work/${FEATURED_WORK}`,
  ...PRACTICES.map((value) => `/en/practice/${value}`),
  '/id',
]

/*
 * `/ai` is deliberately excluded, and the exemption is the point rather than
 * an oversight: `app/[locale]/ai/layout.tsx` bypasses the app's normal layout
 * on purpose — it is a plain-HTML index for crawlers and agents, and its own
 * stylesheet says so. A rule about the site's chrome should not be applied to
 * the one page that deliberately has none.
 */

/**
 * How far a measured gutter may drift from the header's own.
 *
 * Not zero: the wordmark is a link with its own box, and sub-pixel layout at
 * fractional viewport widths moves things by a hair. Measured across the six
 * routes above, every correct page matched exactly; 2px leaves room for the
 * rounding without admitting a page that forgot its padding entirely.
 */
const GUTTER_TOLERANCE = 2

/*
 * The `h1` alone, and that is the instrument being corrected rather than the
 * page.
 *
 * The first version also measured the first `<p>` in document order as "body
 * copy". On the home page that is the hero's practice index, which is
 * deliberately right-aligned — 851px against the header's 14 — so the gate
 * went red against a correct design while it was going red against three
 * genuinely broken pages. A heading is unambiguous: every page has exactly
 * one, and it always sits in that page's main column.
 */
async function gutters(page: Page) {
  return page.evaluate(() => {
    const leftOf = (element: Element | null) =>
      element ? Math.round(element.getBoundingClientRect().left) : null

    return {
      chrome: leftOf(document.querySelector('header a')),
      heading: leftOf(document.querySelector('h1')),
    }
  })
}

test.describe('the page starts where its own chrome starts', () => {
  for (const route of GUTTER_ROUTES) {
    test(`${route} keeps its gutter`, async ({ page }) => {
      await page.goto(route)
      await page.waitForTimeout(1800)

      const measured = await gutters(page)

      expect(measured.chrome, `${route} rendered no header link`).not.toBeNull()
      expect(measured.heading, `${route} rendered no h1`).not.toBeNull()

      const chrome = measured.chrome ?? 0
      expect(
        Math.abs((measured.heading ?? 0) - chrome),
        `${route}: the heading starts at ${measured.heading}px while the header starts at ${chrome}px — the page is missing its horizontal padding`
      ).toBeLessThanOrEqual(GUTTER_TOLERANCE)
    })
  }
})

/**
 * How much more modulation a live accent must add over the same page with the
 * canvas hidden.
 *
 * Both assertions below are **differences between two shots of the same
 * page**, which is what makes them robust: the text, the layout and the
 * screenshot pipeline are identical in each arm, so they cancel, and what is
 * left is the accent's own contribution. An absolute floor would have to be
 * retuned for every viewport and would drift between machines.
 *
 * Measured on `/en` at 1280x800 with the pipeline correct: mean 30.2 against
 * 15.5 with the canvas hidden, tonal range 13.9 against 0.0. Before the Tahap
 * 17 fix the same shot gave mean **4.0** — below the hidden arm, which is the
 * defect stated as a number. The margin is set well under the measured
 * headroom so a legitimate retune of the wash does not trip it.
 */
const ACCENT_RANGE_MARGIN = 3

/*
 * Every route that declares an accent, not just the one that found the bug.
 *
 * `/en` carries the WebGL wash; a practice page carries the same gradient in
 * CSS, because `e2e/route-budget.e2e.ts` allows three.js on exactly one route
 * and this is deliberately not it. Both are "a region the design says should
 * carry tone", so both answer to the same two questions.
 */
const ACCENT_ROUTES = ['/en', `/en/practice/${PRACTICES[0]}`]

test.describe('a declared accent carries tone, and never subtracts it', () => {
  for (const [width, height, label] of [
    [1280, 800, 'desktop'],
    [390, 844, 'mobile'],
  ] as const) {
    for (const route of ACCENT_ROUTES) {
      test(`${route} at ${label}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        await page.goto(route)
        await page.waitForTimeout(2800)

        const region = page.locator('[data-accent-region]').first()
        await expect(
          region,
          `${route} declares no accent region`
        ).toBeAttached()

        /*
         * Which control to remove depends on which accent is showing, and both
         * are real: `lib/hooks/use-device-detection` gates WebGL on
         * `supportsWebGL && isDesktop`, so a phone gets the CSS fallback
         * gradient by design, not by failure.
         *
         * A live mesh draws into the shared root canvas, not into the region's
         * own box, so hiding the region would leave it painting. The fallback is
         * the opposite: it *is* the region's background. Removing the wrong one
         * would compare a page with itself and pass no matter what — a gate that
         * cannot fail.
         */
        const live = (await page.locator('[data-accent-live]').count()) > 0

        /*
         * A band of the region, not the whole of it. The clip has to sit inside
         * the viewport for both arms to be comparable, and the region is a
         * fixed, full-screen layer.
         */
        const clip = {
          x: 0,
          y: Math.round(height * 0.15),
          width,
          height: Math.round(height * 0.35),
        }

        const withAccent = await page.screenshot({ clip })
        await page.evaluate((hasMesh: boolean) => {
          const target = hasMesh
            ? document.querySelector('canvas')
            : document.querySelector('[data-accent-region]')
          if (target instanceof HTMLElement) target.style.visibility = 'hidden'
        }, live)
        await page.waitForTimeout(600)
        const withoutAccent = await page.screenshot({ clip })

        const lit = await tone(withAccent)
        const bare = await tone(withoutAccent)

        // The defect that shipped, written as an invariant. The hero's wash
        // rendered at 4.0 against a ground of 15.5 — the page was better off
        // with its own decoration switched off.
        expect(
          lit.mean,
          `the accent made the page darker: ${lit.mean.toFixed(1)} with it, ${bare.mean.toFixed(1)} without`
        ).toBeGreaterThan(bare.mean)

        // And it has to do something, not merely lift the whole band evenly.
        expect(
          lit.range,
          `the accent added no modulation: range ${lit.range.toFixed(1)} with it, ${bare.range.toFixed(1)} without`
        ).toBeGreaterThan(bare.range + ACCENT_RANGE_MARGIN)

        // Grain is texture, not noise. Tahap 17 measured 21.0/255 — 77% of the
        // band's own mean — after the colour pipeline was corrected, because the
        // value had been tuned against the broken one.
        const texture = await grain(withAccent, {
          left: 40,
          top: 20,
          width: 96,
          height: 96,
        })
        expect(
          texture,
          `grain reads as static rather than texture: sd ${texture.toFixed(1)}/255`
        ).toBeLessThan(12)
      })
    }
  }
})

/**
 * How much of a region actually changed between two full-page screenshots.
 *
 * Full frames cropped afterwards, never `page.screenshot({ clip })`: a clipped
 * capture **does not composite WebGL**, which `docs/stages/TAHAP-14.md`
 * recorded and Tahap 21 walked into again — the first measurement returned
 * zero in both arms, which looked like a finding and was an instrument.
 */
interface Region {
  left: number
  top: number
  width: number
  height: number
}

async function moved(
  before: Buffer,
  after: Buffer,
  region: Region
): Promise<number> {
  const a = await sharp(before).extract(region).raw().toBuffer()
  const b = await sharp(after).extract(region).raw().toBuffer()
  let count = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i += 3) {
    if (Math.abs((a[i] ?? 0) - (b[i] ?? 0)) > 2) count++
  }
  return (count / (n / 3)) * 100
}

/**
 * Everything this pair of gates needs before it can measure anything: the
 * plate on screen, the cursor excluded, and a window derived from the plate.
 *
 * ## Why the cursor has to go
 *
 * It is a DOM layer that follows the pointer, so sweeping it across the
 * measured window changes those pixels whether or not the material does
 * anything. That is not hypothetical: the first version of this gate reported
 * **2.6% for "the pointer moves the material"** while the material was in fact
 * frozen. The number was the ring.
 *
 * Hidden by its own class, so the canvas keeps drawing — an earlier attempt
 * hid every fixed `pointer-events: none` element and caught the canvas wrapper
 * too, which made every arm read zero by construction. Both failures are
 * asserted against below rather than remembered.
 */
async function readyPlate(page: Page) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/en')
  await page.waitForTimeout(2500)

  const shell = page.locator('[data-material-shell]').first()
  await shell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2200)

  const canvases = await page.locator('canvas').count()
  const live = await page.locator('[data-material]').count()
  test.skip(
    canvases === 0 || live === 0,
    'no live material mesh on this device profile — WebGL is gated to desktop'
  )

  const hidden = await page.evaluate(() => {
    let n = 0
    for (const el of document.querySelectorAll('[class*="cursor-module"]')) {
      if (el instanceof HTMLElement) {
        el.style.visibility = 'hidden'
        n++
      }
    }
    return n
  })

  /*
   * Not "at least one was hidden": the cursor is gated on `pointer: fine`, so
   * a touch profile renders none and there is correctly nothing to exclude.
   * What must hold either way is that none is left visible.
   */
  expect(
    await page.evaluate(
      () =>
        [...document.querySelectorAll('[class*="cursor-module"]')].filter(
          (el) => getComputedStyle(el).visibility !== 'hidden'
        ).length
    ),
    `${hidden} cursor nodes hidden, but one is still visible — its movement would be measured as the material's`
  ).toBe(0)

  expect(
    await page.evaluate(
      () => getComputedStyle(document.querySelector('canvas')!).visibility
    ),
    'the control hid the canvas, so every measurement below would read zero'
  ).toBe('visible')

  const box = await shell.boundingBox()
  expect(box, 'no material plate to measure').not.toBeNull()

  /*
   * The window is derived from the plate, not hardcoded — twice over.
   *
   * `boundingBox()` is in CSS pixels and a screenshot is in device pixels, so
   * a fixed window addressed the header instead of the plate at any DPR above
   * 1. And it included the plate's border, which the shader's edge falloff
   * deliberately holds still — measuring the one part designed not to move.
   * Inset well past that falloff (12% per axis, `shaders.ts`).
   */
  const dpr = await page.evaluate(() => window.devicePixelRatio)
  const inset = 0.18
  return {
    box: box!,
    region: {
      left: Math.round((box!.x + box!.width * inset) * dpr),
      top: Math.round((box!.y + box!.height * inset) * dpr),
      width: Math.round(box!.width * (1 - inset * 2) * dpr),
      height: Math.round(box!.height * (1 - inset * 2) * dpr),
    },
  }
}

/*
 * Desktop only, and stated rather than arranged by accident.
 *
 * This file runs at both viewports because the gutter defect it was built for
 * existed at both. These two claims do not: WebGL is gated on `supportsWebGL
 * && isDesktop`, and `docs/stages/TAHAP-21.md` §6.3 says in as many words that
 * the stage makes the material reachable by desktop readers who scroll and
 * does **not** put it on a phone. Forcing the mobile project wide enough to
 * mount a canvas produces a configuration no reader has, where the surface
 * grain alone changes 34% of device pixels between any two frames — measured.
 */
test.describe('the material is a material, not a picture', () => {
  test.skip(
    () => test.info().project.name !== 'desktop',
    'the material is gated to desktop — TAHAP-21 §6.3'
  )

  test('the plate is not frozen', async ({ page }) => {
    test.setTimeout(120_000)
    const { region } = await readyPlate(page)

    await page.mouse.move(20, 20)
    await page.waitForTimeout(1800)
    const first = await page.screenshot()
    await page.waitForTimeout(1500)
    const second = await page.screenshot()

    /*
     * The whole claim, and the reason it is a separate test from the one
     * below: this is the defect that actually shipped.
     *
     * Tahap 14 gated the material's **existence** — a canvas mounts, a mesh
     * draws, the texture binds, no GPU objects leak. All green, all true, and
     * none of it asked whether the material *moved*. It did not: every
     * per-frame uniform was written to an object three was not rendering from,
     * so the plate drew frame zero's values forever. Measured before the fix,
     * with the cursor excluded: **0.00%** here, under a pointer sweep, and
     * while scrolling. Measured after: 0.66-2.99% from the ambient drift alone.
     *
     * Nobody is touching anything during this test. A still plate on a still
     * page must still be alive, or `material.drift` is decoration in a comment.
     */
    const alive = await moved(first, second, region)
    expect(
      alive,
      `nothing changed on the plate over 1.5s with nobody touching it — the material is drawing, but frozen (this is exactly how it shipped in Tahap 14)`
    ).toBeGreaterThan(0)
  })

  test('scrolling reaches the shader, and stays quieter than the pointer', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    /*
     * Measured at the uniform, not at the pixel, and that is the point.
     *
     * A pixel comparison cannot carry this claim here, and three attempts
     * proved it rather than assumed it. The shear decays on a 133ms time
     * constant while a CDP screenshot lands 50-150ms after the scroll ends, so
     * the shutter catches a third of the amplitude at best; against the ambient
     * drift's own contribution over the same span the ordering flipped between
     * runs (still 2.99% vs scroll 2.45% on the third). A flaky gate is worse
     * than none.
     *
     * `gl.uniform1f` is not noisy. It is also the exact layer the defect lived
     * at — pre-fix, `uShear` reached the GPU once, as 0, for the life of the
     * page — so this gate fails on the real bug rather than near it.
     */
    await page.addInitScript(() => {
      const bucket: number[] = []
      window.__shear = bucket
      const names = new WeakMap<object, string>()
      for (const proto of [
        WebGLRenderingContext.prototype,
        WebGL2RenderingContext.prototype,
      ]) {
        const locate = proto.getUniformLocation
        proto.getUniformLocation = function (
          program: WebGLProgram,
          name: string
        ) {
          const location = locate.call(this, program, name)
          if (location) names.set(location, name)
          return location
        }
        const write = proto.uniform1f
        proto.uniform1f = function (
          location: WebGLUniformLocation | null,
          value: number
        ) {
          if (
            location &&
            names.get(location) === 'uShear' &&
            bucket.length < 5000
          ) {
            bucket.push(value)
          }
          return write.call(this, location, value)
        }
      }
    })

    await readyPlate(page)
    const anchor = await page.evaluate(() => Math.round(window.scrollY))

    const peakSince = async (run: () => Promise<void>) => {
      await page.evaluate(() => {
        if (window.__shear) window.__shear.length = 0
      })
      await run()
      const seen = await page.evaluate(() => window.__shear ?? [])
      expect(
        seen,
        'the WebGL hook never installed, so nothing below is measuring the shader'
      ).toBeDefined()
      return seen.reduce((peak, v) => Math.max(peak, Math.abs(v)), 0)
    }

    // Standing still: whatever the reader is not doing, the surface is at rest.
    const idle = await peakSince(async () => {
      await page.waitForTimeout(1200)
    })

    /*
     * 600px in 400ms is 1500px/s at any frame rate, which saturates
     * `shearVelocity`; 400ms is three time constants, so the exponential is
     * ~95% of the way there. Time-based rather than frame-based on purpose:
     * headless runs at ~18fps here, and a per-frame step sized for 60fps
     * reached a third of the intended velocity — measuring the harness.
     */
    const scrolling = await peakSince(async () => {
      await page.evaluate(
        async ({ to, distance, ms }) => {
          window.scrollTo(0, to + distance)
          await new Promise((resolve) => setTimeout(resolve, 500))
          const from = to + distance
          const started = performance.now()
          await new Promise<void>((resolve) => {
            const step = () => {
              const t = Math.min(1, (performance.now() - started) / ms)
              window.scrollTo(0, Math.round(from - distance * t))
              if (t < 1) requestAnimationFrame(step)
              else resolve()
            }
            requestAnimationFrame(step)
          })
        },
        { to: anchor, distance: 600, ms: 400 }
      )
    })

    const report = `idle ${idle.toExponential(2)} | scrolling ${scrolling.toFixed(5)} | token ${material.shear}`

    expect(
      scrolling,
      `scrolling never reached the shader (${report}) — a reader who scrolls does not meet the material`
    ).toBeGreaterThan(0)

    expect(
      idle,
      `the surface is not at rest when nobody is scrolling (${report})`
    ).toBeLessThan(material.shear * 0.05)

    /*
     * The ladder, asserted where the amplitudes are real numbers rather than
     * declarations: drift < shear < displacement, `vault/motion/tokens.ts`.
     * `tokens.test.ts` holds the declared ordering; this holds that the running
     * code never exceeds what it declared.
     */
    expect(
      scrolling,
      `the shear ran past its own token (${report})`
    ).toBeLessThanOrEqual(material.shear + 1e-9)

    expect(
      scrolling,
      `the ambient input is not staying quieter than the deliberate one (${report})`
    ).toBeLessThan(material.displacement)
  })
})

/**
 * How much of the canvas-free legibility a canvas route's footer must keep.
 *
 * Measured on `/en` at 1280×800, the footer band's p99 (the brightest glyph
 * pixels):
 *
 *   - **broken**: 39 against a canvas-hidden control of 82 — ratio **0.48**;
 *   - **fixed**: 88 against the same 82 — ratio **1.07**, above the control,
 *     because the wash then adds light *behind* the text instead of over it.
 *
 * 0.85 sits in the wide gap between those two and leaves room for a wash
 * retune, without admitting a footer that has gone back under the canvas.
 */
const FOOTER_LEGIBILITY_FLOOR = 0.85

test.describe('a footer under a canvas is still readable', () => {
  for (const route of GUTTER_ROUTES) {
    test(`${route} keeps its footer out from under the canvas`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(route)
      await page.waitForTimeout(2600)

      /*
       * Discovered at runtime rather than pinned to `/en`.
       *
       * Only one route carries a canvas today, but the scaffold's Fase 6
       * spreads the material layer to a second one. A gate written against a
       * hardcoded route would silently stop covering the thing it was written
       * for on the exact stage that made it matter more.
       */
      const hasCanvas = (await page.locator('canvas').count()) > 0
      test.skip(!hasCanvas, 'no canvas on this route, nothing to paint over')

      await page.evaluate(() => window.scrollTo(0, 999999))
      await page.waitForTimeout(2200)

      const geometry = await page.evaluate(() => {
        const footer = document.querySelector('footer')
        if (!footer) return null
        const rect = footer.getBoundingClientRect()
        const top = Math.max(0, Math.round(rect.top))
        return {
          top,
          height: Math.round(Math.min(rect.height, window.innerHeight - top)),
          width: window.innerWidth,
          dpr: window.devicePixelRatio,
        }
      })

      expect(geometry, `${route} rendered no footer`).not.toBeNull()
      const { top, height, width, dpr } = geometry ?? {
        top: 0,
        height: 0,
        width: 0,
        dpr: 1,
      }
      expect(
        height,
        `${route}: the footer is not on screen at full scroll`
      ).toBeGreaterThan(40)

      /*
       * The band in device pixels. A screenshot is in device pixels and
       * `getBoundingClientRect` is in CSS pixels; conflating them is exactly
       * how Tahap 21's measurement ended up reading the header instead of the
       * plate it meant to read (TAHAP-21.md §8.4).
       */
      const band = {
        left: 0,
        top: Math.round(top * dpr),
        width: Math.round(width * dpr),
        height: Math.round(height * dpr),
      }

      const painted = await legibility(await page.screenshot(), band)

      /*
       * The control: the same footer with the canvas gone. Comparing against
       * it rather than an absolute floor means the assertion survives a
       * palette change — what is claimed is "the canvas does not eat the
       * footer", not "the footer is this bright".
       */
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')
        if (canvas instanceof HTMLElement) canvas.style.display = 'none'
      })
      await page.waitForTimeout(800)
      const control = await legibility(await page.screenshot(), band)

      expect(
        painted.p99,
        `${route}: the footer's brightest text reaches ${painted.p99.toFixed(0)}/255 with the canvas and ${control.p99.toFixed(0)}/255 without it — the canvas is painting over the footer. Mean luminance is not the tell here: it *rises* across this defect.`
      ).toBeGreaterThan(control.p99 * FOOTER_LEGIBILITY_FLOOR)
    })
  }
})
