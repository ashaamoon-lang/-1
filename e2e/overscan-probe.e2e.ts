import { writeFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { FEATURED_WORK, RUN_WORK } from './fixtures'

/**
 * PROBE — not for merge. Measures, on CI, what `image-resolution.e2e.ts`
 * reads and what it does not: how wide each picture is actually drawn.
 *
 * The gate's `needed` is the `<img>` box times the device pixel ratio. A
 * picture inside a parallax layer taller than its frame, with `object-fit:
 * cover`, is drawn wider than that box — 12% for gallery plates, 8% for
 * project cards — and cropped at the sides. For each image on the gate's
 * routes, at the gate's two viewports, this records the box, the drawn
 * width, the pixels delivered, and the candidate the browser would take if
 * `sizes` carried a 1.12 overscan, with the bytes of both.
 */

const ROUTES = ['/en', `/en/work/${FEATURED_WORK}`, `/en/work/${RUN_WORK}`]

const VIEWPORTS = [
  { name: 'desktop 1280@1', use: { viewport: { width: 1280, height: 720 } } },
  {
    name: 'mobile 390@3',
    use: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      hasTouch: true,
      isMobile: true,
    },
  },
] as const

for (const viewport of VIEWPORTS) {
  test.describe(viewport.name, () => {
    test.use(viewport.use)

    for (const route of ROUTES) {
      test(`${route}`, async ({ page }, testInfo) => {
        test.skip(
          testInfo.project.name !== 'desktop',
          'the probe sets its own viewports'
        )
        await page.goto(route, { waitUntil: 'networkidle' })
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight)
          await new Promise((resolve) => setTimeout(resolve, 1200))
          window.scrollTo(0, 0)
        })

        const rows = await page.evaluate(async () => {
          const dpr = window.devicePixelRatio
          const slotOf = (sizes: string, scale: number) => {
            for (const part of sizes.split(',')) {
              const match = /^(.*?)\s*([\d.]+)(vw|px)$/.exec(part.trim())
              if (!match) continue
              const media = (match[1] ?? '').trim()
              if (media && !window.matchMedia(media).matches) continue
              const value = Number(match[2])
              return match[3] === 'vw'
                ? (Math.ceil(value * scale) * window.innerWidth) / 100
                : Math.ceil(value * scale)
            }
            return null
          }
          const out = []
          for (const img of document.querySelectorAll('img')) {
            const rect = img.getBoundingClientRect()
            if (rect.width < 40 || !img.currentSrc) continue

            const current = await (await fetch(img.currentSrc)).blob()
            const bitmap = await createImageBitmap(current)
            const delivered = bitmap.width
            const aspect = bitmap.width / bitmap.height
            bitmap.close()

            const fit = getComputedStyle(img).objectFit
            const drawn =
              fit === 'cover'
                ? Math.max(rect.width, rect.height * aspect)
                : rect.width

            const candidates = img.srcset
              .split(',')
              .map((entry) => entry.trim().split(/\s+/))
              .map(([url, descriptor]) => ({
                url: url ?? '',
                w: Number.parseInt(descriptor ?? '', 10),
              }))
              .filter((candidate) => Number.isFinite(candidate.w))
              .sort((a, b) => a.w - b.w)

            const source = new URL(img.currentSrc, location.href)
            const sanity = source.searchParams.get('url') ?? ''
            const sourceCap = Number(
              new URL(sanity, location.href).searchParams.get('w') ?? 'NaN'
            )
            const asset = /-(\d+)x(\d+)\.\w+/.exec(sanity)
            const assetWidth = asset ? Number(asset[1]) : Number.NaN

            const slot = slotOf(img.sizes, 1)
            const slotOver = slotOf(img.sizes, 1.12)
            const pick = (width: number | null) =>
              width === null
                ? undefined
                : (candidates.find((c) => c.w / width >= dpr) ??
                  candidates.at(-1))
            const now = pick(slot)
            const over = pick(slotOver)
            const overBytes =
              over && over.w !== now?.w
                ? (await (await fetch(over.url)).blob()).size
                : current.size

            out.push({
              alt: (img.alt || '(no alt)').slice(0, 32),
              fit,
              boxW: Math.round(rect.width),
              boxH: Math.round(rect.height),
              drawnW: Math.round(drawn),
              sizes: img.sizes,
              slot: slot === null ? null : Math.round(slot),
              candidate: now?.w ?? null,
              delivered,
              sourceCap,
              assetWidth,
              ratioBox: +(delivered / Math.round(rect.width * dpr)).toFixed(3),
              ratioDrawn: +(delivered / Math.round(drawn * dpr)).toFixed(3),
              overCandidate: over?.w ?? null,
              overDelivered: Math.min(
                over?.w ?? delivered,
                sourceCap || Number.POSITIVE_INFINITY,
                assetWidth || Number.POSITIVE_INFINITY
              ),
              bytes: current.size,
              overBytes,
            })
          }
          return out
        })

        const record = { route, viewport: viewport.name, rows }
        writeFileSync(
          testInfo.outputPath('overscan.json'),
          JSON.stringify(record, null, 2)
        )
        console.log(`OVERSCAN ${JSON.stringify(record)}`)
        expect(rows.length).toBeGreaterThan(0)
      })
    }
  })
}
