/**
 * Which of `CLAUDE.md`'s hard rules a gate can actually see — Tahap 78.
 *
 * ## Why this exists
 *
 * `CLAUDE.md` opens its hard rules with *"These are not preferences.
 * Violating one is a defect."* There are 21. Rule **#1** — the first one —
 * was enforced by `vendor-rules.test.ts` alone, whose glob is
 * `vault/magic/**`: **4 of this repo's 65 authored stylesheets**. Proved by
 * swapping one easing token for a raw bezier in `vault/primitives/cursor`,
 * changing nothing else, and running the whole suite:
 *
 * ```
 * bun run check   534 pass, 0 fail, exit 0
 * ```
 *
 * A constitution whose first article cannot fail is the defect class this
 * repository keeps paying for: an invariant stated in prose with no
 * instrument. Tahap 72 found it in `results.incomplete`, Tahap 73 in §7's
 * five wrong numbers, Tahap 77 in a hero rule covering two of seven heroes.
 *
 * ## What this file is, and what it is not
 *
 * It is the map, as data: every rule classified by the gate that can fail on
 * it, or by why nothing can. It is **not** a claim that a covered rule is
 * fully covered — `partial` says where coverage stops, because a map that
 * rounds up is the same lie as a gate that cannot fail.
 *
 * The rule list is parsed from `CLAUDE.md` rather than retyped here, so the
 * two cannot drift. A twenty-second rule reddens `unclassifiedRules` until
 * somebody decides which it is.
 */

/** One numbered hard rule, as `CLAUDE.md` states it. */
export interface Rule {
  readonly number: number
  readonly title: string
}

/** What can fail on a rule, or why nothing can. */
export interface Coverage {
  readonly rule: number
  /**
   * The gate that can go red on it. `null` means nothing can — and then
   * `because` has to say why that is acceptable rather than an oversight.
   */
  readonly instrument: string | null
  /** Where the coverage stops, when it stops short of the whole rule. */
  readonly partial?: string
  readonly because: string
}

/** Hard rules are numbered list items whose first span is bold. */
export function parseRules(markdown: string): Rule[] {
  const rules: Rule[] = []
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*/)
    if (!match) continue
    rules.push({ number: Number(match[1]), title: match[2] ?? '' })
  }
  return rules
}

/**
 * The map. Every entry is a claim that can be checked by reading the named
 * test — and three of them were wrong in this stage's first draft, so they
 * are worth re-reading rather than trusting.
 */
export const RULE_COVERAGE: readonly Coverage[] = [
  {
    rule: 1,
    instrument: 'motion-rules #1 (CSS, repo-wide) + GSAP dialect; vendor-rules',
    because:
      'Two surfaces, and neither test contains the other: motion-rules reads transition/animation declarations in all 65 authored stylesheets and tween easing in every component TS; vendor-rules reads every line of vault/magic source, where a curve can hide in a string that never reaches a stylesheet',
  },
  {
    rule: 2,
    instrument: 'motion-rules #2',
    because: 'Repo-wide over every transition and animation declaration',
  },
  {
    rule: 3,
    instrument: 'motion-rules #8',
    partial:
      'Only that the duration is a token. The 400ms default and the three bands — 150-250 micro, 300-600 standard, 800-1200 choreographed — are not enforced',
    because:
      'Which band an animation belongs in depends on what it means, and no scanner knows that. Naming the gap beats a gate that guesses',
  },
  {
    rule: 4,
    instrument: 'motion-rules #4',
    because:
      'Rejects width, height, top, left, margin, padding, box-shadow, inset in a transition',
  },
  {
    rule: 5,
    instrument: 'motion-rules reduced-motion contract',
    because:
      'Every stylesheet that animates must also stand down. The test states no rule number, which is how Tahap 78 first mis-read it as uncovered',
  },
  {
    rule: 6,
    instrument: 'taste-rules; vendor-rules #6',
    because: 'No second requestAnimationFrame loop is opened anywhere',
  },
  {
    rule: 7,
    instrument: null,
    because:
      'No gate. Measured at 100% compliance: all seven files that create a ScrollTrigger or GSAP context clean up, and `useGSAP` reverts automatically, which is the mechanism gsap.tsx documents. Left unenforced rather than given a gate that only restates useGSAP — recorded here so the next stage can weigh it with its eyes open',
  },
  {
    rule: 8,
    instrument: 'motion-rules #8; token-rules; scale-rules',
    because:
      'Durations, colours, type, weights, radii and shadows each have their own scan',
  },
  {
    rule: 9,
    instrument: 'token-rules #9',
    because:
      'No component may reach for --color-ink or --color-paper, the literal ends of the palette. Green on the day it shipped, at 100% compliance',
  },
  {
    rule: 10,
    instrument: 'token-rules; vendor-rules #10',
    because: 'No raw hex, no rgb()/hsl() — colour is authored in oklch()',
  },
  {
    rule: 11,
    instrument: 'token-rules #11',
    partial:
      'Checks the test is not skipped. It does not check that a baseline entry was justified, because the baseline carries no reason field and is currently empty',
    because:
      'Skipping the test is the cheapest way to make a colour problem disappear, and nothing stopped it before Tahap 78',
  },
  {
    rule: 12,
    instrument: 'scale-rules',
    because:
      'No grid track is a bare 1fr. Like #5, the test names no rule number',
  },
  {
    rule: 13,
    instrument: 'webgl-budget; route-budget',
    because: 'three.js stays out of the initial graph unless a route opts in',
  },
  {
    rule: 14,
    instrument: 'webgl-budget',
    because: 'Reduced motion downloads no 3D engine and renders no canvas',
  },
  {
    rule: 15,
    instrument: 'material-layer',
    partial:
      'Runtime only, and one path: WebGL buffer growth across three revisits of the material route. A leak in a component the test never visits is invisible',
    because:
      'The real failure is GPU memory over a session, which only a running browser can see. drei caches one texture per URL by design, so the gate rejects growth rather than retention',
  },
  {
    rule: 16,
    instrument: 'vendor-rules provenance',
    because:
      'Every vault/magic component declares its origin and licence; an unlicensed source cannot pass as copied',
  },
  {
    rule: 17,
    instrument: 'vendor-rules #17',
    because: 'Every file under vault/ carries a provenance header',
  },
  {
    rule: 18,
    instrument: null,
    because:
      "Reading a source's own LICENSE is an act, not an artefact. No gate can tell a verified claim from a copied badge — which is exactly how PROVENANCE.md §5 caught a widely-repeated false MIT claim. The header #17 enforces is where the answer lands",
  },
  {
    rule: 19,
    instrument: null,
    because:
      'Governs what I write, not what the code does. A gate asserting "no unmeasured performance claim" would have to understand prose, and one that pretended to would itself be an unmeasured claim',
  },
  {
    rule: 20,
    instrument: null,
    because:
      'Same shape as #19. axe runs on every route in route-sweep and storybook-a11y; what cannot be mechanised is my not claiming more than axe returned',
  },
  {
    rule: 21,
    instrument: null,
    because:
      'Saying what was skipped is a disclosure, not a property of the tree. Nothing in the repository can detect its own omission from a report',
  },
]

