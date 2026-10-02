import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { stripVTControlCharacters } from 'node:util'

import type {
  JSONReport,
  JSONReportSuite,
  JSONReportTestResult,
} from '@playwright/test/reporter'

/**
 * Reads one red-proof run and says whether it went the way `cases.json`
 * predicted — a prediction committed before the run, not fitted after it.
 *
 * ## What a red proof is for
 *
 * A gate only ever seen green has not been shown to see anything.
 * `e2e/phone-menu.e2e.ts` guards a menu that replaced an older one, and most
 * of its tests were never run against the code they were written to catch
 * (`docs/FORK.md` §3.4). `.github/workflows/red-proof.yml` builds the app at
 * an older commit, lays the current spec over it, runs it, and hands the JSON
 * report to this file, which holds it against the prediction.
 *
 * ## Red for the right reason
 *
 * A red test is evidence only when it is red for what the test guards. So a
 * red prediction names the error it expects **first** — the assertion that
 * turned the test red — as a pattern over that error's message, and the
 * errors that must follow it (`also`, for soft assertions). Errors past
 * those are consequences of the first: printed, not judged.
 *
 * The message is read **without** its code frame. Playwright's JSON reporter
 * appends the source lines around a failure, and that frame can hold the
 * custom message of the assertion next to the one that failed — matched
 * whole, a pattern would find the wrong assertion's words.
 *
 * Run: `bun classify.ts <cases.json> <case id> <report.json>`. Exits 1 when
 * any prediction fails or the run itself did not happen.
 */

/** What a test is predicted to do on the app under test. */
export type Expectation = 'green' | 'red' | 'either'

/**
 * Why the prediction is what it is.
 *
 * - `behaviour` — red because the old code does what the test guards against.
 * - `instrument` — red because the test cannot see the old code: a control
 *   that finds nothing to control, a selector the old markup cannot match.
 * - `unchanged` — the old code did this too.
 * - `not-provable` — the defect the test guards never existed in a commit.
 * - `control` — the code the gate guards; it must be green.
 */
export type Kind =
  | 'behaviour'
  | 'instrument'
  | 'unchanged'
  | 'not-provable'
  | 'control'

export interface Prediction {
  expect: Expectation
  kind: Kind
  /** Pattern for the first error's message. Required unless `green`. */
  first?: string
  /** Patterns each matched by a later error — soft assertions after the first. */
  also?: string[]
  why?: string
  /** What the run is expected to do after `first` and `also`. Not judged. */
  consequence?: string
}

export interface Case {
  id: string
  /** A commit, or `HEAD` for the commit under test with no overlay. */
  ref: string
  name: string
  about: string
  /** Keyed `<project> › <describe> › <title>`, as the list reporter prints. */
  tests: Record<string, Prediction>
}

export interface Cases {
  about: string[]
  spec: string
  overlay: string[]
  cases: Case[]
}

/** The two parts of Playwright's JSON report this reads. */
export type Report = Pick<JSONReport, 'suites' | 'errors'>

type Outcome = 'green' | 'red' | 'skipped' | 'interrupted' | 'not run'

export interface Observed {
  key: string
  outcome: Outcome
  /** Each error's message without colour, code frame or stack, in order. */
  errors: string[]
}

export interface Verdict {
  holds: boolean
  note: string
}

export interface Row {
  key: string
  prediction?: Prediction
  seen?: Observed
  verdict: Verdict
}

export interface Classified {
  rows: Row[]
  /** Tests that skipped themselves and were not predicted — the other project. */
  skipped: string[]
  /** Errors that stopped the run itself: a build that failed, no tests found. */
  harness: string[]
  holds: boolean
}

/** A code-frame line — `  338 |  …`, `> 341 |  …` — or its caret row. */
const FRAME = /^\s*>?\s*\d*\s*\|/
/** A stack line. */
const STACK = /^\s+at /

/** The message an error was thrown with, as a reader would quote it. */
export function messageHead(message: string): string {
  const lines = stripVTControlCharacters(message).split('\n')
  const end = lines.findIndex((line) => FRAME.test(line) || STACK.test(line))
  return (end === -1 ? lines : lines.slice(0, end)).join('\n').trim()
}

