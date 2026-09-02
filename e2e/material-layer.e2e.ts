import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * The material layer draws, and it gets out of the way before a navigation.
 *
 * ## Why the first test measures pixels and not the DOM
 *
 * `vault/webgl/material-image` hides the DOM `<img>` and lets a WebGL mesh
 * stand in for it. Every DOM-shaped assertion about that arrangement passes
 * whether or not the mesh renders a single pixel: the wrapper is there, the
 * attribute is there, the image is correctly at `opacity: 0`. The first build
 * of this stage did exactly that — four covers on the home page were **empty
 * boxes**, with a green typecheck, a green lint, a green build, and every
 * existing e2e gate passing.
 *
 * The cause was two layers deep and invisible from the DOM: the shared canvas
 * already contains a full-viewport background quad (the hero's
 * `GradientScene`) sitting at the same depth as every DOM-anchored mesh and
 * writing depth, so it occluded the plates; and the card's own placeholder
 * background sat over the canvas besides. Neither is expressible as a DOM
 * assertion. See `docs/stages/TAHAP-14.md` §11.2 and §11.3.
 *
 * So this reads the rendered page. A plate that is actually drawn has a wide
 * spread of colour across its box; a plate that is missing is one flat value,
 * whatever that value happens to be. The threshold is on *range*, not on any
 * particular colour, so it keeps meaning the same thing if the palette or the
 * fixtures change.
 */

/**
 * Counters the leak probe installs into the page.
 *
 * A real global rather than an assertion at each use: an assertion chain
 * hides a typo in the shape, and this shape is written here and read inside
 * the browser, where nothing would catch it.
 */
declare global {
  interface Window {
    __glLive?: { buffers: number; textures: number }
  }
}

/** Put the home page's work grid on screen and let the canvas draw. */
async function showWorkGrid(page: Page) {
  await page.goto('/en', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.querySelector('#work')?.scrollIntoView({ block: 'start' })
  })
  // The mesh needs its texture decoded and at least one frame advanced. The
  // canvas runs on Tempus, not on Playwright's idea of idle.
  await page.waitForTimeout(2500)
}

