import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

import {
  type Rule,
  RULE_COVERAGE,
  parseRules,
  renderCoverage,
  staleCoverage,
  uncovered,
  unclassifiedRules,
} from './rule-coverage'

const guide = await readFile('CLAUDE.md', 'utf8')
const rules = parseRules(guide)

const rule = (number: number, title = 'x'): Rule => ({ number, title })

describe('the rule list comes from CLAUDE.md, not from a copy', () => {
  test('it finds the hard rules at all', () => {
    // Anti-vacuum: a parser that found nothing would make every check below
    // pass silently — the failure mode this whole file exists to remove.
    expect(rules.length).toBeGreaterThan(15)
  })

  test('they are numbered 1..n with no gaps', () => {
    expect(rules.map((r) => r.number)).toEqual(
      rules.map((_, index) => index + 1)
    )
  })

  test('it reads the rule text, not just the number', () => {
    expect(rules[0]?.title).toContain('cubic-bezier')
  })

  test('it ignores ordinary numbered lists', () => {
    expect(parseRules('1. not bold\n2. also not bold')).toEqual([])
  })
})

describe('every rule is classified, in both directions', () => {
  test('no rule CLAUDE.md states is left unclassified', () => {
    expect(unclassifiedRules(rules)).toEqual([])
  })

  test('no entry survives a rule CLAUDE.md dropped', () => {
    expect(staleCoverage(rules)).toEqual([])
  })

  test('a new rule is reported until somebody decides', () => {
    const faults = unclassifiedRules([
      ...rules,
      rule(99, 'Never ship on a Friday'),
    ])
    expect(faults).toHaveLength(1)
    expect(faults[0]).toContain('#99')
    expect(faults[0]).toContain('rule-coverage.ts')
  })

  test('an entry for a deleted rule is reported', () => {
    const faults = staleCoverage([rule(1)])
    expect(faults.length).toBe(RULE_COVERAGE.length - 1)
  })
})

describe('the map does not round up', () => {
  test('every entry carries a reason worth reading', () => {
    for (const entry of RULE_COVERAGE) {
      expect(entry.because.trim().length).toBeGreaterThan(40)
    }
  })

  test('a rule with no instrument must say why not', () => {
    for (const entry of RULE_COVERAGE) {
      if (entry.instrument !== null) continue
      expect(entry.because.trim().length).toBeGreaterThan(60)
    }
  })

  test('a partial entry says where its coverage stops', () => {
    for (const entry of RULE_COVERAGE) {
      if (entry.partial === undefined) continue
      expect(entry.partial.trim().length).toBeGreaterThan(30)
    }
  })

  test('no rule is classified twice', () => {
    const numbers = RULE_COVERAGE.map((entry) => entry.rule)
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  /**
   * The honest headline, pinned so it cannot drift quietly.
   *
   * Four rules have no instrument: #7 (cleanup — measured at full compliance,
   * and `useGSAP` is the mechanism), #18 (verifying a licence is an act), and
   * #19–#21 (they govern what I write, not what the tree contains). That is
   * five numbers; #18 through #21 are the four that *cannot* be mechanised,
   * and #7 is the one that could be and deliberately is not.
   */
  test('exactly the expected rules have nothing that can fail on them', () => {
    expect(uncovered()).toEqual([7, 18, 19, 20, 21])
  })
})

describe('the table in CLAUDE.md matches the data', () => {
  test('the generated block is present and current', () => {
    const start = guide.indexOf('<!-- rule-coverage:start -->')
    const end = guide.indexOf('<!-- rule-coverage:end -->')
    expect(start, 'CLAUDE.md carries no rule-coverage block').toBeGreaterThan(0)

    const inDoc = guide.slice(
      start + '<!-- rule-coverage:start -->'.length,
      end
    )
    expect(inDoc.trim()).toBe(renderCoverage(rules).trim())
  })

  test('the render names every rule', () => {
    const table = renderCoverage(rules)
    for (const entry of rules) {
      expect(table).toContain(`\n${String(entry.number).padStart(2)}  `)
    }
  })
})
