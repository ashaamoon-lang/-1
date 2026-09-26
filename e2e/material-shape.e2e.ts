import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import {
  plateSkipReason,
  waitForCanvas,
  waitForPlate,
  webglIntent,
} from './webgl-intent'

/**
 * The material layer draws a cover in the shape the picture has — Tahap 86.
 *
 * ## The defect this exists for
 *
 * `vault/webgl/material-image` took over from the DOM `<img>` and drew the
 * whole texture across the plate. The `<img>` it replaced carries
 * `object-fit: cover`; the shader did not. So any cover whose shape differed
 * from its box was **stretched** rather than cropped, and it never showed
 * while every cover happened to match its card.
 *
 * It showed on `/en/work`, where the catalogue gives every card a 4:5 box:
 * five of six covers were drawn at the wrong shape. Pusat Beban's 16:9 plate
 * was squeezed to 45% of its width — its round dome drawn as a tall, narrow
 * ellipse. It surfaced when Tahap 86 promoted a 4:5 cover on the home page to
 * a 16:9 card and the dome went flat.
 *
 * No gate had asked the question. The material gates ask whether a canvas
 * exists, whether it draws, whether it moves, and whether the plate leaves a
 * hole — never whether what it draws is the right shape.
 *
 * ## How it asks without a threshold
 *
 * Two references are built from the cover's own source file: the `cover` crop
 * the `<img>` would show, and the `fill` stretch the shader used to draw. The
 * canvas is photographed over the same visible window, and it must sit closer
 * to `cover` than to `fill`. A relative test, so the grain, the title's scrim
 * and the shader's small drift cost both references alike, and no absolute
 * "how close is close" number has to be invented.
 *
 * Only cards whose box and picture disagree by more than `MISMATCH` are
 * asked: where they agree the two references are the same picture and the
 * comparison carries no information.
 *
 * ## Red-proof
 *
 * Against the shader before the fix, on the build that already promoted the
 * home page's lone half: this failed on every mismatched card it measured.
 * The numbers are in `docs/stages/TAHAP-86.md` §7.
 */

/**
 * Ratio disagreement, either way, below which a card is not asked.
 *
 * 0.3, and the number was measured rather than picked. At 0.25 the gate also
 * asked Bacaan Mesin (a square cover in a 4:5 box, ×0.73), where the crop and
 * the stretch are close enough that the shader's own drift and the grain
 * decide the answer: after the fix it sat at 18.5 against 20.2, a margin of
 * 1.7 on a 0–255 scale. Above 0.3 the smallest margin measured after the fix
 * is Lantai Dua at 4.7 — and before the fix the same card sat 9.0 the other
 * way, so the gate still separates the two states by a wide gap.
 */
const MISMATCH = 0.3

/** Width the three images are compared at, in pixels. */
const SAMPLE_WIDTH = 48

interface Region {
  x: number
  y: number
  width: number
  height: number
}

/** Downsampled greyscale pixels of a PNG/JPEG buffer region. */
async function grey(input: Buffer, height: number): Promise<Buffer> {
  return sharp(input)
    .resize(SAMPLE_WIDTH, height, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer()
}

function meanAbsoluteDifference(a: Buffer, b: Buffer): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0))
  return sum / a.length
}

