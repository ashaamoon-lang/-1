import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { axeTags } from './axe-tags'
import { FEATURED_WORK } from './fixtures'

/**
 * The gallery lightbox — Tahap 31, Fase 5 of the approved scaffold.
 *
 * ## What these were written against
 *
 * Four defects, all of them found by driving the thing rather than by reading
 * it, and every one invisible to a build, a typecheck and a lint:
 *
 * 1. **Arrow keys did nothing.** Base UI's dialog stops arrow keys
 *    propagating — it treats them as its own composite navigation — so a
 *    document listener on the bubble phase never ran. Measured: a capture
 *    listener saw `ArrowLeft`, a bubble listener on the same document saw
 *    nothing.
 * 2. **A pan closed the dialog.** `Dialog.Popup` was styled `display:
 *    contents`, which generates no box, and Base UI decides "was that press
 *    outside?" from the popup's geometry. With no box, every release was
 *    outside.
 * 3. **The picture was clipped.** The stage's implicit grid row was sized by
 *    its own content, so the frame's `block-size: 100%` resolved circularly
 *    and was dropped: 786px of image inside a 698px stage, with the overflow
 *    hidden.
 * 4. **The gallery holds two images, not three.** An earlier count matched
 *    `data-span` in the page HTML, which the next-project card also uses. The
 *    number matters here because it decides which controls deserve to exist.
 */

const GALLERY = `/en/work/${FEATURED_WORK}`

async function openAt(page: Page, position: number) {
  await page.goto(GALLERY)
  await page.waitForTimeout(1200)
  await page.locator('[data-gallery-trigger]').nth(position).click()
  await page.waitForSelector('[data-lightbox-frame]')
  await page.waitForTimeout(600)
}

/** The `01 / 02` counter, whitespace removed so it can be compared. */
async function counter(page: Page): Promise<string> {
  return (
    (await page.evaluate(
      () =>
        [...document.querySelectorAll('[role="dialog"] p')]
          .map((node) => node.textContent?.trim() ?? '')
          .find((text) => /^\d+\s*\/\s*\d+$/.test(text)) ?? ''
    )) ?? ''
  ).replace(/\s+/g, '')
}

