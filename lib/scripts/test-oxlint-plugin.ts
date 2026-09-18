/**
 * Runs the vendored anti-slop plugin's rule tests, one Node process each.
 *
 * ## Why this is a script and not a shell one-liner
 *
 * `package.json` carried the loop inline:
 *
 * ```
 * for f in tools/oxlint/anti-slop/rules/*.ruletest.ts; do node $f || exit 1; done
 * ```
 *
 * `bun run` executes scripts through its own shell, which has no `for`. On
 * Windows that is not a slow path or a degraded one — it is three parse
 * errors and an exit code:
 *
 * ```
 * bun: command not found: for
 * bun: command not found: do
 * bun: command not found: done
 * error: script "test:oxlint-plugin" exited with code 1
 * ```
 *
 * So the eighth step of `bun run check` could not run at all off Linux, and
 * because it sits behind `bun test` in the `&&` chain, a repo with any failing
 * unit test never reached it and never reported that it was unreachable. All
 * twelve rule tests pass when invoked by hand; nothing was wrong with them.
 *
 * ## Why Node and not Bun
 *
 * oxlint's `RuleTester` refuses the Bun runtime, which is also why these files
 * are named `*.ruletest.ts` rather than `*.test.ts` — that keeps `bun test`
 * from collecting them. This script therefore spawns `node` per file, exactly
 * as the shell loop did, and stops at the first failure for the same reason.
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..', '..')
const RULES = 'tools/oxlint/anti-slop/rules'

// Normalised to `/` because `Bun.Glob` emits backslashes on Windows, the
// hazard `lib/scripts/generate-manifest.ts` documents beside its own glob.
const files = [
  ...new Bun.Glob(`${RULES}/*.ruletest.ts`).scanSync({ cwd: ROOT }),
]
  .map((file) => file.replaceAll('\\', '/'))
  .sort()

if (files.length === 0) {
  // Anti-vacuum: a runner that found nothing must not report success. The
  // shell loop it replaces would have passed a glob through literally and
  // failed on a filename with an asterisk in it; this says what happened.
  console.error(`test:oxlint-plugin: no rule tests found under ${RULES}/`)
  process.exit(1)
}

for (const file of files) {
  const result = spawnSync('node', [join(ROOT, file)], {
    stdio: 'inherit',
    cwd: ROOT,
  })

  if (result.error) {
    console.error(`test:oxlint-plugin: could not run ${file}`, result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    console.error(`test:oxlint-plugin: ${file} failed`)
    process.exit(result.status ?? 1)
  }
}

console.log(`test:oxlint-plugin: ${files.length} rule tests passed`)
