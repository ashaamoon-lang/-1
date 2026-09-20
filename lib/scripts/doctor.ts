#!/usr/bin/env bun
/**
 * Doctor Script - Diagnose common setup issues
 *
 * Run with: bun run doctor
 */

import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { coreEnvSchema } from '../utils/validation'

const ROOT = process.cwd()

// The single source of the runtime floor is package.json's engines field —
// deriving it here keeps the doctor's check and fix hint from drifting when
// a dependency raises the requirement (the way @portabletext/react v8 moved
// the floor to 22.12).
const packageJson: { engines?: { node?: string } } = await Bun.file(
  join(ROOT, 'package.json')
).json()
const requiredNodeVersion =
  packageJson.engines?.node?.replace(/^[^\d]*/, '') ?? '24.20.0'

interface Check {
  name: string
  check: () => boolean | Promise<boolean> | 'skip'
  fix?: string
  /** Explanation printed when `check` returns `'skip'`. */
  skipReason?: string
}

/**
 * Detect whether cwd is a git repo's main checkout, a linked worktree
 * (`git worktree add`), or not a git repo at all — mirrors the exact
 * detection `prepare.ts` uses to decide whether `lefthook install` is safe
 * to run (linked worktrees share `core.hooksPath` with the main checkout
 * and `lefthook install` refuses to run against that shared path).
 *
 * In a linked worktree, `.git` is a FILE (not a directory) pointing at
 * `<main>/.git/worktrees/<name>`, so a plain `existsSync('.git/hooks/...')`
 * check can never resolve there — it always reports a false failure.
 */
const detectGitLayout = (): 'main' | 'worktree' | 'no-git' => {
  const git = Bun.spawnSync([
    'git',
    'rev-parse',
    '--absolute-git-dir',
    '--git-common-dir',
  ])
  if (git.exitCode !== 0) return 'no-git'
  const [gitDir, commonDir] = git.stdout.toString().trim().split('\n')
  if (gitDir && commonDir && gitDir !== resolve(commonDir)) return 'worktree'
  return 'main'
}

const colors = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
}

