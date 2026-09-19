#!/usr/bin/env bun
/**
 * The motion budget, counted from the source rather than remembered.
 *
 * `DIREKSI.md` §2.2 raised the choreographed-moment ceiling from three to
 * twelve on the brand routes, and eighteen stages later `HANDOFF.md` §4 had to
 * measure by hand how much of that had actually been spent. A number nobody can
 * regenerate is a number that drifts, and this repository has paid for that
 * shape three times: `ROADMAP.md`'s status line was wrong three times by its
 * own admission, and `DESIGN-SYSTEM.md` §7 described a system nobody had built
 * for twenty-six stages.
 *
 * So this is the third instance of a pattern that already works twice here, not
 * a new mechanism: `rule-coverage.ts` writes a block into `CLAUDE.md` and
 * `rule-coverage.test.ts` fails when it drifts; `design-debt.ts` does the same
 * for `DESIGN-SYSTEM.md` §7. This does it for `DIREKSI.md`.
 *
 * ## What it can see, and what it cannot
 *
 * It reads source. That is a deliberate boundary, not a limitation it hides:
 * a static scan is fast enough to live inside `bun test`, where a browser is
 * not. What it therefore cannot see is stated **inside the generated block**,
 * because an instrument that hides the edge of its own vision is exactly the
 * defect §7 of `DESIGN-SYSTEM.md` cost twenty-six stages to find.
 *
 *   - **moments per route** needs a render; that is `epic-sequence.e2e.ts`;
 *   - **quality** is not countable at all. A count cannot tell a moment a page
 *     needed from one added to spend a budget, and `DIREKSI.md` §2.1 already
 *     names that failure: "hero lebih tinggi dengan isi yang sama bukan lebih
 *     memukau, melainkan lebih kosong".
 *
 * ## Imports, not mentions
 *
 * The parallax count matches an **import** of `useParallax`. The first version
 * of this scan matched the word and returned six files, three of which were
 * prose — `vault/motion/flip/index.ts` discusses parallax in a comment. That is
 * the same false positive `TAHAP-78.md` §1.3 recorded twice, so the rule here
 * is the narrow one.
 *
 * Run with `--write` to regenerate the block; `design-scoreboard.test.ts` fails
 * if the committed block has drifted from what this produces.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/*
 * `join(import.meta.dir, …)`, never a file URL's `pathname` — on Windows that
 * reads `/D:/HELLO%20Project/…` and every read through it fails ENOENT. It cost
 * `design-debt.ts` nine silently unregistered tests before it was caught.
 */
const ROOT = join(import.meta.dir, '..', '..')

/** Source trees a reader's browser actually runs. */
const SOURCE_GLOBS = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'vault/**/*.tsx',
  'vault/**/*.ts',
  'components/**/*.tsx',
  'components/**/*.ts',
  /*
   * Stylesheets, for the sticky hold alone.
   *
   * Added because leaving them out made one of the two counts depend on an
   * accident. `position: sticky` is a CSS declaration, so a block that holds a
   * section declares it in its `.module.css` — `capability-set` was only found
   * because it *also* names it in a comment in `index.tsx`, while
   * `project-spine` declares it in CSS only and went unseen.
   *
   * A count that finds a thing when someone happened to mention it elsewhere
   * is not a count. The moment and parallax scans stay TypeScript-only, which
   * is where `data-epic` and an import can actually live.
   */
  'app/**/*.css',
  'vault/**/*.css',
  'components/**/*.css',
]

/**
 * Every scanned file, normalised to `/`.
 *
 * `Bun.Glob` emits backslash paths on Windows, which silently switches off any
 * forward-slash rule applied to its output. `generate-manifest.ts` documents
 * the same hazard beside its own glob.
 */
function sources(): { path: string; text: string }[] {
  const seen = new Set<string>()
  const files: { path: string; text: string }[] = []

  for (const pattern of SOURCE_GLOBS) {
    for (const scanned of new Bun.Glob(pattern).scanSync({ cwd: ROOT })) {
      const path = scanned.replaceAll('\\', '/')
      if (seen.has(path)) continue
      seen.add(path)
      files.push({ path, text: readFileSync(join(ROOT, path), 'utf8') })
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path))
}

/** A story is a catalogue entry, not a page a reader reaches. */
const isStory = (path: string) =>
  path.includes('.stories.') || path.includes('.test.')

export interface Scoreboard {
  /** Distinct `data-epic` names across the source. */
  moments: string[]
  /** Files importing `useParallax`, stories excluded. */
  parallaxConsumers: string[]
  /** Files creating a pinned ScrollTrigger. */
  pinned: string[]
  /** Files holding a section with `position: sticky` — the other pin. */
  sticky: string[]
}

/** Distinct moment names, from the attribute the gates read. */
export function momentNames(text: string): string[] {
  return [...text.matchAll(/data-epic="([a-z-]+)"/g)].map(
    (match) => match[1] ?? ''
  )
}

/** True when a file *imports* the hook, rather than merely discussing it. */
export function importsParallax(text: string): boolean {
  return /import\s*\{[^}]*\buseParallax\b[^}]*\}\s*from/.test(text)
}

/** True when a file creates a pinned ScrollTrigger. */
export function declaresPin(text: string): boolean {
  return /\bpin:\s*true\b/.test(text)
}

