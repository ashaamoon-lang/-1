/**
 * The numbers in `docs/DESIGN-SYSTEM.md` §7, measured instead of asserted.
 *
 * ## Why this exists
 *
 * §7 is the table of places where the design document and the code disagree.
 * Its own opening line says why it is there: *"a design document that
 * describes a system nobody built is worse than no document."*
 *
 * Every number in it was wrong. Measured at Tahap 73, twenty-six stages after
 * the audit that produced them:
 *
 * ```
 * claimed  seven stylesheets hand-write their type   ->  one
 * claimed  six per-line exemptions remain            ->  seven
 * claimed  25 component directories have no story    ->  fifteen of 55
 * claimed  "including five vault blocks"             ->  zero; 16 of 16 have one
 * claimed  closes in Tahap 45c / Tahap 46            ->  both shipped long ago
 * ```
 *
 * Nothing had gone wrong in the code. What was missing is that **nothing ever
 * read those numbers again**: `grep -rl "stories.tsx"` across `e2e/`, `lib/`,
 * `tools/` and `.storybook/` returns nothing, and `manifest:check` — which
 * does run on every `bun run check` — counts components, not stories. A rule
 * with no instrument (§6.4) and a debt note with no instrument (§7) drifted
 * for twenty-six stages in the one document whose job is to not drift.
 *
 * So the counts are generated here and checked against the file, exactly the
 * way `COMPONENTS.md` already works. A stale number now fails `bun run check`
 * instead of waiting for someone to re-audit by hand.
 *
 * ## The counting rules, written down because they did not exist
 *
 * "Six per-line exemptions" could not be verified — not because the repo is
 * unclear, but because nobody had ever said how to count. Nine `scale-exempt:`
 * sites exist; two are the mobile half of a pair and say so, and one is prose
 * *about* the escape hatch rather than a use of it. Six, seven or nine, all
 * defensible. A number with no counting rule cannot be wrong, and therefore
 * cannot be right either. The rules below are the point of this module as much
 * as the scan is.
 */

import { readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

/*
 * `join(import.meta.dir, …)`, never `new URL(…).pathname`.
 *
 * A file URL's `pathname` is a URL component, not a path: on Windows it comes
 * back as `/D:/HELLO%20Project/arth/` — leading slash, percent-encoded space —
 * and every read through it fails `ENOENT`. Here that threw at module scope,
 * so the nine tests in `design-debt.test.ts` were never registered at all and
 * `bun test` reported one synthetic failure in their place. A gate that does
 * not run is not a gate, and this one did not run on any Windows checkout.
 */
const ROOT = join(import.meta.dir, '..', '..')

/** Normalised to `/` so the regexes below match on Windows too — the same
 *  hazard `generate-manifest.ts` documents for `Bun.Glob`. */
function glob(pattern: string): string[] {
  return [...new Bun.Glob(pattern).scanSync({ cwd: ROOT, absolute: true })]
    .map((path) => path.replaceAll('\\', '/'))
    .sort()
}

const rel = (path: string) => relative(ROOT, path).replaceAll('\\', '/')

/**
 * A component directory that is allowed to have no story, and why.
 *
 * §6.4 says "every primitive gets a Storybook story" and never says what a
 * primitive is, so it read as "every component directory" — which was never
 * true and never enforced. These are the directories that have no rendering of
 * their own to catalogue. Kept as data rather than prose for one reason: an
 * exemption you can count is an exemption someone has to justify in a diff.
 */
export const STORY_EXEMPT: readonly { dir: string; because: string }[] = [
  {
    dir: 'components/layout/lenis',
    because: 'a RAF provider — it renders nothing of its own',
  },
  {
    dir: 'components/layout/theme',
    because: 'writes `data-theme` onto <html>; the catalogue sets that itself',
  },
  {
    dir: 'components/layout/wrapper',
    because: 'composes the page shell around a route; there is no component',
  },
  {
    dir: 'components/layout/header',
    because:
      'needs routing, the locale switcher and the search index; a story would mock all three and document the mock',
  },
  {
    dir: 'components/layout/footer',
    because: 'same as the header — routing and the route catalogue',
  },
  {
    dir: 'components/ui/real-viewport',
    because: 'measures the viewport and sets a CSS variable; no rendering',
  },
  {
    dir: 'components/ui/route-loading',
    because: 'bound to the router transition, which the catalogue has no',
  },
  {
    dir: 'components/ui/not-configured',
    because:
      'the "no CMS configured" fallback. Zero consumers and scheduled for deletion — the one remaining `scale-exempt-file:` is in this same directory',
  },
  {
    dir: 'components/ui/image',
    because: 'a thin next/image wrapper; `sanity-image` is the one to document',
  },
  {
    dir: 'components/ui/sanity-image',
    because:
      'renders `null` without a live Sanity asset reference, and the catalogue has none',
  },
  {
    dir: 'vault/webgl/scene-shell',
    because:
      'paints nothing itself — it portals into the shared canvas the site Wrapper provides, and the catalogue has no such provider. Measured at Tahap 73: the story mounts, takes the WebGL path, sets `data-accent-live`, and the document contains zero canvas elements',
  },
  {
    dir: 'vault/webgl/material-image',
    because:
      'its entire substance is a WebGL material over a Sanity texture. Without an asset `SanityImage` returns null, the scene has nothing to sample, and the story documents an empty div — measured at Tahap 73 rather than assumed',
  },
  {
    dir: 'components/effects/progress-text',
    because: 'driven by scroll progress supplied by a pinned parent',
  },
]

export interface ScaleExemption {
  readonly file: string
  readonly line: number
  /** A cross-reference to another marker ("see the note above"), not its own
   *  exemption. Counted as a site, never as an exemption. */
  readonly crossReference: boolean
}

export interface DesignDebt {
  /** `.css` files carrying a whole-file `scale-exempt-file:` marker. */
  readonly exemptFiles: string[]
  /** Every `scale-exempt:` marker site, cross-references included. */
  readonly exemptSites: ScaleExemption[]
  /** Directories under `vault/` or `components/` holding an `index.tsx`. */
  readonly componentDirs: string[]
  /** Of those, the ones with no `*.stories.tsx` and no entry in `STORY_EXEMPT`. */
  readonly missingStory: string[]
  /** Entries of `STORY_EXEMPT` that no longer describe reality — the
   *  directory gained a story, or moved, or was deleted. An exemption list
   *  nobody prunes is the next thing to rot. */
  readonly staleExemptions: string[]
}

/** Exemptions, not sites: a cross-reference points at one of these. */
export function realExemptions(debt: DesignDebt): ScaleExemption[] {
  return debt.exemptSites.filter((site) => !site.crossReference)
}

/**
 * Is this `scale-exempt:` the *marker* of an exemption, or prose mentioning it?
 *
 * A marker opens the comment: `/* scale-exempt: … ` or ` * scale-exempt: … `.
 * `vault/motion/horizontal` discusses the escape hatch mid-sentence, in
 * backticks — a mention, not a use. Without this rule that file counts as an
 * exemption it does not have.
 */
function isMarker(line: string): boolean {
  return /^\s*(?:\/\*+|\*|\/\/)?\s*scale-exempt:/.test(line)
}

export function scanDesignDebt(): DesignDebt {
  const sheets = glob('{app,components,lib,vault}/**/*.css')

  const exemptFiles: string[] = []
  const exemptSites: ScaleExemption[] = []

  for (const sheet of sheets) {
    const source = readFileSync(sheet, 'utf-8')
    if (source.includes('scale-exempt-file:')) exemptFiles.push(rel(sheet))

    source.split('\n').forEach((line, index) => {
      if (line.includes('scale-exempt-file:')) return
      if (!line.includes('scale-exempt:')) return
      if (!isMarker(line)) return
      exemptSites.push({
        file: rel(sheet),
        line: index + 1,
        crossReference: /see the note/i.test(line),
      })
    })
  }

  const componentDirs = [
    ...new Set(
      [...glob('vault/**/index.tsx'), ...glob('components/**/index.tsx')].map(
        (file) => rel(dirname(file))
      )
    ),
  ].sort()

  const hasStory = new Set(
    [
      ...glob('vault/**/*.stories.tsx'),
      ...glob('components/**/*.stories.tsx'),
    ].map((file) => rel(dirname(file)))
  )

  const exempt = new Set(STORY_EXEMPT.map((entry) => entry.dir))

  return {
    exemptFiles: exemptFiles.sort(),
    exemptSites,
    componentDirs,
    missingStory: componentDirs.filter(
      (dir) => !hasStory.has(dir) && !exempt.has(dir)
    ),
    staleExemptions: [...exempt]
      .filter((dir) => !componentDirs.includes(dir) || hasStory.has(dir))
      .sort(),
  }
}

/**
 * The block written into `docs/DESIGN-SYSTEM.md` between its markers.
 *
 * A fenced block rather than a table on purpose: `oxfmt` formats markdown,
 * including reflowing table columns, so a generated table would fight the
 * formatter every time a name changed length. Nothing inside a fence is
 * touched.
 */
export function renderDesignDebt(debt: DesignDebt): string {
  const exemptions = realExemptions(debt)
  const crossRefs = debt.exemptSites.length - exemptions.length
  const pad = (label: string) => label.padEnd(24)

  return [
    '```',
    `${pad('scale-exempt-file')}${debt.exemptFiles.length} stylesheet(s) hand-write their type`,
    `${pad('scale-exempt (per line)')}${exemptions.length} exemption(s) across ${new Set(exemptions.map((site) => site.file)).size} file(s)`,
    `${pad('')}${debt.exemptSites.length} marker site(s); ${crossRefs} cross-reference(s) to another marker`,
    `${pad('no Storybook story')}${debt.missingStory.length} of ${debt.componentDirs.length} component directories`,
    `${pad('')}${STORY_EXEMPT.length} exempt by rule, each with a reason in lib/scripts/design-debt.ts`,
    '```',
  ].join('\n')
}

export const DOC = 'docs/DESIGN-SYSTEM.md'
const START = '<!-- design-debt:start -->'
const END = '<!-- design-debt:end -->'

/** The block currently in the document, or `undefined` if the markers are gone. */
export function readDocBlock(source: string): string | undefined {
  const start = source.indexOf(START)
  const end = source.indexOf(END)
  if (start === -1 || end === -1 || end < start) return undefined
  return source.slice(start + START.length, end).trim()
}

/** The document with its block replaced by `block`. */
export function writeDocBlock(source: string, block: string): string {
  const start = source.indexOf(START)
  const end = source.indexOf(END)
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${DOC} has lost its ${START} / ${END} markers`)
  }
  return `${source.slice(0, start + START.length)}\n\n${block}\n\n${source.slice(end)}`
}

// `bun lib/scripts/design-debt.ts --write` regenerates the block in place.
// The test names this command when it fails, so a stale number is one command
// to fix rather than a hand-count.
if (import.meta.main && process.argv.includes('--write')) {
  const path = join(ROOT, DOC)
  const source = readFileSync(path, 'utf-8')
  const next = writeDocBlock(source, renderDesignDebt(scanDesignDebt()))
  if (next !== source) {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(path, next)
    console.log(`${DOC}: design-debt block updated`)
  } else {
    console.log(`${DOC}: design-debt block already current`)
  }
}