const checks: Check[] = [
  {
    /*
     * Asks the `node` binary, not the runtime this script happens to run in.
     *
     * This read `process.versions.node`, and `bun run doctor` runs it under
     * **Bun** — where that value is Bun's Node *compatibility* version, not the
     * Node on PATH. Measured on a machine with Node 26.7.0 installed:
     *
     *   node -e 'console.log(process.versions.node)'   26.7.0
     *   bun  -e 'console.log(process.versions.node)'   24.3.0
     *
     * Against `>=24.20.0` the second fails, so `bun run doctor` reported a
     * missing Node upgrade on a machine three majors past the requirement —
     * and exited 1 while doing it. A tool that fails on a correct setup is one
     * nobody runs, which costs every other check in this list.
     *
     * The binary is what the requirement is actually about: `ci.yml` installs
     * Node separately from Bun because `test:oxlint-plugin` spawns `node` per
     * ruletest — oxlint's RuleTester refuses the Bun runtime.
     */
    name: `Node.js version >= ${requiredNodeVersion}`,
    check: () => {
      const probe = Bun.spawnSync(['node', '--version'])
      if (!probe.success) return false

      const reported = new TextDecoder().decode(probe.stdout).trim()
      const [major = 0, minor = 0] = reported
        .replace(/^v/, '')
        .split('.')
        .map((part) => Number.parseInt(part, 10))
      const [requiredMajor = 0, requiredMinor = 0] = requiredNodeVersion
        .split('.')
        .map((part) => Number.parseInt(part, 10))
      return (
        major > requiredMajor ||
        (major === requiredMajor && minor >= requiredMinor)
      )
    },
    fix: `Install Node.js ${requiredNodeVersion}+ from https://nodejs.org or use nvm/fnm`,
  },
  {
    name: 'Bun installed',
    check: () => {
      try {
        return typeof Bun.version === 'string'
      } catch {
        return false
      }
    },
    fix: 'Install Bun: curl -fsSL https://bun.sh/install | bash',
  },
  {
    name: 'Dependencies installed',
    check: () => existsSync(join(ROOT, 'node_modules')),
    fix: 'Run: bun install',
  },
  {
    name: 'Environment file exists',
    check: () =>
      existsSync(join(ROOT, '.env.local')) || existsSync(join(ROOT, '.env')),
    fix: 'Copy .env.example to .env.local and fill in values',
  },
  {
    name: 'Environment variables valid',
    check: () => {
      const result = coreEnvSchema.safeParse(process.env)
      if (!result.success) {
        const issues = result.error.issues.map(
          (i) => `${i.path.join('.')}: ${i.message}`
        )
        console.log(`  ${colors.dim(issues.join(', '))}`)
      }
      return result.success
    },
    fix: 'Check .env.local for invalid values (e.g., NEXT_PUBLIC_BASE_URL must be a valid URL)',
  },
  {
    name: 'TypeScript config exists',
    check: () => existsSync(join(ROOT, 'tsconfig.json')),
    fix: 'Ensure tsconfig.json exists in project root',
  },
  {
    name: 'Next.js config valid',
    check: () =>
      existsSync(join(ROOT, 'next.config.ts')) ||
      existsSync(join(ROOT, 'next.config.js')),
    fix: 'Ensure next.config.ts exists',
  },
  {
    name: 'Oxc config present',
    // The configs are .ts, so `bun run typecheck` already validates their
    // shape. All this needs to check is that they exist under the exact names
    // oxlint/oxfmt auto-discover: `.oxlintrc.ts` and `.oxfmtrc.ts` are silently
    // ignored, and the tools fall back to their defaults without complaining.
    check: () =>
      existsSync(join(ROOT, 'oxlint.config.ts')) &&
      existsSync(join(ROOT, 'oxfmt.config.ts')),
    fix: 'Expected oxlint.config.ts and oxfmt.config.ts in the project root (not .oxlintrc.ts / .oxfmtrc.ts, which are not auto-discovered)',
  },
  {
    name: 'Generated styles exist',
    check: () => existsSync(join(ROOT, 'lib/styles/css/tailwind.css')),
    fix: 'Run: bun run setup:styles',
  },
  {
    name: 'AGENTS.md exists',
    check: () => existsSync(join(ROOT, 'AGENTS.md')),
    fix: 'Create AGENTS.md in project root (canonical engineering standards)',
  },
  {
    name: 'CLAUDE.md exists',
    check: () => existsSync(join(ROOT, 'CLAUDE.md')),
    fix: 'Create CLAUDE.md in project root',
  },
  {
    name: 'COMPONENTS.md exists',
    check: () => existsSync(join(ROOT, 'COMPONENTS.md')),
    fix: 'Create COMPONENTS.md in project root',
  },
  {
    name: 'Font config exists',
    check: () => existsSync(join(ROOT, 'lib/styles/fonts.ts')),
    fix: 'Configure fonts in lib/styles/fonts.ts (next/font/google)',
  },
  {
    name: 'Git hooks installed (lefthook)',
    check: () => {
      const layout = detectGitLayout()
      // Outside a git repo there's nothing to check; in a linked worktree
      // hooks are shared with the main checkout via `core.hooksPath` and
      // `bunx lefthook install` refuses to run against that shared path
      // (same skip prepare.ts already applies) — reporting a fix here would
      // suggest a command that fails.
      if (layout !== 'main') return 'skip'
      return existsSync(join(ROOT, '.git/hooks/pre-commit'))
    },
    fix: 'Run: bunx lefthook install',
    skipReason:
      'not applicable — no git repo, or a linked worktree where hooks are shared with the main checkout',
  },
  {
    /*
     * Port 3000 is free.
     *
     * ## Why a stale listener is worse than a busy port
     *
     * The two commands disagree about it, and the quieter one is the dangerous
     * one. Measured on this machine, with something already on 3000:
     *
     *   bun run start   EADDRINUSE, exit 1                    — fails loudly
     *   bun run dev     "using available port 3001 instead"   — a warning
     *
     * So `dev` keeps working while the address a reader has bookmarked keeps
     * serving whatever stale process still holds it. Open `localhost:3000` out
     * of habit and you are reading the previous build with none of your
     * changes, and nothing says so.
     *
     * It reaches the gates too. `playwright.config.ts` hardcodes
     * `localhost:3000` and sets `reuseExistingServer: !process.env.CI`, so a
     * local suite attaches to that stale server rather than the one it meant
     * to test — a run that reports on a tree nobody is looking at.
     *
     * This repository has three worktrees against one port, which is the
     * arrangement that makes it likely rather than rare.
     */
    name: 'Port 3000 is free (dev server, and the e2e suite, both want it)',
    check: async () => {
      /*
       * It asks whether anything **answers**, not whether it can bind —
       * corrected in Tahap 82, and the correction was earned.
       *
       * The first version bound `127.0.0.1:3000` and called a successful bind
       * proof of a free port. Measured on this machine: this check printed
       * "Port 3000 is free", and `bun run start` on the very next line died
       * with `EADDRINUSE: :::3000`. `next start` binds the IPv6 wildcard, and
       * Windows let a bind to the specific IPv4 loopback succeed beside it.
       *
       * An instrument that reports green while the thing it measures is red is
       * worse than no instrument, because it is believed. A connect probe
       * cannot disagree with the server that way: whatever address a listener
       * holds, if it accepts a connection on loopback then the port is taken
       * for everyone who will try to use it.
       *
       * Both loopback families are tried, because a listener may hold only
       * one, and either one is enough to break the reader's `localhost:3000`.
       */
      const answers = async (hostname: string) => {
        try {
          const socket = await Bun.connect({
            hostname,
            port: 3000,
            socket: {
              data(client) {
                client.end()
              },
            },
          })
          socket.end()
          return true
        } catch {
          // Refused, unreachable, or no such address family — nothing is
          // serving there, which is what this check is asking.
          return false
        }
      }

      const held = (await answers('127.0.0.1')) || (await answers('::1'))
      return !held
    },
    fix:
      'Something is already serving :3000 — often a `next start` left running by ' +
      'another worktree or an earlier session. Stop it, or start yours elsewhere ' +
      'with `PORT=3001 bun run start`. Windows: ' +
      '`Get-NetTCPConnection -LocalPort 3000 -State Listen | %{ Get-CimInstance Win32_Process -Filter "ProcessId=$($_.OwningProcess)" | Select ProcessId,CommandLine }`. ' +
      'macOS/Linux: `lsof -nP -iTCP:3000 -sTCP:LISTEN`.',
  },
]