/** Rules `CLAUDE.md` states that nobody classified. */
export function unclassifiedRules(
  rules: readonly Rule[],
  coverage: readonly Coverage[] = RULE_COVERAGE
): string[] {
  const classified = new Set(coverage.map((entry) => entry.rule))
  return rules
    .filter((rule) => !classified.has(rule.number))
    .map(
      (rule) =>
        `#${rule.number} "${rule.title}" is stated in CLAUDE.md and classified nowhere — name its instrument, or why it has none, in lib/scripts/rule-coverage.ts`
    )
}

/** Entries for rules `CLAUDE.md` no longer states. */
export function staleCoverage(
  rules: readonly Rule[],
  coverage: readonly Coverage[] = RULE_COVERAGE
): string[] {
  const stated = new Set(rules.map((rule) => rule.number))
  return coverage
    .filter((entry) => !stated.has(entry.rule))
    .map(
      (entry) =>
        `#${entry.rule} is classified in rule-coverage.ts but CLAUDE.md no longer states it`
    )
}

/** Rules nothing can fail on. Not a fault — a number that must stay visible. */
export function uncovered(
  coverage: readonly Coverage[] = RULE_COVERAGE
): number[] {
  return coverage
    .filter((entry) => entry.instrument === null)
    .map((entry) => entry.rule)
}

/** The table `CLAUDE.md` carries, rendered from the data above. */
export function renderCoverage(
  rules: readonly Rule[],
  coverage: readonly Coverage[] = RULE_COVERAGE
): string {
  const byRule = new Map(coverage.map((entry) => [entry.rule, entry]))
  const lines = rules.map((rule) => {
    const entry = byRule.get(rule.number)
    const gate = entry?.instrument ?? 'nothing can fail on it'
    const mark = entry?.partial ? ' (partial)' : ''
    return `${String(rule.number).padStart(2)}  ${gate}${mark}`
  })
  const blind = uncovered(coverage)
  const partial = coverage.filter((entry) => entry.partial).map((e) => e.rule)
  return [
    '```',
    ...lines,
    '',
    `${rules.length} rules — ${rules.length - blind.length} with a gate that can fail, ${blind.length} without (#${blind.join(', #')})`,
    `${partial.length} covered in part only (#${partial.join(', #')}); each says where its coverage stops`,
    '```',
  ].join('\n')
}

/** The block in `CLAUDE.md`, between its markers. */
const START = '<!-- rule-coverage:start -->'
const END = '<!-- rule-coverage:end -->'

/** Replace the generated block, leaving everything around it untouched. */
export function writeDocBlock(markdown: string, body: string): string {
  const start = markdown.indexOf(START)
  const end = markdown.indexOf(END)
  if (start < 0 || end < 0) {
    throw new Error(`CLAUDE.md is missing ${START} / ${END}`)
  }
  const head = markdown.slice(0, start + START.length)
  const tail = markdown.slice(end)
  return `${head}\n\n${body}\n\n${tail}`
}

if (import.meta.main) {
  const { readFile, writeFile } = await import('node:fs/promises')
  const guide = await readFile('CLAUDE.md', 'utf8')
  const next = writeDocBlock(guide, renderCoverage(parseRules(guide)))
  await writeFile('CLAUDE.md', next)
  console.log('CLAUDE.md rule-coverage block written')
}
