import { expect, test } from '@playwright/test'

import {
  type Rgb,
  type TextRun,
  compositeOver,
  contrastFaults,
  contrastRatio,
  worstContrast,
} from './contrast-situ'

/**
 * Text is readable against what is **actually painted behind it**.
 *
 * ## The defect, and why nothing could see it
 *
 * `vault/blocks/project-spine` is `position: sticky` with no background of its
 * own. At `--desktop` (>= 800px) it sits in column 2 and never meets artwork,
 * which is why it survived every gate and every screenshot for thirty stages.
 * Below 800px the grid collapses, the index becomes a horizontal row pinned
 * under the header, and the gallery scrolls **beneath it**. Measured on the
 * production build at 390x720, `/en/work/arus-balik`, scrollY 1224:
 *
 * ```
 * "Images"    1.48:1     (needs 4.5)
 * "Notes"     1.80:1
 * "Next"      2.68:1
 * "Overview"  2.84:1
 * ```
 *
 * The same four links measure 6.79-7.26:1 at scrollY 612. Nothing about the
 * link changed — only what passed behind it.
 *
 * Three guards were in place and all three are structurally blind to it:
 * `contrast.test.ts` measures token pairs in isolation; axe reports these as
 * `incomplete` rather than violations because it genuinely cannot resolve a
 * backdrop of grain, wash and pseudo-elements; and all 11 `AxeBuilder` call
 * sites read `results.violations` only, so 185 serious `incomplete` nodes were
 * discarded unread. `docs/stages/TAHAP-72.md` §1.
 *
 * ## How this measures it
 *
 * 1. Collect every visible text run with its computed colour and the **line
 *    boxes of its glyphs** — `Range.getClientRects()`, not the element's
 *    border box. Sampling the border box is how a bordered CTA reads 1.00:1:
 *    the border is ink too, and no glyph ever sits on it. That false positive
 *    was this gate's second draft.
 * 2. Make every glyph transparent and screenshot. What remains inside those
 *    boxes is exactly the backdrop — grain, wash, photograph and all.
 * 3. Sample it, composite the ink's alpha over it, and take the **worst**
 *    pixel. Worst rather than mean because a reader reads a whole word: one
 *    pale patch under three letters is where legibility actually fails.
 *
 * The worst-pixel rule is affordable because it was calibrated first: 759
 * desktop runs across seven full pages bottom out at 6.39:1 against a 4.5
 * floor. A 1.4x margin on passing content is what keeps a rule this strict
 * from flickering on grain.
 *
 * Colour is resolved through a canvas rather than parsed. The site authors in
 * `oklch()`, so `getComputedStyle().color` comes back as `lab(...)` or
 * `oklab(... / .75)` — a regex for `rgb()` matches none of it, which is how
 * this gate's first draft reported `Infinity:1` on every route while appearing
 * to run.
 */

/*
 * Every route the sitemap-driven sweeps cover, plus the Indonesian project
 * page: the defect is layout-driven rather than locale-driven, but the
 * bilingual contract is load-bearing here and ID sets longer strings, which
 * wrap differently and put different text under the same sticky row.
 */
const ROUTES = [
  '/en',
  '/en/work',
  '/en/work/arus-balik',
  '/en/studio',
  '/en/journal',
  '/en/journal/scope-is-the-deliverable',
  '/en/practice/consulting',
  '/id/work/arus-balik',
] as const

/**
 * Scroll positions sampled per route, spread evenly through the document.
 *
 * Bounded rather than "every 0.85 screens to the end": a sticky element is
 * over the same band of content for hundreds of pixels, so six samples find
 * it, and an unbounded sweep makes this the slowest spec in the suite for no
 * extra coverage.
 */
const MAX_STOPS = 6

/** Sample every other pixel. Glyph boxes are tens of pixels across. */
const STRIDE = 2

/** Candidate backdrops each run hands back for the real verdict. */
const CANDIDATES = 8

interface Collected {
  label: string
  tag: string
  sizePx: number
  weight: number
  fg: Rgb
  alpha: number
  boxes: { x: number; y: number; w: number; h: number }[]
}

interface Sampled extends Collected {
  candidates: Rgb[]
  /** The in-page search's own answer, used only to cross-check the module. */
  searchRatio: number
}

interface Scan {
  /** Device pixels per CSS pixel, as the bitmap actually came back. */
  scale: number
  sampled: Sampled[]
}

const HIDE_GLYPHS = `*, *::before, *::after {
  color: transparent !important;
  text-shadow: none !important;
  -webkit-text-fill-color: transparent !important;
  caret-color: transparent !important;
}`