test.describe('the gallery lightbox', () => {
  test('every gallery image is a real control', async ({ page }) => {
    await page.goto(GALLERY)
    await page.waitForTimeout(1200)

    const triggers = page.locator('[data-gallery-trigger]')
    const count = await triggers.count()
    expect(count, 'the gallery renders no openable images').toBeGreaterThan(1)

    // A button, not a div with a handler: reachable by Tab, activated by
    // Enter and Space, and announced as something that does a thing.
    for (let i = 0; i < count; i += 1) {
      const trigger = triggers.nth(i)
      expect(await trigger.evaluate((el) => el.tagName)).toBe('BUTTON')
      expect(
        await trigger.getAttribute('aria-label'),
        'an opener with no name tells a screen reader nothing about which image it opens'
      ).toBeTruthy()
    }
  })

  test('it opens at the image that was clicked', async ({ page }) => {
    await openAt(page, 1)

    /*
     * The second image, not the first. A lightbox that always starts at the
     * beginning throws away the one thing the reader told it.
     */
    expect(
      await counter(page),
      'opened somewhere other than the clicked image'
    ).toMatch(/^02\//)
  })

  test('arrows move between works, and the counter follows', async ({
    page,
  }) => {
    await openAt(page, 1)
    expect(await counter(page)).toMatch(/^02\//)

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(400)

    /*
     * Proved red on 2026-09-04: this stayed at `02` because Base UI stops the
     * arrow key before a bubble-phase listener can see it.
     */
    expect(
      await counter(page),
      'ArrowLeft did not move — the key never reached the handler'
    ).toMatch(/^01\//)

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    expect(await counter(page)).toMatch(/^02\//)
  })

  test('the picture fits the stage rather than being cropped by it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openAt(page, 0)

    const fit = await page.evaluate(() => {
      const frame = document.querySelector('[data-lightbox-frame]')
      const image = frame?.querySelector('img')
      const stage = frame?.parentElement
      if (!image || !stage) return null

      const box = image.getBoundingClientRect()
      const area = stage.getBoundingClientRect()
      return {
        imageHeight: Math.round(box.height),
        stageHeight: Math.round(area.height),
        imageWidth: Math.round(box.width),
        stageWidth: Math.round(area.width),
        naturalRatio: image.naturalWidth / image.naturalHeight,
        renderedRatio: box.width / box.height,
      }
    })

    expect(fit).not.toBeNull()
    if (!fit) return

    /*
     * Proved red: 786px of image in a 698px stage, with `overflow: hidden`
     * quietly taking the top and bottom off a piece of artwork.
     */
    expect(
      fit.imageHeight,
      `the image is ${fit.imageHeight}px tall in a ${fit.stageHeight}px stage — it is being clipped`
    ).toBeLessThanOrEqual(fit.stageHeight + 1)
    expect(fit.imageWidth).toBeLessThanOrEqual(fit.stageWidth + 1)
    // And it is letterboxed rather than squashed.
    expect(Math.abs(fit.renderedRatio - fit.naturalRatio)).toBeLessThan(0.02)
  })

  test('panning is possible only once zoomed, and never closes the dialog', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openAt(page, 0)

    const frame = page.locator('[data-lightbox-frame]')
    const box = await frame.boundingBox()
    expect(box).not.toBeNull()
    if (!box) return

    const drag = async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(
        box.x + box.width / 2 - 140,
        box.y + box.height / 2 - 50,
        { steps: 8 }
      )
      await page.mouse.up()
      await page.waitForTimeout(400)
    }

    // Unzoomed, the picture already fits, so a drag must not move it.
    await drag()
    const atRest = await frame.evaluate((el) => getComputedStyle(el).transform)
    expect(
      atRest,
      'the picture moved while it still fitted the screen, which is a pan with nowhere to go'
    ).toBe('matrix(1, 0, 0, 1, 0, 0)')

    await page.getByRole('button', { name: 'Zoom' }).click()
    await page.waitForTimeout(500)
    await drag()

    /*
     * Proved red: this closed the dialog on pointer-up, because the popup had
     * no box for Base UI to test the press against.
     */
    await expect(
      frame,
      'the dialog closed during the drag rather than panning'
    ).toBeVisible()

    const panned = await frame.evaluate((el) => getComputedStyle(el).transform)
    expect(panned, `the zoomed picture did not move: ${panned}`).not.toBe(
      'matrix(2.2, 0, 0, 2.2, 0, 0)'
    )
  })

  test('Escape closes it and gives focus back to the image that opened it', async ({
    page,
  }) => {
    await openAt(page, 1)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(600)

    await expect(page.locator('[data-lightbox-frame]')).toBeHidden()

    const back = await page.evaluate(() => {
      const active = document.activeElement
      const all = [...document.querySelectorAll('[data-gallery-trigger]')]
      return {
        isTrigger: active?.hasAttribute('data-gallery-trigger') ?? false,
        index: active ? all.indexOf(active as HTMLElement) : -1,
      }
    })

    expect(back.isTrigger, 'focus was dropped somewhere else entirely').toBe(
      true
    )
    expect(
      back.index,
      'focus went back to a different image than the one that was opened'
    ).toBe(1)
  })

  for (const locale of ['en', 'id'] as const) {
    test(`/${locale}: axe is clean with the lightbox open`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/work/${FEATURED_WORK}`)
      await page.waitForTimeout(1200)
      await page.locator('[data-gallery-trigger]').first().click()
      await page.waitForSelector('[data-lightbox-frame]')
      await page.waitForTimeout(700)

      // A closed dialog is not in the DOM, so a route can stay green forever
      // while carrying a broken one — Tahap 28 §9.2, in its third shape.
      const results = await new AxeBuilder({ page })
        .withTags(axeTags())
        .analyze()
      const found = results.violations.map(
        (violation) =>
          `${violation.impact}: ${violation.id} (${violation.nodes.length} node(s))`
      )
      expect(found, found.join('\n')).toEqual([])
    })
  }

  test('reduced motion leaves nothing mid-transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openAt(page, 0)

    const state = await page.evaluate(() => {
      const frame = document.querySelector('[data-lightbox-frame]')
      const backdrop = frame
        ?.closest('body')
        ?.querySelector('[data-lightbox-frame]')
      return {
        frameTransition: frame
          ? getComputedStyle(frame).transitionDuration
          : null,
        visible: Boolean(backdrop),
      }
    })

    expect(state.visible).toBe(true)
    expect(
      state.frameTransition,
      'the frame still animates under prefers-reduced-motion'
    ).toBe('0s')
  })

  test('without JavaScript the gallery is still readable', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      await page.goto(GALLERY, { waitUntil: 'domcontentloaded' })

      // The images are server-rendered, so the work is visible without the
      // lightbox. The buttons are inert, which is the honest state: they open
      // a dialog that cannot exist, and the browser's own zoom still works.
      const images = await page.locator('[data-gallery-trigger] img').count()
      expect(
        images,
        'the gallery renders nothing without JavaScript'
      ).toBeGreaterThan(0)
    } finally {
      await context.close()
    }
  })
})