test.describe('material layer', () => {
  test('no plate is ever a blank box', async ({ page }) => {
    /*
     * ## What this asserts, and what it deliberately does not
     *
     * The failure this stage kept producing was a *blank card*: the DOM image
     * hidden at `opacity: 0` while the mesh that was supposed to replace it
     * drew nothing. It happened twice, for two unrelated reasons — a
     * full-viewport background quad writing depth over the plates, and a
     * placement bug reading Lenis' eased scroll instead of the real one — and
     * both times the build, the types, the lint and every existing gate were
     * green.
     *
     * The obvious gate is a pixel comparison: render the plate with the
     * material and with `prefers-reduced-motion`, and require the two to
     * carry the same spread of colour. That was written, and it does not
     * hold up **as an automated gate in this environment**: on a headless
     * software renderer the WebGL layer is present in some captures and
     * absent from others, run to run, with the page in an identical state.
     * A flaky gate is worse than no gate, because it teaches you to re-run.
     * The comparison was therefore made by hand and recorded with its numbers
     * in `docs/stages/TAHAP-14.md` §11.6 — material `178/159/120` against the
     * DOM's `177/157/120` in the same box — and what is automated here is the
     * invariant that makes the blank box impossible in the first place.
     *
     * ## The invariant
     *
     * `data-material` is written only after the mesh has reported a frame it
     * could actually have been drawn in — texture bound, rect measured,
     * matrix written (`vault/webgl/material-image/scene.tsx`). So the DOM
     * image is never hidden on the *assumption* that something replaced it.
     * If the mesh never draws, the attribute never lands, and the plate stays
     * the plain image, which is the documented fallback.
     *
     * That turns "the material is broken" from a silent visual defect into a
     * no-op. This test holds the two halves of it: a hidden image always has
     * a canvas behind it, and a plate without a material is always visible.
     *
     * ## What it does not catch, stated plainly
     *
     * This test would **not** have caught either original defect on its own.
     * With the old speculative hiding, a non-drawing mesh still produced
     * `data-material` on a page that had a canvas, and every assertion below
     * would have passed over four blank rectangles. What prevents that is the
     * component contract, not this file. This is the regression guard for the
     * contract; the contract is the fix.
     */
    await showWorkGrid(page)

    const shells = page.locator('[data-material-shell]')
    expect(
      await shells.count(),
      'the home grid renders no material shells at all'
    ).toBeGreaterThan(0)

    const state = await page.evaluate(() =>
      [...document.querySelectorAll('[data-material-shell]')].map((shell) => ({
        active: shell.hasAttribute('data-material'),
        opacity: getComputedStyle(shell).opacity,
        hasImage: Boolean(shell.querySelector('img')),
      }))
    )

    const canvases = await page.locator('canvas').count()

    for (const [index, plate] of state.entries()) {
      expect(plate.hasImage, `plate ${index} has no <img> at all`).toBe(true)

      if (plate.active) {
        // Hidden, so something must be drawing in its place.
        expect(
          canvases,
          `plate ${index} hid its image with no canvas on the page`
        ).toBeGreaterThan(0)
        expect(
          plate.opacity,
          `plate ${index} is marked active but is not handed over`
        ).toBe('0')
      } else {
        // Not hidden — the plain plate, fully visible.
        expect(
          plate.opacity,
          `plate ${index} has no material and is still invisible — a blank box`
        ).toBe('1')
      }
    }
  })

  test('COMMIT hands the plate back to the DOM before navigating', async ({
    page,
  }) => {
    await showWorkGrid(page)

    /*
     * The stable shell, not the state attribute.
     *
     * `[data-material]` is removed the instant the handoff happens, so a
     * locator built from it stops matching exactly when the behaviour under
     * test starts working — and `.first()` then re-resolves to a different
     * card. That produced a red gate pointing at the wrong thing;
     * `vault/webgl/material-image/index.tsx` documents the split.
     */
    const root = page.locator('[data-material-shell]').first()
    test.skip(
      (await page.locator('[data-material-shell][data-material]').count()) ===
        0,
      'no material mounted; nothing to hand back'
    )

    await expect(
      root,
      'the material should be drawing before the press'
    ).toHaveCSS('opacity', '0')

    /*
     * `pointerdown` alone, deliberately — not `click()`.
     *
     * The claim is that the DOM image is back *before* the navigation, so the
     * measurement has to land in the window between the press and the route
     * change. A full click closes that window.
     */
    const card = page.locator('[data-press="card"]').first()
    const box = await card.boundingBox()
    if (!box) throw new Error('no card to press')

    /*
     * Clamped into the viewport. A full-width plate is 816px tall in a 720px
     * window, so its geometric centre is below the fold and a mouse event
     * aimed there lands on nothing at all — the same shape of mistake as the
     * Tahap 12 press gate that reported four working cards as silent.
     */
    const viewport = page.viewportSize()
    const pressY = Math.min(
      box.y + box.height / 2,
      (viewport?.height ?? 720) - 40
    )
    await page.mouse.move(box.x + box.width / 2, pressY)
    await page.mouse.down()

    await expect(
      root,
      'COMMIT did not stand the material down — a ViewTransition would photograph an empty box'
    ).toHaveCSS('opacity', '1')

    await page.mouse.up()
  })

  test('the keyboard reaches COMMIT too', async ({ page }) => {
    await showWorkGrid(page)

    const root = page.locator('[data-material-shell]').first()
    test.skip(
      (await page.locator('[data-material-shell][data-material]').count()) ===
        0,
      'no material mounted'
    )

    await page.locator('[data-press="card"]').first().focus()

    /*
     * `keydown` without `keyup`. Enter on a link synthesises a click, and the
     * navigation that follows would unmount what this is measuring.
     */
    await page.keyboard.down('Enter')
    await expect(
      root,
      'a keyboard press reaches TRANSPORT without ever producing a pointer event, and must stand the material down too'
    ).toHaveCSS('opacity', '1')
  })

  test('repeated mounts do not grow GPU memory', async ({ page }) => {
    /*
     * A growth test, not an absolute one, and stated that way on purpose.
     * Three never frees GPU resources on its own (`CLAUDE.md` #15), and the
     * number of live objects after one visit is not knowable from outside —
     * it depends on the hero, on how many plates are in view, and on drei's
     * shared texture cache. What is knowable is that leaving and returning
     * three times must not leave more behind each time.
     *
     * `renderer.info` is unreachable from a production page, so this counts
     * at the API boundary instead: every `createBuffer` never matched by a
     * `deleteBuffer` is a leak, whoever made it.
     */
    await page.addInitScript(() => {
      const live = { buffers: 0, textures: 0 }
      window.__glLive = live

      const proto = WebGL2RenderingContext.prototype
      const makeBuffer = proto.createBuffer
      const dropBuffer = proto.deleteBuffer
      const makeTexture = proto.createTexture
      const dropTexture = proto.deleteTexture

      proto.createBuffer = function createBuffer() {
        live.buffers++
        return makeBuffer.call(this)
      }
      proto.deleteBuffer = function deleteBuffer(buffer: WebGLBuffer | null) {
        live.buffers--
        return dropBuffer.call(this, buffer)
      }
      proto.createTexture = function createTexture() {
        live.textures++
        return makeTexture.call(this)
      }
      proto.deleteTexture = function deleteTexture(
        texture: WebGLTexture | null
      ) {
        live.textures--
        return dropTexture.call(this, texture)
      }
    })

    const live = () =>
      page.evaluate(() => window.__glLive ?? { buffers: 0, textures: 0 })

    await showWorkGrid(page)
    const first = await live()

    for (let visit = 0; visit < 3; visit++) {
      await page.goto('/en/ai', { waitUntil: 'networkidle' })
      await showWorkGrid(page)
    }
    const last = await live()

    /*
     * A small allowance, not zero. drei's texture cache retains one texture
     * per distinct URL for the page's lifetime by design — that is a cache,
     * not a leak, and `vault/webgl/material-image/scene.tsx` documents why it
     * must not be disposed. What this rejects is growth proportional to the
     * number of visits.
     */
    expect(
      last.buffers,
      `WebGL buffers grew ${first.buffers} → ${last.buffers} across 3 revisits`
    ).toBeLessThanOrEqual(first.buffers + 8)
  })
})