async function runDoctor() {
  console.log('\n🩺 Satus Doctor\n')
  console.log(colors.dim('Checking your development environment...\n'))

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const { name, check, fix, skipReason } of checks) {
    try {
      const result = await check()
      if (result === 'skip') {
        console.log(
          `${colors.dim('−')} ${name} ${colors.dim(`(${skipReason ?? 'not applicable'})`)}`
        )
        skipped++
      } else if (result) {
        console.log(`${colors.green('✓')} ${name}`)
        passed++
      } else {
        console.log(`${colors.red('✗')} ${name}`)
        if (fix) {
          console.log(`  ${colors.dim(`Fix: ${fix}`)}`)
        }
        failed++
      }
    } catch (_error) {
      console.log(
        `${colors.yellow('?')} ${name} ${colors.dim('(check failed)')}`
      )
      failed++
    }
  }

  console.log('')
  const skippedNote = skipped > 0 ? `, ${skipped} skipped` : ''
  if (failed === 0) {
    console.log(
      colors.green(
        `All ${passed} checks passed! Your environment is ready.${skippedNote}`
      )
    )
  } else {
    console.log(
      `${colors.green(`${passed} passed`)}, ${colors.red(`${failed} failed`)}${skippedNote}`
    )
    console.log(
      colors.dim('\nFix the issues above and run again: bun run doctor')
    )
  }
  console.log('')

  process.exit(failed > 0 ? 1 : 0)
}

void runDoctor()
