/**
 * A prop a block declares is a prop something passes.
 *
 * ## The defect this was written for
 *
 * `vault/blocks/hero` shipped an `index` prop in Tahap 12d — typed,
 * documented, with markup, with CSS (`grid-column: 9 / -1`), and with the
 * measurement that justified it written into the prop's own doc comment. Three
 * separate files described the result as shipped, and `home.heroIndexLabel`
 * sat in both dictionaries waiting for it.
 *
 * **Nothing passed it for fifty-five stages.** Measured on the production
 * build at 1440×900 the night Tahap 67 found it: the home page's first screen
 * carried content from **462 to 836 of 900**, so the top 51% held nothing but
 * ground, and its three text elements ran 1080 / 363 / 178 — the staircase
 * down the left edge that the prop's own doc records Tahap 12 removing.
 *
 * Every gate in this repository was green throughout. They measure what the
 * page *does*: contrast, motion, budget, axe. None of them can see a
 * capability that was never asked for, because an unrendered element is
 * indistinguishable from a design that never wanted one.
 *
 * This is the check that can: a prop with no caller is either a defect or a
 * deliberate default, and this file makes the project say which.
 *
 * ## Why a unit test and not an e2e one
 *
 * The e2e alternative — "the home page's first screen must fill N of 12
 * columns" — is a taste threshold wearing a number. It would pass a page that
 * filled its columns with the wrong thing and fail a deliberately spare one,
 * and picking N is exactly the arbitrary choice `taste-preflight` refuses to
 * make for `border-radius`. Whether a declared prop has a caller is not a
 * matter of taste, needs no browser, and is the actual thing that went wrong.
 */

import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { parseSync } from 'oxc-parser'

/**
 * Props that are meant to sit unused, each with the reason.
 *
 * The list is the point of the gate, not a hole in it: a knob with a working
 * default is a different thing from a capability nobody wired, and the only
 * way to tell them apart is for someone to say so here.
 */
const DELIBERATE = {
  // `vault/magic` is vendored Magic UI, tokenised under this project's five
  // transformations. Its tuning knobs are the upstream API surface: the
  // defaults are what this site uses, and deleting the knobs would fork the
  // component further from its origin for no gain. `vendor-rules.test.ts`
  // holds the transformations; these are what is left of the original.
  'noise-texture:frequency': 'vendored Magic UI tuning knob, default in use',
  'noise-texture:octaves': 'vendored Magic UI tuning knob, default in use',
  'noise-texture:slope': 'vendored Magic UI tuning knob, default in use',
  'grid-pattern:squares': 'vendored Magic UI tuning knob, default in use',
  'grid-pattern:strokeDasharray':
    'vendored Magic UI tuning knob, default in use',
  'dot-pattern:cr': 'vendored Magic UI tuning knob, default in use',
  'dot-pattern:cx': 'vendored Magic UI tuning knob, default in use',
  'dot-pattern:cy': 'vendored Magic UI tuning knob, default in use',
  'pixel-image:grid': 'vendored Magic UI tuning knob, default in use',
  'grid-pattern:x': 'vendored Magic UI tuning knob, default in use',
  'grid-pattern:y': 'vendored Magic UI tuning knob, default in use',
  'dot-pattern:x': 'vendored Magic UI tuning knob, default in use',
  'dot-pattern:y': 'vendored Magic UI tuning knob, default in use',

  // Omitted deliberately, and the reason is written at the call site:
  // "Studio" duplicated the header's own anchor label sitting a few hundred
  // pixels above it. The prop stays because two other surfaces use the block
  // with one.
  'studio-note:eyebrow': 'omitted on /, with the reason at the call site',

  // `'top 85%'` — just inside the fold, and the one surface that needed a
  // different band got `components/effects/progress-text`, which owns its own
  // start and end because a short passage resolves its whole scrub in a
  // single frame at the defaults (`docs/stages/TAHAP-52.md` §4a).
  'text-reveal:start': 'default band; ProgressText owns the custom one',

  // The icon's own doc: "every icon on this site sits inside a `<button>` or
  // `<a>` that already carries an `aria-label`, and naming the glyph as well
  // makes a screen reader announce the control twice." Unused is the correct
  // state, and the day an icon is a control's only content it is there.
  'icon:title': 'aria-hidden is correct here; every icon has a labelled parent',

  // The default *is* the house style, and the alternative is the tell.
  // "Play once and stay" is what this project ships; a headline that
  // re-animates every time it re-enters the viewport is the amateur pattern
  // `MOTION-SPEC.md` §0 exists to keep out. The prop stays because the
  // component is a `vault/` primitive and a consumer outside this site may
  // want the other behaviour.
  'text-reveal:once':
    'default is the house style; replay is deliberately unused',

  // Both knobs carry their own tuned value and the failure mode past it —
  // "above ~0.5 the element outruns the cursor and reads as unstable rather
  // than premium". A page overriding them would be re-deciding the magnet's
  // feel per call site, which is what having one primitive prevents.
  'magnetic:radius': 'feel tuned once in the primitive, not per call site',
  'magnetic:strength': 'feel tuned once in the primitive, not per call site',

  // A ceiling, not a feature: the transition resolves on its own and this is
  // the guard for the case where it does not. Passing it would mean a route
  // had a reason to distrust the default, and none does.
  'page-transition:maxWait': 'safety ceiling, only set if a route needed one',

  // How many grid images opt out of lazy loading. Tuned once, in the block,
  // against the fold; a page that overrode it would be deciding a
  // loading strategy from the outside.
  'project-grid:preloadCount': 'perf default tuned in the block, not per page',
} satisfies Record<string, string>

