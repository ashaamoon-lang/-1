import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type {
  JSONReportSpec,
  JSONReportSuite,
  JSONReportTest,
  JSONReportTestResult,
  TestStatus,
} from '@playwright/test/reporter'

import {
  type Case,
  type Cases,
  type Prediction,
  type Report,
  classify,
  judge,
  messageHead,
  observe,
  render,
  validate,
} from './classify'

/**
 * The classifier decides what a red proof proved, so it is tested against
 * messages shaped the way Playwright 1.62.1 writes them — read off
 * `formatMatcherMessage` and the JSON reporter's `formatError` in
 * `node_modules/playwright`, not produced by the code under test.
 */

const CASES = JSON.parse(
  readFileSync(join(import.meta.dir, 'cases.json'), 'utf8')
) as Cases
const SPEC = readFileSync(join(import.meta.dir, '../phone-menu.e2e.ts'), 'utf8')

const DIM = (text: string) => `\u001B[2m${text}\u001B[22m`
const RED = (text: string) => `\u001B[31m${text}\u001B[39m`

/** A locator matcher's message, with Playwright's colours, frame and stack. */
function locatorError(matcher: string, lines: string[]): string {
  return [
    `Error: ${DIM('expect(')}${RED('locator')}${DIM(').')}${matcher}${DIM('()')} failed`,
    '',
    ...lines,
    '',
    'Call log:',
    `  ${DIM(`- Expect "${matcher}" with timeout 5000ms`)}`,
    `  ${DIM("- waiting for getByRole('navigation', { name: 'Primary' })")}`,
    '',
    '',
    '  58 | async function openMenu(page: Page) {',
    "  59 |   await page.getByRole('button', { name: 'Menu' }).click()",
    '> 60 |   await expect(menuOf(page)).toBeVisible()',
    '     |                              ^',
    '  61 | }',
    `    at openMenu (${'/home/runner/work/-1/-1/e2e/phone-menu.e2e.ts'}:60:30)`,
  ].join('\n')
}

const NOT_FOUND = locatorError('toBeVisible', [
  "Locator: getByRole('navigation', { name: 'Primary' })",
  'Expected: visible',
  'Timeout: 5000ms',
  'element(s) not found',
])

const STILL_VISIBLE = locatorError('toBeHidden', [
  "Locator:  getByRole('navigation', { name: 'Primary' })",
  'Expected: hidden',
  'Received: visible',
  'Timeout:  5000ms',
])

/** A custom-message assertion, as `expect(value, message)` throws it. */
function customError(message: string, frame: string[] = []): string {
  return [
    `Error: ${message}`,
    '',
    `${DIM('expect(')}${RED('received')}${DIM(').')}toBe${DIM('(')}expected${DIM(') // Object.is equality')}`,
    '',
    'Expected: true',
    'Received: false',
    '',
    ...frame,
    '    at /home/runner/work/-1/-1/e2e/phone-menu.e2e.ts:341:62',
  ].join('\n')
}

const TIMEOUT = 'Test timeout of 30000ms exceeded.'

function result(
  status: TestStatus,
  messages: string[] = []
): JSONReportTestResult {
  return {
    workerIndex: 0,
    parallelIndex: 0,
    status,
    duration: 1,
    error: undefined,
    errors: messages.map((message) => ({ message })),
    stdout: [],
    stderr: [],
    retry: 0,
    startTime: '2026-10-02T00:00:00.000Z',
    attachments: [],
    annotations: [],
  }
}

function run(projectName: string, outcome?: JSONReportTestResult) {
  const test: JSONReportTest = {
    timeout: 30_000,
    annotations: [],
    expectedStatus: 'passed',
    projectName,
    projectId: projectName,
    results: outcome ? [outcome] : [],
    status: 'expected',
  }
  return test
}

function spec(title: string, tests: JSONReportTest[]): JSONReportSpec {
  return {
    tags: [],
    title,
    ok: true,
    tests,
    id: title,
    file: 'phone-menu.e2e.ts',
    line: 1,
    column: 1,
  }
}

function suite(
  title: string,
  specs: JSONReportSpec[],
  suites: JSONReportSuite[] = []
): JSONReportSuite {
  return { title, file: 'phone-menu.e2e.ts', line: 1, column: 1, specs, suites }
}

/** One file, one describe — the shape `phone-menu.e2e.ts` reports in. */
function report(specs: JSONReportSpec[], errors: string[] = []): Report {
  return {
    suites: [suite('phone-menu.e2e.ts', [], [suite('the phone menu', specs)])],
    errors: errors.map((message) => ({ message })),
  }
}

const red = (over: Partial<Prediction> = {}): Prediction => ({
  expect: 'red',
  kind: 'behaviour',
  first: 'the sheet stops short of the screen',
  why: 'a test',
  ...over,
})