function outcomeOf(result: JSONReportTestResult | undefined): Outcome {
  switch (result?.status) {
    case undefined:
      return 'not run'
    case 'passed':
      return 'green'
    case 'failed':
    case 'timedOut':
      return 'red'
    case 'skipped':
      return 'skipped'
    default:
      return 'interrupted'
  }
}

/** Every test in the report, once per project, by the key `cases.json` uses. */
export function observe(report: Report): Observed[] {
  const observed: Observed[] = []
  const walk = (suite: JSONReportSuite, titles: string[]) => {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        // `--retries=0`, so there is one result; the last is the verdict.
        const result = test.results.at(-1)
        observed.push({
          key: [test.projectName, ...titles, spec.title].join(' › '),
          outcome: outcomeOf(result),
          errors: (result?.errors ?? []).map((error) =>
            messageHead(error.message)
          ),
        })
      }
    }
    for (const child of suite.suites ?? [])
      walk(child, [...titles, child.title])
  }
  // The top-level suites are files, and a file is not part of a test's name.
  for (const file of report.suites) walk(file, [])
  return observed
}

/** The first line of an error, short enough for a table cell. */
function headline(error: string | undefined): string {
  const line = (error ?? '').split('\n')[0]?.replace(/^Error: /, '') ?? ''
  return line.length > 110 ? `${line.slice(0, 109)}…` : line
}

function errorsMatch(prediction: Prediction, errors: string[]): Verdict {
  if (prediction.first && !new RegExp(prediction.first).test(errors[0] ?? ''))
    return {
      holds: false,
      note: `red, but the first error is not /${prediction.first}/`,
    }
  for (const pattern of prediction.also ?? []) {
    const regex = new RegExp(pattern)
    if (!errors.slice(1).some((error) => regex.test(error)))
      return {
        holds: false,
        note: `red, but no later error matches /${pattern}/`,
      }
  }
  const predicted = 1 + (prediction.also?.length ?? 0)
  const after = errors.length - predicted
  return {
    holds: true,
    note:
      after > 0
        ? `red as predicted, then ${after} more (consequence)`
        : 'red as predicted',
  }
}

export function judge(prediction: Prediction, seen?: Observed): Verdict {
  if (!seen) return { holds: false, note: 'not in the report — renamed?' }
  if (seen.outcome === 'green')
    return prediction.expect === 'red'
      ? { holds: false, note: 'predicted red, ran green' }
      : { holds: true, note: 'green as predicted' }
  if (seen.outcome === 'red')
    return prediction.expect === 'green'
      ? { holds: false, note: 'predicted green, ran red' }
      : errorsMatch(prediction, seen.errors)
  return { holds: false, note: `${seen.outcome}, so nothing was measured` }
}

export function classify(spec: Case, report: Report): Classified {
  const seen = observe(report)
  const byKey = new Map<string, Observed>()
  const harness = report.errors.map((error) =>
    messageHead(error.message ?? error.value ?? '')
  )
  for (const test of seen) {
    if (byKey.has(test.key)) harness.push(`two tests are named ${test.key}`)
    byKey.set(test.key, test)
  }

  const rows: Row[] = Object.entries(spec.tests).map(([key, prediction]) => {
    const observed = byKey.get(key)
    return {
      key,
      prediction,
      ...(observed && { seen: observed }),
      verdict: judge(prediction, observed),
    }
  })
  const skipped: string[] = []
  for (const test of seen) {
    if (Object.hasOwn(spec.tests, test.key)) continue
    if (test.outcome === 'skipped') skipped.push(test.key)
    else
      rows.push({
        key: test.key,
        seen: test,
        verdict: { holds: false, note: `${test.outcome}, with no prediction` },
      })
  }

  return {
    rows,
    skipped,
    harness,
    holds: harness.length === 0 && rows.every((row) => row.verdict.holds),
  }
}

/** Whether `new RegExp` accepts a string. */
function compiles(pattern: string): boolean {
  try {
    new RegExp(pattern).test('')
    return true
  } catch {
    return false
  }
}