function collectRuns(): Collected[] {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  // Whatever colour space the stylesheet authored in, this is the sRGB the
  // compositor will paint. Parsing the string is what broke the first draft.
  const resolve = (css: string) => {
    ctx.globalCompositeOperation = 'copy'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return { fg: { r: r ?? 0, g: g ?? 0, b: b ?? 0 }, alpha: (a ?? 255) / 255 }
  }

  const out: Collected[] = []
  for (const el of document.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE)$/.test(el.tagName)) continue
    if (el.closest('[aria-hidden="true"]')) continue
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    // Mid-reveal text is not a contrast claim; it is a frame of an animation.
    if (Number(style.opacity) < 0.5) continue

    // Only the element that directly owns the characters, so a wrapper is not
    // judged for text its child paints in another colour.
    const texts = [...el.childNodes].filter(
      (node) => node.nodeType === 3 && (node.textContent ?? '').trim() !== ''
    )
    if (texts.length === 0) continue

    const boxes: Collected['boxes'] = []
    for (const node of texts) {
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const rect of range.getClientRects()) {
        if (rect.width < 4 || rect.height < 4) continue
        if (rect.top >= innerHeight || rect.bottom <= 0) continue
        if (rect.left >= innerWidth || rect.right <= 0) continue
        // Glyph bodies do not reach the line box edge, and the edge is where a
        // neighbouring border or rule lands.
        const pad = Math.min(2, rect.height / 4)
        const x = Math.max(0, Math.ceil(rect.left + 1))
        const y = Math.max(0, Math.ceil(rect.top + pad))
        const w = Math.floor(Math.min(rect.right - 1, innerWidth)) - x
        const h = Math.floor(Math.min(rect.bottom - pad, innerHeight)) - y
        if (w < 3 || h < 3) continue
        boxes.push({ x, y, w, h })
      }
    }
    if (boxes.length === 0) continue

    const { fg, alpha } = resolve(style.color)
    if (alpha === 0) continue
    out.push({
      label: texts
        .map((node) => node.textContent)
        .join(' ')
        .trim()
        .slice(0, 40)
        .replace(/\s+/g, ' '),
      tag: el.tagName,
      sizePx: Number.parseFloat(style.fontSize),
      weight: Number(style.fontWeight) || 400,
      fg,
      alpha,
      boxes,
    })
  }
  return out
}

/*
 * The in-page pass is a **search**, not the verdict.
 *
 * It needs a luminance function to find which backdrop pixel is worst, but
 * `contrast-situ.ts` owns the answer: this hands back its worst few candidates
 * and its own ratio, `worstContrast()` re-derives the number in Node, and the
 * test asserts the two agree. A transcription drift here fails loudly instead
 * of quietly under-reporting.
 */
function sampleRuns(input: {
  runs: Collected[]
  shot: string
  stride: number
  keep: number
}): Promise<Scan> {
  const { runs, shot, stride, keep } = input
  return new Promise<Scan>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('error', () => {
      reject(new Error('the backdrop screenshot did not decode'))
    })
    image.addEventListener('load', () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return reject(new Error('no 2d context for the backdrop'))
      ctx.drawImage(image, 0, 0)
      const { data, width, height } = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const linear = (channel: number) => {
        const c = channel / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      const lum = (r: number, g: number, b: number) =>
        0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

      /*
       * The bitmap is in DEVICE pixels; the boxes are in CSS pixels.
       *
       * The mobile project runs `deviceScaleFactor: 3` (iPhone 13 metrics), so
       * reading a CSS coordinate straight out of the bitmap samples the
       * top-left ninth of the screen and judges every run against a backdrop
       * belonging to some other part of the page. That was this gate's third
       * false red, and it failed all eight routes convincingly — including
       * 1.00:1 on journal body prose that is near-black on a near-white
       * ground, which is what gave it away.
       */
      const scale = width / innerWidth
      // Keep the sampling density constant in CSS pixels rather than device
      // ones, so a 3x viewport does not cost nine times the work.
      const step = Math.max(1, Math.round(stride * scale))

      const out: Sampled[] = []
      for (const run of runs) {
        const found: { ratio: number; bg: Rgb }[] = []
        for (const box of run.boxes) {
          const bx = Math.round(box.x * scale)
          const by = Math.round(box.y * scale)
          const bw = Math.max(1, Math.round(box.w * scale))
          const bh = Math.max(1, Math.round(box.h * scale))
          for (let y = by; y < Math.min(by + bh, height); y += step) {
            for (let x = bx; x < Math.min(bx + bw, width); x += step) {
              const i = (y * width + x) * 4
              const br = data[i] ?? 0
              const bg = data[i + 1] ?? 0
              const bb = data[i + 2] ?? 0
              const a = run.alpha
              const fr = a * run.fg.r + (1 - a) * br
              const fg = a * run.fg.g + (1 - a) * bg
              const fb = a * run.fg.b + (1 - a) * bb
              const lf = lum(fr, fg, fb)
              const lb = lum(br, bg, bb)
              const ratio =
                (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05)
              found.push({ ratio, bg: { r: br, g: bg, b: bb } })
            }
          }
        }
        if (found.length === 0) continue
        found.sort((a, b) => a.ratio - b.ratio)
        const worst = found[0]
        if (!worst) continue
        out.push({
          ...run,
          candidates: found.slice(0, keep).map((entry) => entry.bg),
          searchRatio: worst.ratio,
        })
      }
      resolve({ scale, sampled: out })
    })
    image.src = shot
  })
}