describe('the message a test failed with', () => {
  it('drops the code frame, which quotes the assertions next to it', () => {
    const message = customError('the sheet does not start at the bar', [
      '  177 |     expect(',
      '  178 |       Math.abs(sheet.top - bar),',
      "> 179 |       'the sheet does not start at the bar'",
      '      |       ^',
      '  180 |     ).toBeLessThanOrEqual(1)',
      '  181 |     expect(',
      '  182 |       sheet.bottom,',
      "  183 |       'the sheet stops short of the screen'",
    ])
    // Matched whole, the neighbour's words are there.
    expect(message).toContain('the sheet stops short of the screen')

    const head = messageHead(message)
    expect(head).not.toContain('stops short')
    expect(head.split('\n')[0]).toBe(
      'Error: the sheet does not start at the bar'
    )
    expect(head).toContain('Received: false')
  })

  it('drops the colour and the stack, and keeps the call log', () => {
    const head = messageHead(STILL_VISIBLE)
    expect(head).not.toContain('\u001B')
    expect(head).toStartWith('Error: expect(locator).toBeHidden() failed')
    expect(head).toContain('Received: visible')
    expect(head).toContain("- waiting for getByRole('navigation'")
    expect(head).not.toContain('openMenu (')
    expect(head).not.toContain('|')
  })

  it('passes a message with no frame through whole', () => {
    expect(messageHead(TIMEOUT)).toBe(TIMEOUT)
  })
})

describe('reading the report', () => {
  it('names each test by project, describe and title', () => {
    const seen = observe(
      report([
        spec('a', [
          run('desktop', result('skipped')),
          run('mobile', result('passed')),
        ]),
      ])
    )
    expect(seen.map((test) => test.key)).toEqual([
      'desktop › the phone menu › a',
      'mobile › the phone menu › a',
    ])
  })

  it('reads failed and timed out as red, and keeps the errors in order', () => {
    const seen = observe(
      report([
        spec('failed', [run('mobile', result('failed', ['one']))]),
        spec('timed out', [
          run('mobile', result('timedOut', ['soft', TIMEOUT])),
        ]),
        spec('interrupted', [run('mobile', result('interrupted'))]),
        spec('never ran', [run('mobile')]),
      ])
    )
    expect(seen.map(({ outcome }) => outcome)).toEqual([
      'red',
      'red',
      'interrupted',
      'not run',
    ])
    expect(seen[1]?.errors).toEqual(['soft', TIMEOUT])
  })
})

describe('judging one test', () => {
  const seen = (
    outcome: 'green' | 'red' | 'skipped',
    errors: string[] = []
  ) => ({
    key: 'mobile › the phone menu › a',
    outcome,
    errors,
  })

  it('holds a green prediction to a green run', () => {
    const green: Prediction = { expect: 'green', kind: 'unchanged' }
    expect(judge(green, seen('green')).holds).toBe(true)
    expect(judge(green, seen('red', ['x'])).holds).toBe(false)
  })

  it('does not take a green run for a red prediction', () => {
    expect(judge(red(), seen('green'))).toEqual({
      holds: false,
      note: 'predicted red, ran green',
    })
  })

  it('wants the predicted error first, not merely somewhere', () => {
    const errors = [
      'Error: the sheet does not start at the bar',
      'Error: the sheet stops short of the screen',
    ]
    expect(judge(red(), seen('red', errors)).holds).toBe(false)
    expect(judge(red(), seen('red', errors.toReversed())).holds).toBe(true)
  })

  it('wants every soft error after the first, in a later error', () => {
    const prediction = red({
      first: 'what the sheet covers was not inert',
      also: ['focus left the sheet and the sheet stayed open'],
    })
    const inert =
      'Error: what the sheet covers was not inert the moment it opened'
    const open = 'Error: focus left the sheet and the sheet stayed open'
    expect(judge(prediction, seen('red', [inert, open])).holds).toBe(true)
    expect(judge(prediction, seen('red', [inert])).holds).toBe(false)
    expect(judge(prediction, seen('red', [open, inert])).holds).toBe(false)
  })

  it('does not let one error stand for two', () => {
    const prediction = red({
      first: 'focus left the sheet',
      also: ['the sheet stayed open'],
    })
    const both = 'Error: focus left the sheet and the sheet stayed open'
    expect(judge(prediction, seen('red', [both])).holds).toBe(false)
  })

  it('prints what follows the prediction, and does not judge it', () => {
    const verdict = judge(
      red({ first: 'not inert', also: ['stayed open'] }),
      seen('red', ['not inert', 'stayed open', TIMEOUT, 'locator.focus'])
    )
    expect(verdict).toEqual({
      holds: true,
      note: 'red as predicted, then 2 more (consequence)',
    })
  })

  it('takes either result for "either", but only the named red', () => {
    const either = red({ expect: 'either', first: 'element\\(s\\) not found' })
    expect(judge(either, seen('green')).holds).toBe(true)
    expect(judge(either, seen('red', [messageHead(NOT_FOUND)])).holds).toBe(
      true
    )
    expect(judge(either, seen('red', [messageHead(STILL_VISIBLE)])).holds).toBe(
      false
    )
  })

  it('counts a test that did not run as nothing measured', () => {
    expect(judge(red(), undefined).holds).toBe(false)
    expect(judge(red(), seen('skipped')).holds).toBe(false)
  })
})