/** Directories whose `index.tsx` declares a component this rule governs. */
const ROOTS = [
  'vault/blocks',
  'vault/motion',
  'vault/primitives',
  'vault/magic',
]

/** Where a prop may be supplied from. */
const CONSUMERS = ['app', 'vault', 'components']

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (path.endsWith('.tsx') || path.endsWith('.ts')) out.push(path)
  }
  return out
}

/**
 * The optional props a `*Props` interface declares.
 *
 * Block comments are stripped first: this file's own prose names props, and a
 * rule that read its own documentation would report them as declared.
 */
export function optionalProps(source: string): string[] {
  const props: string[] = []
  for (const block of source.matchAll(/interface\s+\w*Props\s*\{(.*?)\n\}/gs)) {
    const body = (block[1] ?? '').replace(/\/\*.*?\*\//gs, '')
    for (const prop of body.matchAll(/^\s{2}(['"]?)([\w-]+)\1\?\s*:/gm)) {
      const name = prop[2]
      if (name) props.push(name)
    }
  }
  return props
}

/**
 * The slice of the ESTree/JSX shape this rule reads.
 *
 * Named rather than walked as a dictionary: `anti-slop/no-unsafe-dictionary-type`
 * is right that `Record<string, unknown>` gives a caller no contract, and the
 * four fields below are the entire contract this gate needs.
 */
interface JsxIdentifier {
  readonly name?: string
  readonly value?: string
}

interface SpreadArgument {
  readonly type?: string
  readonly expression?: SpreadArgument
  readonly right?: SpreadArgument
  readonly properties?: readonly { readonly key?: JsxIdentifier }[]
}

interface JsxAttributeNode {
  readonly type?: string
  readonly name?: JsxIdentifier
  readonly argument?: SpreadArgument
}

/**
 * Any node the parser produced.
 *
 * An interface rather than `object` or `unknown`: both of those are what
 * `anti-slop` calls an unparsed boundary, and this is not one — `parseSync`
 * is the parser. `type` is the only field every node shares, and it is the
 * only one this walk needs before handing off to the JSX shapes below.
 */
interface ParsedNode {
  readonly type?: string
}

/**
 * A node's own fields, as things to walk into.
 *
 * One cast, in one place, instead of a dictionary type on every node: the
 * values of an AST node are other nodes, arrays of nodes, or leaves, and
 * which is which is decided at the call site by `typeof`.
 */
function children(node: ParsedNode): readonly unknown[] {
  return Object.values(node)
}

interface JsxOpeningNode {
  readonly type?: string
  readonly name?: JsxIdentifier
  readonly attributes?: readonly JsxAttributeNode[]
}

/**
 * Every prop name passed to `<Component …>` anywhere in a source file.
 *
 * ## This is the fifth version, and the first four were confidently wrong
 *
 * The earlier ones scanned text. Each was fixed, re-run, and found **green
 * against a defect that was really there**:
 *
 * 1. **Name-based.** Asked whether `index=` appeared anywhere outside the
 *    declaring module. `project-gallery` passes `index={index}` to the
 *    lightbox, so any prop called `index` looked supplied.
 * 2. **Idiom-blind.** Missed `{...(x && { portraitAlt })}`, the
 *    spread-conditional form this repo uses everywhere, and reported a
 *    `studio-note` prop that has always been passed.
 * 3. **Shorthand-blind.** Missed `<ProjectHero material` followed by a
 *    comment — on the one prop Tahap 58 and 59 spent two stages on.
 * 4. **Quote-confused.** Tracked quotes so a `>` inside a string could not
 *    end a tag, then met prose: "the headline's 9em measure" opens a quote
 *    that never closes. One `<Hero` produced a region **5700 characters
 *    long** and swallowed the rest of the file.
 *
 * A gate that cannot fail on the defect it was written for is worse than no
 * gate: it converts an open question into a false answer. So this one asks a
 * parser. `oxc-parser` is the same engine `oxlint` runs, so the AST here is
 * the one the lint step already trusts, and boolean shorthand, spreads and
 * JSX-in-expressions are ordinary nodes rather than special cases.
 */
export function propsPassedTo(component: string, source: string): Set<string> {
  const passed = new Set<string>()
  const parsed = parseSync('scan.tsx', source)

  /*
   * A partial tree is the one way this can go quiet again.
   *
   * `oxc-parser` is error-tolerant: it returns a tree *and* a list of what it
   * could not read, so a source it chokes on yields a truncated AST rather
   * than a throw. Call sites past the break would then read as "passes
   * nothing", and the gate would report invented defects on props that are
   * supplied — the exact failure the first four versions kept producing, back
   * again with a parser in front of it.
   *
   * Measured today: the 147 files under `app/`, `vault/` and `components/`
   * concatenate to 773,939 characters and parse with **zero** errors, so this
   * costs nothing and is a guard rather than a workaround. It matters the day
   * that stops being true, because the message then names the parser instead
   * of blaming a page.
   */
  if (parsed.errors.length > 0) {
    throw new Error(
      `the consumer scan did not parse, so its results mean nothing (${parsed.errors.length} error(s)): ${parsed.errors[0]?.message}`
    )
  }

  /*
   * Any node in the parsed tree. Named rather than `unknown` —
   * `anti-slop/no-unknown-parameters` is right that an unparsed input has no
   * contract, and the contract here is exactly "something the parser
   * produced"; the JSX shapes above are the only parts read.
   */
  const visit = (node: ParsedNode): void => {
    // SAFETY: every field read through this view is optional, so a node of a
    // different shape reads as "not a JSX opening element" and is walked as an
    // ordinary child rather than misread.
    const element = node as JsxOpeningNode
    if (
      element.type === 'JSXOpeningElement' &&
      element.name?.name === component
    ) {
      for (const attribute of element.attributes ?? []) {
        if (attribute.type === 'JSXAttribute') {
          const name = attribute.name?.name
          if (name) passed.add(name)
          continue
        }
        /*
         * A spread. `{...(cond && { prop })}` is the form this codebase
         * writes by hand, so its keys are read; an opaque `{...rest}` could
         * carry anything, and calling that "supplies nothing" would invent
         * defects — the failure mode this gate cannot afford.
         */
        for (const key of spreadKeys(attribute.argument)) passed.add(key)
      }
    }

    for (const value of children(node)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === 'object') visit(item)
        }
      } else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(parsed.program)
  return passed
}

/** The property names a spread argument can be shown to carry, or `*`. */
function spreadKeys(argument: SpreadArgument | undefined): string[] {
  if (!argument) return ['*']

  if (argument.type === 'ParenthesizedExpression') {
    return spreadKeys(argument.expression)
  }
  // `cond && { prop }` — the right side is what would be spread.
  if (argument.type === 'LogicalExpression') return spreadKeys(argument.right)
  if (argument.type === 'ObjectExpression') {
    const keys: string[] = []
    for (const property of argument.properties ?? []) {
      const name = property.key?.name ?? property.key?.value
      if (typeof name === 'string') keys.push(name)
      else return ['*']
    }
    return keys
  }
  return ['*']
}

/** Whether any call site of this component supplies this prop. */
export function isSupplied(prop: string, passed: ReadonlySet<string>): boolean {
  return passed.has(prop) || passed.has('*')
}

/** The component a `vault/` module exports, which is what call sites name. */
export function exportedComponent(source: string): string | null {
  return /export function ([A-Z]\w*)/.exec(source)?.[1] ?? null
}

/** Props this repo actually declares, mapped to the module that declares them. */
function declared(): {
  module: string
  file: string
  component: string
  prop: string
}[] {
  const found: {
    module: string
    file: string
    component: string
    prop: string
  }[] = []
  for (const root of ROOTS) {
    for (const dir of readdirSync(root)) {
      const file = join(root, dir, 'index.tsx')
      let source: string
      try {
        source = readFileSync(file, 'utf8')
      } catch {
        continue
      }
      const component = exportedComponent(source)
      if (!component) continue
      for (const prop of optionalProps(source)) {
        found.push({ module: dir, file, component, prop })
      }
    }
  }
  return found
}

/**
 * Every file that could render a block, including its own story.
 *
 * A story counts: `vault/` is a catalogue as well as a library, and Tahap 67
 * found the hero's story omitting the same prop the page did. Nothing is
 * excluded by path — the component scope in `callSites` is what keeps one
 * block's `index` from vouching for another's.
 */
function consumerSource(): string {
  let source = ''
  for (const root of CONSUMERS) {
    for (const file of walk(root)) {
      /*
       * This file lives under `vault/`, and its own examples contain `<X …>`
       * tags. Scanned as a consumer it vouched for the very props it is
       * meant to police — the second bug, found the same way as the first:
       * by removing a prop and watching the gate stay green.
       */
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) continue
      source += `${readFileSync(file, 'utf8')}\n`
    }
  }
  return source
}

/** Props a component owns rather than forwards, and that every block carries. */
const STRUCTURAL = new Set(['className', 'children', 'id', 'style', 'ref'])

describe('a declared prop has a caller', () => {
  it('finds props to check, so a broken parser cannot pass silently', () => {
    // The failure mode of a rule that reads source: it stops matching and
    // reports a clean sweep. `Hero`'s `index` is the prop this gate exists
    // for, so its presence is the parser's own smoke test.
    const all = declared()
    expect(all.length, 'no optional props parsed at all').toBeGreaterThan(20)
    expect(
      all.some((entry) => entry.module === 'hero' && entry.prop === 'index'),
      'the parser no longer sees the prop this gate was written for'
    ).toBe(true)
  })

  it('can see every module it claims to cover', () => {
    /*
     * `optionalProps` reads `interface …Props { … }`, and that is the last
     * place this gate can go quiet.
     *
     * A module that wrote `type HeroProps = { … }` instead, or typed its
     * props inline in the signature, would contribute **zero** props — and a
     * prop that is never collected can never be reported missing. The gate
     * would stay green over exactly the defect it exists for, which is the
     * fifth version of the same mistake the first four made.
     *
     * Measured today: 30 of 30 modules under `ROOTS` that export a component
     * declare a `*Props` interface, and none uses a type alias. So this
     * enforces a convention the repository already keeps rather than
     * imposing a new one — and the day someone departs from it, the message
     * says which module and what to do, instead of the sweep quietly
     * shrinking.
     */
    const invisible: string[] = []
    for (const root of ROOTS) {
      for (const dir of readdirSync(root)) {
        const file = join(root, dir, 'index.tsx')
        let source: string
        try {
          source = readFileSync(file, 'utf8')
        } catch {
          continue
        }
        if (!exportedComponent(source)) continue
        if (!/(?:^|\n)(?:export )?interface \w*Props\b/.test(source)) {
          invisible.push(file)
        }
      }
    }

    expect(
      invisible,
      `${invisible.length} module(s) export a component whose props this gate cannot read. Declare them as \`interface <Name>Props\` — a type alias or an inline signature makes the prop invisible here, and an invisible prop can never be reported missing:\n  ${invisible.join('\n  ')}`
    ).toEqual([])
  })

  /*
   * Thirty seconds, not the 5000ms default, and the number is measured.
   *
   * This is the only test in the repo that parses the whole consumer tree —
   * 154 files under `app`, `vault` and `components` — to ask which declared
   * prop nobody passes. Walking and reading them is cheap (49ms and 47ms
   * measured); `parseSync` over all of them is not, and the test costs 4-6
   * seconds of CPU on its own.
   *
   * Against Bun's generic 5s that is no margin at all, and the failure mode is
   * the worst kind: it passes when the machine is idle and fails when it is
   * busy. It failed three `git push` runs in a row here — git compressing
   * objects on the same cores was enough — while `bunx lefthook run pre-push`
   * passed every time, so the gate looked flaky rather than slow.
   *
   * The first diagnosis was wrong and is recorded rather than quietly
   * dropped: sequential file I/O was measured at 33ms/file and blamed, but
   * that number was a cold-cache artifact. Warm, the reads total 47ms. The
   * cost is parsing, so parallelising the reads would have fixed nothing.
   *
   * `bunfig.toml` cannot carry this: a `timeout` key under `[test]` is
   * accepted and then ignored — verified by a 6s test that still died at
   * 5000ms. Per-test is the only form Bun honours.
   */
  it('has no capability that nothing asks for', () => {
    const source = consumerSource()
    const cache = new Map<string, Set<string>>()
    const passedTo = (component: string) => {
      const hit = cache.get(component)
      if (hit) return hit
      const found = propsPassedTo(component, source)
      cache.set(component, found)
      return found
    }
    const unpassed: string[] = []
    for (const { module, file, component, prop } of declared()) {
      if (STRUCTURAL.has(prop)) continue
      if (`${module}:${prop}` in DELIBERATE) continue
      if (!isSupplied(prop, passedTo(component))) {
        unpassed.push(
          `${file} declares \`${prop}\` and no <${component}> passes it`
        )
      }
    }

    expect(
      unpassed,
      `${unpassed.length} prop(s) built and never asked for. Pass it, delete it, or add it to DELIBERATE with the reason:\n  ${unpassed.join('\n  ')}`
    ).toEqual([])
  }, 30_000)
})

describe('the detector itself', () => {
  it('reads optional props and ignores required ones', () => {
    expect(
      optionalProps(`interface XProps {\n  req: string\n  opt?: string\n}`)
    ).toEqual(['opt'])
  })

  it('does not count a prop named inside a comment', () => {
    const commented = `interface XProps {\n  /* mentions ghost?: here */\n  real?: string\n}`
    expect(optionalProps(commented)).toEqual(['real'])
  })

  it('names the component a module exports', () => {
    expect(exportedComponent('export function Hero({ a }: P) {}')).toBe('Hero')
    expect(exportedComponent('export const x = 1')).toBeNull()
  })

  it('reads a call site the way the compiler does', () => {
    const source = `<Hero headline={a > b ? "x" : "y"} index={{ label: 'P' }} />`
    const passed = propsPassedTo('Hero', source)
    // The `>` inside the expression must not end the tag early — the bug that
    // made the text scanner read 5700 characters of one file as one tag.
    expect([...passed].sort()).toEqual(['headline', 'index'])
  })

  it('does not mistake one component for another', () => {
    // The whole reason this is component-scoped: `index` is passed to the
    // lightbox on pages that may render a hero with no index at all.
    expect(propsPassedTo('Hero', '<Lightbox index={2} />').size).toBe(0)
    expect(propsPassedTo('Hero', '<HeroBanner index={2} />').size).toBe(0)
  })

  it('is not fooled by prose, imports or a comment', () => {
    // Every one of these appears in the repository, and the text-based
    // versions of this detector were fooled by one or another of them.
    const noise = [
      "import { Hero } from './index'",
      'items.map((item, index) => item)',
      '// the index in the top right',
      "/* <Hero index={{ label: 'x' }} /> in a doc comment */",
    ].join('\n')
    expect(propsPassedTo('Hero', noise).size).toBe(0)
  })

  it('sees every form this codebase passes props in', () => {
    const of = (source: string) => propsPassedTo('X', source)
    expect(of('<X a={value} />').has('a'), 'expression').toBe(true)
    expect(of('<X a="value" />').has('a'), 'string literal').toBe(true)
    expect(of('<X b />').has('b'), 'boolean shorthand').toBe(true)
    expect(
      of('<X b\n  /* a comment between them */\n  other={1} />').has('b'),
      'shorthand, then a comment'
    ).toBe(true)
    expect(
      of('<X {...(y && { a: z })} />').has('a'),
      'spread-conditional'
    ).toBe(true)
    expect(of('<X {...{ a: 1 }} />').has('a'), 'object spread').toBe(true)
  })

  it('treats an opaque spread as supplying anything', () => {
    // `{...rest}` could carry any prop. Reporting a defect on a call site
    // that may well pass it is the failure mode this gate cannot afford.
    expect(isSupplied('anything', propsPassedTo('X', '<X {...rest} />'))).toBe(
      true
    )
  })

  it('refuses to answer from a tree it could not fully parse', () => {
    // `oxc-parser` is error-tolerant, so unparseable source yields a partial
    // tree rather than a throw — and a partial tree reads as "this call site
    // passes nothing", which is how a parser-backed gate would start inventing
    // defects. It must say so instead of answering.
    expect(() => propsPassedTo('X', '<X a={1} /> function ((( {')).toThrow(
      /did not parse/
    )
  })

  it('reports a prop no call site passes', () => {
    expect(isSupplied('a', propsPassedTo('X', '<X b={1} />'))).toBe(false)
    expect(isSupplied('a', new Set<string>())).toBe(false)
  })
})