/**
 * True when a file holds a section in place with `position: sticky`.
 *
 * ## Counted separately, because the first version missed it entirely
 *
 * This scan shipped counting only `pin: true` and reported **2**. That was an
 * undercount, found the day after: `MOTION-SPEC.md` §9.5 calls
 * `practice-capabilities` "this route's first pin", and
 * `capability-set.module.css` implements it with `position: sticky` — the
 * comment directly above that declaration reads "The pin."
 *
 * Both mechanisms do the thing the budget is about: hold a section while the
 * scroll passes it. `ui-ux-pro-max` warns against more than one or two such
 * sections per page and does not care which API produced them.
 *
 * They are reported on **separate lines rather than summed**, because a
 * scanner cannot tell a held *moment* from sticky chrome — `project-spine` is
 * a navigation rail, not a choreographed beat. Summing them would produce a
 * number that reads like a budget and is not one.
 */
export function declaresSticky(text: string): boolean {
  return /position:\s*sticky/.test(text)
}

export function scan(files = sources()): Scoreboard {
  const moments = new Set<string>()
  const parallaxConsumers: string[] = []
  const pinned: string[] = []
  const sticky: string[] = []

  for (const { path, text } of files) {
    if (isStory(path)) continue
    for (const name of momentNames(text)) moments.add(name)
    if (importsParallax(text)) parallaxConsumers.push(path)
    if (declaresPin(text)) pinned.push(path)
    /*
     * Deduped to the directory, because a block declares its hold across two
     * files — `capability-set/index.tsx` and `capability-set.module.css` are
     * one held section, not two. Counting files here inflated the number the
     * moment stylesheets were added to the scan.
     */
    if (declaresSticky(text)) sticky.push(path.replace(/\/[^/]+$/, ''))
  }

  return {
    moments: [...moments].sort(),
    parallaxConsumers,
    pinned,
    sticky: [...new Set(sticky)].sort(),
  }
}

/** The block body. Its last paragraph is the part that matters most. */
export function renderScoreboard(board: Scoreboard): string {
  const shorten = (path: string) => path.replace(/\/index\.tsx?$/, '')

  return [
    '```',
    `momen berkoreografi bernama berbeda   ${board.moments.length}`,
    ...board.moments.map((name) => `  ${name}`),
    '',
    `blok mengonsumsi useParallax          ${board.parallaxConsumers.length}`,
    ...board.parallaxConsumers.map((path) => `  ${shorten(path)}`),
    '',
    `section ter-pin (ScrollTrigger)       ${board.pinned.length}`,
    ...board.pinned.map((path) => `  ${shorten(path)}`),
    '',
    `section tertahan (position: sticky)   ${board.sticky.length}`,
    ...board.sticky.map((path) => `  ${shorten(path)}`),
    '```',
    '',
    '**Yang angka-angka ini TIDAK bisa lihat.** Ia memindai sumber, bukan',
    'halaman yang dirender, jadi ia tidak tahu **berapa momen yang jatuh pada',
    'satu rute** — itu pekerjaan `e2e/epic-sequence.e2e.ts`, yang menuntut dua',
    'momen bernama beda tidak menempati rentang gulir yang sama.',
    '',
    'Dua baris terakhir **tidak dijumlahkan**, dan itu disengaja. Keduanya',
    'menahan section saat gulir lewat, jadi keduanya masuk anggaran yang sama —',
    'tapi sebuah pemindai tidak bisa membedakan **momen** yang ditahan dari',
    'kerangka yang kebetulan sticky: `project-spine` adalah rel navigasi, bukan',
    'ketukan berkoreografi. Menjumlahkannya menghasilkan angka yang terbaca',
    'seperti anggaran padahal bukan.',
    '',
    'Dan ia sama sekali tidak bisa melihat **kualitas**. Sebuah hitungan tidak',
    'bisa membedakan momen yang halaman ini butuhkan dari momen yang ditambahkan',
    'untuk membelanjakan anggaran — dan §2.1 sudah menamai bentuk kesalahan itu.',
    'Angka naik bukan bukti situsnya membaik.',
  ].join('\n')
}

/** The block in `docs/DIREKSI.md`, between its markers. */
const START = '<!-- design-scoreboard:start -->'
const END = '<!-- design-scoreboard:end -->'
const DOC = 'docs/DIREKSI.md'

/** Replace the generated block, leaving everything around it untouched. */
export function writeDocBlock(markdown: string, body: string): string {
  const start = markdown.indexOf(START)
  const end = markdown.indexOf(END)
  if (start < 0 || end < 0) {
    throw new Error(`${DOC} is missing ${START} / ${END}`)
  }
  const head = markdown.slice(0, start + START.length)
  const tail = markdown.slice(end)
  return `${head}\n\n${body}\n\n${tail}`
}

/** Read the doc's current block body, or `undefined` if the markers are gone. */
export function readDocBlock(markdown: string): string | undefined {
  const start = markdown.indexOf(START)
  const end = markdown.indexOf(END)
  if (start < 0 || end < 0) return undefined
  return markdown.slice(start + START.length, end).trim()
}

export { DOC, END, START }

if (import.meta.main && process.argv.includes('--write')) {
  const { writeFileSync } = await import('node:fs')
  const path = join(ROOT, DOC)
  const source = readFileSync(path, 'utf8')
  const next = writeDocBlock(source, renderScoreboard(scan()))

  if (next === source) {
    console.log(`${DOC}: design-scoreboard block already current`)
  } else {
    writeFileSync(path, next)
    console.log(`${DOC}: design-scoreboard block updated`)
  }
}