describe('classifying a run', () => {
  const tests: Case['tests'] = {
    'mobile › the phone menu › a': red(),
  }
  const subject: Case = { id: 'X', ref: 'HEAD', name: 'x', about: 'x', tests }
  const stops = customError('the sheet stops short of the screen')

  it('holds when every predicted test ran as predicted', () => {
    const classified = classify(
      subject,
      report([
        spec('a', [
          run('desktop', result('skipped')),
          run('mobile', result('failed', [stops])),
        ]),
      ])
    )
    expect(classified.holds).toBe(true)
    expect(classified.skipped).toEqual(['desktop › the phone menu › a'])
  })

  it('fails on a test that ran with no prediction', () => {
    const classified = classify(
      subject,
      report([
        spec('a', [run('mobile', result('failed', [stops]))]),
        spec('b', [run('mobile', result('passed'))]),
      ])
    )
    expect(classified.holds).toBe(false)
    expect(classified.rows.at(-1)?.verdict.note).toBe(
      'green, with no prediction'
    )
  })

  it('fails on a predicted test missing from the report', () => {
    const classified = classify(subject, report([]))
    expect(classified.holds).toBe(false)
    expect(classified.rows[0]?.verdict.note).toBe(
      'not in the report — renamed?'
    )
  })

  it('fails when the run itself failed, whatever the tests did', () => {
    const classified = classify(
      subject,
      report(
        [spec('a', [run('mobile', result('failed', [stops]))])],
        ['Error: Process from config.webServer was not able to start.']
      )
    )
    expect(classified.holds).toBe(false)
    expect(classified.harness).toHaveLength(1)
  })

  it('renders a row per test, with the first error and the consequence', () => {
    const consequence: Case = {
      ...subject,
      tests: {
        'mobile › the phone menu › a': red({ consequence: 'times out' }),
      },
    }
    const markdown = render(
      consequence,
      classify(
        consequence,
        report([spec('a', [run('mobile', result('failed', [stops, TIMEOUT]))])])
      ),
      'abc1234 a commit'
    )
    expect(markdown).toContain('(built: abc1234 a commit)')
    expect(markdown).toContain(
      '| ✅ | mobile › the phone menu › a | red (behaviour) | red | the sheet stops short of the screen |'
    )
    expect(markdown).toContain('Predicted after it: times out')
    expect(markdown).toContain(`[2] ${TIMEOUT}`)
  })
})

describe('cases.json', () => {
  const keys = (id: string) =>
    Object.keys(CASES.cases.find((entry) => entry.id === id)?.tests ?? {})

  it('is well formed', () => {
    expect(validate(CASES)).toEqual([])
  })

  it('names, in every case, the same tests', () => {
    expect(keys('A')).toHaveLength(13)
    expect(keys('B')).toEqual(keys('A'))
    expect(keys('C')).toEqual(keys('A'))
  })

  it('names tests the spec has, in a project that runs them', () => {
    for (const key of keys('A')) {
      const [project, group, title, ...rest] = key.split(' › ')
      expect(rest).toEqual([])
      expect(['desktop', 'mobile']).toContain(project ?? '')
      expect(SPEC).toContain(`test.describe('${group}'`)
      expect(SPEC).toContain(`test('${title}'`)
    }
  })

  it('quotes each custom message the way the spec writes it', () => {
    const patterns = CASES.cases.flatMap((entry) =>
      Object.values(entry.tests).flatMap(({ first, also }) => [
        ...(first ? [first] : []),
        ...(also ?? []),
      ])
    )
    const literal = patterns.filter(
      (pattern) => !/[\\^$.*+?()[\]{}|]/.test(pattern)
    )
    expect(literal.length).toBeGreaterThan(0)
    for (const pattern of literal) expect(SPEC).toContain(pattern)
  })

  it('tells a missing menu from a menu left open', () => {
    const tests = CASES.cases.find((entry) => entry.id === 'A')?.tests ?? {}
    const pattern = (title: string) =>
      new RegExp(tests[`mobile › the phone menu › ${title}`]?.first ?? '^$')
    const missing = pattern(
      'with scripting off, MENU opens the routes and they lead somewhere'
    )
    const leftOpen = pattern(
      'Escape from inside the sheet closes it and focus comes back to MENU'
    )

    expect(missing.test(messageHead(NOT_FOUND))).toBe(true)
    expect(missing.test(messageHead(STILL_VISIBLE))).toBe(false)
    expect(leftOpen.test(messageHead(STILL_VISIBLE))).toBe(true)
    expect(leftOpen.test(messageHead(NOT_FOUND))).toBe(false)
  })
})