/** Problems with the predictions themselves, found before any run is read. */
export function validate(cases: Cases): string[] {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const spec of cases.cases) {
    if (ids.has(spec.id)) problems.push(`case ${spec.id} is listed twice`)
    ids.add(spec.id)
    for (const [key, prediction] of Object.entries(spec.tests)) {
      const where = `${spec.id}: ${key}`
      if (!['green', 'red', 'either'].includes(prediction.expect))
        problems.push(`${where}: expect is "${prediction.expect}"`)
      if (prediction.expect !== 'green' && !prediction.first)
        problems.push(`${where}: a red prediction names its first error`)
      if (prediction.expect !== 'green' && !prediction.why)
        problems.push(`${where}: a red prediction says why`)
      if (
        prediction.expect === 'green' &&
        (prediction.first || prediction.also)
      )
        problems.push(`${where}: a green prediction has no errors to match`)
      for (const pattern of [
        prediction.first ?? '',
        ...(prediction.also ?? []),
      ])
        if (!compiles(pattern))
          problems.push(`${where}: /${pattern}/ is not a pattern`)
    }
  }
  return problems
}

const cell = (text: string) => text.replaceAll('|', '\\|')

/**
 * The verdict as Markdown: for the job summary, and the log.
 *
 * `app` is the commit the run actually built, as the workflow read it — for
 * `HEAD` that is the commit under test, which `cases.json` cannot name.
 */
export function render(spec: Case, result: Classified, app?: string): string {
  const lines = [
    `### Case ${spec.id} — ${spec.name}`,
    '',
    `\`${spec.ref}\`${app ? ` (built: ${app})` : ''} — ${spec.about}`,
    '',
    result.holds
      ? '**Every prediction held.**'
      : '**A prediction did not hold.**',
    '',
    '| | test | predicted | ran | first error | verdict |',
    '| --- | --- | --- | --- | --- | --- |',
  ]
  for (const row of result.rows) {
    const predicted = row.prediction
      ? `${row.prediction.expect} (${row.prediction.kind})`
      : '—'
    lines.push(
      `| ${row.verdict.holds ? '✅' : '❌'} | ${cell(row.key)} | ${predicted} | ${row.seen?.outcome ?? '—'} | ${cell(headline(row.seen?.errors[0]))} | ${cell(row.verdict.note)} |`
    )
  }
  if (result.skipped.length > 0)
    lines.push(
      '',
      `Skipped by the spec itself, not predicted: ${result.skipped.length} (the other project).`
    )
  if (result.harness.length > 0)
    lines.push(
      '',
      '**The run itself failed:**',
      '',
      ...result.harness.map((error) => `- ${cell(headline(error))}`)
    )

  const red = result.rows.filter((row) => (row.seen?.errors.length ?? 0) > 0)
  if (red.length > 0) {
    lines.push('', '<details><summary>Every error, as thrown</summary>', '')
    for (const row of red) {
      lines.push(`**${row.key}**`, '')
      if (row.prediction?.consequence)
        lines.push(`Predicted after it: ${row.prediction.consequence}`, '')
      lines.push('```')
      for (const [index, error] of (row.seen?.errors ?? []).entries())
        lines.push(`[${index + 1}] ${error}`, '')
      lines.push('```', '')
    }
    lines.push('</details>')
  }
  return lines.join('\n')
}

function main(args: string[]): number {
  const [casesPath, id, reportPath] = args
  if (!casesPath || !id || !reportPath) {
    console.error('usage: bun classify.ts <cases.json> <case id> <report.json>')
    return 2
  }
  const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Cases
  const problems = validate(cases)
  const spec = cases.cases.find((candidate) => candidate.id === id)
  if (!spec) problems.push(`no case "${id}" in ${casesPath}`)
  if (problems.length > 0 || !spec) {
    console.error(problems.join('\n'))
    return 1
  }
  if (!existsSync(reportPath)) {
    console.error(
      `No report at ${reportPath}: the run did not finish. Read the step above.`
    )
    return 1
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8')) as Report
  const result = classify(spec, report)
  const markdown = render(spec, result, process.env.RED_PROOF_APP)
  console.log(markdown)
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary) appendFileSync(summary, `${markdown}\n\n`)
  return result.holds ? 0 : 1
}

if (import.meta.main) process.exitCode = main(process.argv.slice(2))