test.describe('the material layer keeps each picture its own shape', () => {
  test('every mismatched cover on every published route is cropped, not stretched', async ({
    page,
    request,
  }) => {
    // Every published plate, each waited for up to WEBGL_ARRIVAL_MS — Tahap 90.
    test.setTimeout(600_000)
    await page.setViewportSize({ width: 1600, height: 900 })

    const xml = await (await request.get('/sitemap.xml')).text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1] ?? '/').pathname)
      .filter((path) => !path.endsWith('.md'))

    const stretched: string[] = []
    const report: string[] = []
    let asked = 0

    for (const path of paths) {
      await page.goto(path)
      const count = await page.locator('[data-material-shell]').count()
      if (count === 0) continue

      // Decided per route, waited for per plate — Tahap 90.
      const intent = await webglIntent(page)
      if (!intent.intended) {
        report.push(`${path}: not asked — ${intent.reason}`)
        continue
      }
      await waitForCanvas(page)

      for (let index = 0; index < count; index++) {
        const shell = page.locator('[data-material-shell]').nth(index)
        await shell.evaluate((node) =>
          node.scrollIntoView({ block: 'center', behavior: 'instant' })
        )
        /*
         * The mesh raises `data-material` only after it has drawn a frame.
         *
         * This waited 6s and skipped the plate silently when it ran out; a cold
         * desktop needs up to 9.3s, which is how Arus Balik on `/en` was never
         * asked in Tahap 86. A plate whose picture failed to load is the one
         * that may correctly not draw — it is named in the report instead.
         */
        const plate = await waitForPlate(shell)
        if (plate !== 'drawn') {
          report.push(
            `${path} plate ${index + 1}: not asked — ${plateSkipReason(plate)}`
          )
          continue
        }
        await page.waitForTimeout(700)

        const geometry = await shell.evaluate((node) => {
          const img = node.querySelector('img')
          if (!img || !img.naturalWidth) return null
          const box = node.getBoundingClientRect()
          // The window the reader sees: the shell, cut by the first clipping
          // ancestor (the card's media box) and by the viewport.
          let clip = { top: 0, left: 0, right: innerWidth, bottom: innerHeight }
          for (let a = node.parentElement; a; a = a.parentElement) {
            const style = getComputedStyle(a)
            if (/(clip|hidden)/.test(style.overflow)) {
              const r = a.getBoundingClientRect()
              clip = {
                top: Math.max(clip.top, r.top),
                left: Math.max(clip.left, r.left),
                right: Math.min(clip.right, r.right),
                bottom: Math.min(clip.bottom, r.bottom),
              }
              break
            }
          }
          const top = Math.max(box.top, clip.top)
          const left = Math.max(box.left, clip.left)
          return {
            src: img.currentSrc,
            asset: img.naturalWidth / img.naturalHeight,
            box: {
              x: box.left,
              y: box.top,
              width: box.width,
              height: box.height,
            },
            visible: {
              x: left,
              y: top,
              width: Math.min(box.right, clip.right) - left,
              height: Math.min(box.bottom, clip.bottom) - top,
            },
            label: (node.closest('li, article, a')?.textContent ?? '')
              .trim()
              .slice(0, 16),
          }
        })
        if (
          !geometry ||
          geometry.visible.width < 80 ||
          geometry.visible.height < 80
        )
          continue

        const boxRatio = geometry.box.width / geometry.box.height
        const mismatch = boxRatio / geometry.asset
        if (Math.abs(mismatch - 1) < MISMATCH) continue

        /*
         * The references are built from the cover's own file, so that file
         * has to arrive — Tahap 90.
         *
         * This handed whatever came back to `sharp`, and when the image
         * optimiser timed out on `cdn.sanity.io` (twelve such timeouts in one
         * local server log) the whole gate died on "Input buffer contains
         * unsupported image format". A source that did not download is the
         * second state in `e2e/webgl-intent.ts`: named, not asked, not a
         * failure of the shape it was meant to check.
         */
        const response = await page.request.get(geometry.src)
        const type = response.headers()['content-type'] ?? ''
        if (!response.ok() || !type.startsWith('image/')) {
          report.push(
            `${path} "${geometry.label}": not asked — its source did not download (${response.status()} ${type})`
          )
          continue
        }
        const source = await response.body()
        asked += 1

        const region: Region = {
          x: Math.round(geometry.visible.x),
          y: Math.round(geometry.visible.y),
          width: Math.round(geometry.visible.width),
          height: Math.round(geometry.visible.height),
        }
        const shot = await page.screenshot({ clip: region })

        const boxWidth = Math.round(geometry.box.width)
        const boxHeight = Math.round(geometry.box.height)
        const cut = {
          left: Math.min(
            Math.max(0, region.x - Math.round(geometry.box.x)),
            boxWidth - region.width
          ),
          top: Math.min(
            Math.max(0, region.y - Math.round(geometry.box.y)),
            boxHeight - region.height
          ),
          width: region.width,
          height: region.height,
        }
        const reference = async (fit: 'cover' | 'fill') =>
          sharp(source)
            .resize(boxWidth, boxHeight, { fit, position: 'centre' })
            .extract(cut)
            .png()
            .toBuffer()

        const sampleHeight = Math.max(
          8,
          Math.round((SAMPLE_WIDTH * region.height) / region.width)
        )
        const drawnPixels = await grey(shot, sampleHeight)
        const toCover = meanAbsoluteDifference(
          drawnPixels,
          await grey(await reference('cover'), sampleHeight)
        )
        const toFill = meanAbsoluteDifference(
          drawnPixels,
          await grey(await reference('fill'), sampleHeight)
        )

        const line = `${path} "${geometry.label}" asset ${geometry.asset.toFixed(3)} box ${boxRatio.toFixed(3)} (x${mismatch.toFixed(2)}): cover ${toCover.toFixed(1)} vs stretch ${toFill.toFixed(1)}`
        report.push(line)
        if (toCover >= toFill) stretched.push(line)
      }
    }

    console.log(report.join('\n'))
    // Anti-vacuum: a run that asked nothing proved nothing.
    expect(
      asked,
      'no mismatched cover was drawn by the material layer'
    ).toBeGreaterThan(0)
    expect(
      stretched,
      `drawn closer to a stretch than to a crop:\n${stretched.join('\n')}`
    ).toEqual([])
  })
})