for (const route of ROUTES) {
  test(`text on ${route} is readable against what is painted behind it`, async ({
    page,
  }, testInfo) => {
    // Six stops, a screenshot each, decoded and scanned in-page.
    test.setTimeout(120_000)

    await page.goto(route, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1600)

    const viewport = page.viewportSize()
    const height = viewport?.height ?? 720
    const label = `${route} ${viewport?.width ?? 0}px`

    const ratio = await page.evaluate(() => window.devicePixelRatio)
    const documentHeight = await page.evaluate(
      () => document.documentElement.scrollHeight
    )
    const travel = Math.max(0, documentHeight - height)
    const stops =
      travel === 0
        ? [0]
        : Array.from({ length: MAX_STOPS }, (_, index) =>
            Math.round((travel * index) / (MAX_STOPS - 1))
          )

    const measured: TextRun[] = []
    let drift = 0

    for (const stop of stops) {
      await page.evaluate((y) => window.scrollTo(0, y), stop)
      await page.waitForTimeout(1100)

      const runs = await page.evaluate(collectRuns)
      if (runs.length === 0) continue

      const hidden = await page.addStyleTag({ content: HIDE_GLYPHS })
      await page.waitForTimeout(250)
      const shot = await page.screenshot()
      await hidden.evaluate((node) => {
        ;(node as HTMLStyleElement).remove()
      })

      const scan = await page.evaluate(sampleRuns, {
        runs,
        shot: `data:image/png;base64,${shot.toString('base64')}`,
        stride: STRIDE,
        keep: CANDIDATES,
      })

      /*
       * Anti-vacuum for the bug above: if the bitmap ever stops lining up with
       * the coordinate space the boxes are in, every number below is measured
       * somewhere else on the page. Assert the mapping rather than trust it.
       */
      expect(
        scan.scale,
        `the backdrop bitmap is ${scan.scale}x the CSS viewport, not the ${ratio}x this context renders at — every sample would land somewhere else on the page`
      ).toBeCloseTo(ratio, 3)

      for (const run of scan.sampled) {
        const worst = worstContrast(run.fg, run.alpha, run.candidates)
        // `worstContrast` returns undefined for an empty candidate list rather
        // than a sentinel, so "nothing measured" cannot pass as "nothing
        // wrong" — the exact failure that made this gate's first draft green.
        expect(
          worst,
          `no backdrop sampled under "${run.label}" at ${label} @${stop}`
        ).toBeDefined()
        if (!worst) continue

        if (Math.abs(worst.ratio - run.searchRatio) > 1e-6) drift += 1

        measured.push({
          label: run.label,
          where: `${label} @${stop}`,
          tag: run.tag,
          sizePx: run.sizePx,
          weight: run.weight,
          ratio: worst.ratio,
        })
      }
    }

    expect(
      measured.length,
      `nothing measurable on ${label} — a route with no readable text is a defect, not a pass`
    ).toBeGreaterThan(0)

    // The in-page search and the tested module must agree about every pixel
    // they both looked at. If they ever do not, the number below is not a
    // contrast result, it is a bug in one of the two.
    expect(
      drift,
      `${drift} run(s) where the in-page search and contrast-situ.ts disagreed`
    ).toBe(0)

    await testInfo.attach('contrast-situ', {
      body: `${label}: ${measured.length} text runs, worst ${Math.min(
        ...measured.map((run) => run.ratio)
      ).toFixed(2)}:1`,
      contentType: 'text/plain',
    })

    expect(contrastFaults(measured), `contrast faults on ${label}`).toEqual([])
  })
}

test('the maths this gate trusts is the maths it ships', () => {
  /*
   * Anti-vacuum. Every assertion above routes through `contrast-situ.ts`, so
   * a module that silently returned "no faults" would make all eight routes
   * green. This is the cheapest possible proof that it still bites, and it
   * runs even when the site is unreachable.
   */
  const pale = { r: 244, g: 243, b: 239 }
  const ink = { r: 246, g: 245, b: 241 }
  expect(contrastRatio(compositeOver(ink, pale, 0.75), pale)).toBeLessThan(1.5)
  expect(
    contrastFaults([
      {
        label: 'Images',
        where: 'synthetic',
        tag: 'A',
        sizePx: 11.01,
        weight: 400,
        ratio: 1.48,
      },
    ]).length
  ).toBe(1)
})
