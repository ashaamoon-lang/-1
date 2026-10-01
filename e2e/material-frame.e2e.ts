import { expect, test } from '@playwright/test'
import sharp from 'sharp'

import {
  plateSkipReason,
  waitForCanvas,
  waitForPlate,
  webglIntent,
} from './webgl-intent'

/**
 * A material plate stays inside its frame — the fork.
 *
 * ## The defect
 *
 * `MaterialImage` placed its mesh by measuring its own wrapper, and in a
 * project card that wrapper sits inside the parallax layer: taller than the
 * frame by the travel plus headroom (`project-card.module.css`, `.parallax`)
 * and translated by the scrub. The mesh was scaled to that oversized layer,
 * frozen at whatever offset it had when measured, and drawn with nothing to
 * clip it. On `/work` at 1440 the plates ran 40–90px past their frames and
 * under their own captions, found by an adversarial design review from a
 * screenshot and confirmed on screen. Every other gate passed: the material
 * gates measure DOM layers (`plane-edge`) or the mesh's own pixels, never the
 * mesh against the frame it belongs in.
 *
 * ## The measurement, and why it is a difference
 *
 * The page ground carries grain, so an absolute "is this the ground colour"
 * check would be tuned to noise. Instead, for each live plate a thin strip
 * just outside the frame — below it, and above it — is photographed twice:
 * with the canvas, and with the canvas hidden. Hidden, the strip is page
 * ground by construction (the DOM image is at opacity 0 while the plate is
 * live, and it is inside the frame anyway). Visible, it should be the same
 * ground. A plate that spills paints cover pixels there, and the two means
 * part by tens of levels.
 *
 * Desktop only: WebGL is gated to desktop width (`webgl-intent.ts`).
 */

/** How far outside the frame the strip starts, and how tall it is. */
const STRIP_GAP_PX = 2
const STRIP_PX = 6

/** Mean-luminance difference, 0..255, above which the strip was painted. */
const SPILL_TOLERANCE = 3

/** Plates checked per route — enough to cover both columns' drifts. */
const PLATES = 4

async function meanLuminance(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let sum = 0
  const pixels = info.width * info.height
  for (let i = 0; i < data.length; i += info.channels) {
    sum +=
      0.2126 * (data[i] ?? 0) +
      0.7152 * (data[i + 1] ?? 0) +
      0.0722 * (data[i + 2] ?? 0)
  }
  return pixels === 0 ? 0 : sum / pixels
}

test.describe('a material plate stays inside its frame', () => {
  test.skip(
    () => test.info().project.name !== 'desktop',
    'the material is gated to desktop width'
  )

  test('/en/work draws no plate past its frame', async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/work', { waitUntil: 'domcontentloaded' })

    const intent = await webglIntent(page)
    test.skip(!intent.intended, intent.reason)
    await waitForCanvas(page)

    /*
     * Plates are found by the shell every material plate has always carried,
     * and each plate's frame is the nearest ancestor that clips overflow —
     * the box that clips the DOM image, so the box the mesh must stay in.
     * Not by `data-plate-frame`: the fix added that marker, and a gate that
     * needed the fix to find anything could not be proved red against the
     * build that had the defect (its first run failed on "no frame", which
     * proves nothing).
     */
    const shells = page.locator('[data-material-shell]')
    const count = Math.min(await shells.count(), PLATES)
    expect(
      count,
      '/en/work shows no material plate to measure'
    ).toBeGreaterThan(0)

    const spills: string[] = []
    let measured = 0

    for (let index = 0; index < count; index += 1) {
      const shell = shells.nth(index)
      await shell.evaluate((node) =>
        node.scrollIntoView({ block: 'center', behavior: 'instant' })
      )
      const state = await waitForPlate(shell)
      if (state !== 'drawn') {
        test.info().annotations.push({
          type: 'skipped plate',
          description: `#${index}: ${plateSkipReason(state)}`,
        })
        continue
      }
      // Let smooth scroll and the scrub settle, so the frame and the mesh
      // are read from the same resting position.
      await page.waitForTimeout(1200)

      const box = await shell.evaluate((node) => {
        for (let up = node.parentElement; up; up = up.parentElement) {
          const style = getComputedStyle(up)
          if (style.overflowX !== 'visible' || style.overflowY !== 'visible') {
            const r = up.getBoundingClientRect()
            return { x: r.x, y: r.y, width: r.width, height: r.height }
          }
        }
        return null
      })
      if (!box) continue
      const strips = {
        below: {
          x: box.x + 8,
          y: box.y + box.height + STRIP_GAP_PX,
          width: box.width - 16,
          height: STRIP_PX,
        },
        above: {
          x: box.x + 8,
          y: box.y - STRIP_GAP_PX - STRIP_PX,
          width: box.width - 16,
          height: STRIP_PX,
        },
      }

      for (const [edge, clip] of Object.entries(strips)) {
        // A strip outside the viewport cannot be photographed; the header
        // also covers the top of the screen, so an "above" strip under it
        // measures the header, not the plate.
        if (clip.y < 90 || clip.y + clip.height > 900) continue

        const painted = await meanLuminance(await page.screenshot({ clip }))
        const hidden = await page.addStyleTag({
          content: 'canvas { visibility: hidden !important; }',
        })
        await page.waitForTimeout(150)
        const ground = await meanLuminance(await page.screenshot({ clip }))
        await hidden.evaluate((node) => {
          ;(node as HTMLStyleElement).remove()
        })
        await page.waitForTimeout(150)

        measured += 1
        const difference = Math.abs(painted - ground)
        if (difference > SPILL_TOLERANCE) {
          spills.push(
            `plate #${index}, ${edge} its frame: ${painted.toFixed(1)} with the canvas against ${ground.toFixed(1)} without — the mesh paints past the frame`
          )
        }
      }
    }

    // Anti-vacuum: a run that measured no edge proved nothing.
    expect(
      measured,
      'no plate edge was measured — every plate was skipped or off screen'
    ).toBeGreaterThan(0)
    expect(spills).toEqual([])
  })
})
