/**
 * Renders the site's brand assets from the design system, rather than from a
 * design file nobody in this repo can open.
 *
 * ## Why a script and not four committed images
 *
 * The images this replaces were the Satūs starter's: a red mark and a
 * 1200×630 card reading "SATŪS — NEXT.JS STARTER". They survived every gate
 * in the project, because no gate reads a JPEG. They were also *red*, the one
 * hue `lib/styles/colors.ts` deliberately removed — so the share card
 * contradicted the palette on the page it linked to.
 *
 * Generating them means the wordmark, the ground, and the type can never
 * drift from `lib/styles/colors.ts` and `lib/styles/fonts.ts`. Change the
 * studio's name or the ink, re-run this, and the share card follows.
 *
 * ## Fonts come from the build output, deliberately
 *
 * `next/font/google` downloads Syne and Geist Mono into `.next/static/media`
 * at build time and writes an `@font-face` block naming each subset. This
 * script parses that block and inlines the *latin* subset as a data URI, so
 * the rendered asset uses byte-for-byte the same font file the site serves —
 * and needs no network of its own.
 *
 * Requires a build first (`bun run build`). It says so rather than silently
 * falling back to a system sans, which would produce a plausible-looking card
 * in the wrong typeface.
 *
 *   bun lib/scripts/generate-brand-assets.ts
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { chromium } from 'playwright-core'

import { SITE } from '../seo/site'
import { colors } from '../styles/colors'

const CHUNKS_DIR = '.next/static/chunks'
const MEDIA_DIR = '.next/static/media'

/*
 * The name is read from `lib/seo/site.ts`, not retyped here — that file is
 * the single source of truth for entity copy, and a share card that spells
 * the studio differently from the JSON-LD is the exact drift this whole
 * stage was about.
 */
const WORDMARK = SITE.name
const EYEBROW = 'Agency'
const PRACTICES_LINE = 'Consulting · AI & Data · Commission'

interface InlineFont {
  family: string
  dataUri: string
}

/**
 * Finds the latin subset of one family in the build's `@font-face` blocks.
 *
 * Google serves each family as several files split by `unicode-range`. The
 * latin one is identifiable by `U+??` — Google's shorthand for U+0000–00FF —
 * and is the only subset a Latin wordmark needs. Picking the first match
 * instead would silently return the Greek or Cyrillic file, whose glyphs for
 * `A` and `r` do not exist, and the render would fall back to a system face
 * without erroring.
 */
async function inlineLatinSubset(family: string): Promise<InlineFont> {
  const files = await readdir(CHUNKS_DIR).catch(() => {
    throw new Error(
      `No ${CHUNKS_DIR}. Run \`bun run build\` first — this script reads the fonts the build downloaded.`
    )
  })

  const pattern = new RegExp(
    `@font-face\\{font-family:${family};[^}]*?src:url\\(\\.\\./media/([^)]+)\\)[^}]*?unicode-range:U\\+\\?\\?`
  )

  for (const file of files.filter((name) => name.endsWith('.css'))) {
    const css = await readFile(join(CHUNKS_DIR, file), 'utf8')
    const match = css.match(pattern)
    if (!match?.[1]) continue

    const woff2 = await readFile(join(MEDIA_DIR, match[1]))
    return {
      family,
      dataUri: `data:font/woff2;base64,${woff2.toString('base64')}`,
    }
  }

  throw new Error(
    `No latin @font-face for "${family}" in ${CHUNKS_DIR}. Did the font change in lib/styles/fonts.ts?`
  )
}

function fontFaces(fonts: readonly InlineFont[]): string {
  return fonts
    .map(
      ({ family, dataUri }) => `@font-face {
      font-family: '${family}';
      src: url(${dataUri}) format('woff2');
      font-weight: 100 900;
      font-display: block;
    }`
    )
    .join('\n')
}

/**
 * The share card: 1200×630, ink ground, one wordmark, no ornament.
 *
 * Deliberately close to the site's own hero — the same two neutrals, the same
 * display face at the same tight tracking, mono for the metadata line. A
 * share card that looks like a different product than the page it opens is
 * the tell that it was made somewhere else.
 */
function ogCard(fonts: readonly InlineFont[]): string {
  return `<!doctype html>
  <meta charset="utf-8" />
  <style>
    ${fontFaces(fonts)}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px;
      background: ${colors.ink}; color: ${colors.paper};
      font-family: 'Syne', sans-serif;
      display: flex; flex-direction: column; justify-content: space-between;
      padding: 76px 88px 72px;
      -webkit-font-smoothing: antialiased;
    }
    .eyebrow, .mediums {
      font-family: 'Geist Mono', monospace;
      font-size: 20px; font-weight: 400;
      text-transform: uppercase; letter-spacing: 0.2em;
      color: color-mix(in oklab, ${colors.paper} 58%, transparent);
      white-space: nowrap;
    }
    /*
     * -0.01em, not the -0.04em that lib/styles/typography.ts sets on h1.
     * That tracking is tuned for Syne at heading size; at 200px and weight
     * 800 the same value pulls the r terminal into the t stem, which the
     * first render of this card did visibly.
     */
    .wordmark {
      font-size: 200px; font-weight: 800;
      line-height: 0.82; letter-spacing: -0.01em;
    }
    .row {
      display: flex; align-items: center; gap: 36px;
    }
    .rule {
      flex: 1; height: 1px;
      background: color-mix(in oklab, ${colors.paper} 20%, transparent);
    }
  </style>
  <div class="row">
    <span class="eyebrow">${EYEBROW}</span>
    <span class="rule"></span>
  </div>
  <div class="wordmark">${WORDMARK}</div>
  <div class="row">
    <span class="mediums">${PRACTICES_LINE}</span>
    <span class="rule"></span>
  </div>`
}

/**
 * The icon, at whatever size the manifest declares.
 *
 * One letterform, because the realistic display size is a 16px browser tab.
 * The optical nudge is real: Syne's `A` sits visually low inside its em box,
 * and a mathematically centred one reads as bottom-heavy at tab size.
 */
function iconMark(fonts: readonly InlineFont[], size: number): string {
  return `<!doctype html>
  <meta charset="utf-8" />
  <style>
    ${fontFaces(fonts)}
    * { margin: 0; padding: 0; }
    body {
      width: ${size}px; height: ${size}px;
      background: ${colors.ink}; color: ${colors.paper};
      font-family: 'Syne', sans-serif;
      display: flex; align-items: center; justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    span {
      font-size: ${Math.round(size * 0.58)}px;
      font-weight: 800; line-height: 1;
      transform: translateY(${(size * 0.03).toFixed(1)}px);
    }
  </style>
  <span>${WORDMARK.charAt(0)}</span>`
}

const TARGETS = [
  { path: 'app/opengraph-image.png', width: 1200, height: 630, html: ogCard },
  {
    path: 'app/icon.png',
    width: 192,
    height: 192,
    html: (f: readonly InlineFont[]) => iconMark(f, 192),
  },
  {
    path: 'app/apple-icon.png',
    width: 180,
    height: 180,
    html: (f: readonly InlineFont[]) => iconMark(f, 180),
  },
] as const

async function main() {
  const fonts = await Promise.all([
    inlineLatinSubset('Syne'),
    inlineLatinSubset('Geist Mono'),
  ])

  const browser = await chromium.launch()
  try {
    for (const target of TARGETS) {
      const page = await browser.newPage({
        viewport: { width: target.width, height: target.height },
        // The assets are flat colour and type; a 2x render would only make
        // the files bigger, and the sizes are fixed by `app/manifest.ts`.
        deviceScaleFactor: 1,
      })
      await page.setContent(target.html(fonts))
      // The faces are inlined, so this resolves immediately — but without it
      // a first paint can land before the @font-face is applied.
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: target.path, type: 'png' })
      await page.close()
      console.log(`✓ ${target.path}  ${target.width}×${target.height}`)
    }
  } finally {
    await browser.close()
  }
}

await main()
