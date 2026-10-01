import { describe, expect, it } from 'bun:test'

import { envSchema } from './env'

/**
 * `DEPLOYMENT.md` §0's rule, given an instrument.
 *
 * The rule — *"Never give a token a `NEXT_PUBLIC_` prefix"* — had no gate for
 * seventy-eight stages, and `CLAUDE.md`'s own coverage table is blunt about
 * what that means: a rule with no instrument is one the project keeps by hand.
 *
 * The enforceable half is narrower than the prose. One `NEXT_PUBLIC_` token is
 * legitimate here — `NEXT_PUBLIC_SANITY_API_READ_TOKEN` feeds `browserToken`
 * in `defineLive`, and a browser token that never reaches the browser does
 * nothing. What must never happen is that variable carrying a value that can
 * *write*, because the prefix publishes it to every visitor.
 *
 * So these assert the discriminator, in both directions. A gate that has only
 * ever been seen green is a gate nobody has shown can fail.
 */
describe('a write token never sits behind a NEXT_PUBLIC_ name', () => {
  it('rejects the write token reused as the public read token', () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_SANITY_API_READ_TOKEN: 'sk-the-same-secret',
      SANITY_API_WRITE_TOKEN: 'sk-the-same-secret',
    })

    expect(result.success).toBe(false)
    const messages = result.success
      ? []
      : result.error.issues.map((issue) => issue.message)
    expect(messages.join('\n')).toContain('SANITY_API_WRITE_TOKEN')
  })

  it('rejects the Satus-convention private token reused the same way', () => {
    const result = envSchema.safeParse({
      NEXT_PUBLIC_SANITY_API_READ_TOKEN: 'sk-the-same-secret',
      SANITY_PRIVATE_TOKEN: 'sk-the-same-secret',
    })

    expect(result.success).toBe(false)
  })

  it('allows a distinct Viewer token in the public variable', () => {
    // The legitimate shape: a read-only token that is *meant* to be inlined,
    // beside a write token that is not. Forbidding this would delete
    // browser-side draft preview, which is a capability, not a leak.
    const result = envSchema.safeParse({
      NEXT_PUBLIC_SANITY_API_READ_TOKEN: 'sk-viewer-only',
      SANITY_API_WRITE_TOKEN: 'sk-write-capable',
    })

    expect(result.success).toBe(true)
  })

  it('allows the public token to be absent entirely', () => {
    const result = envSchema.safeParse({
      SANITY_API_WRITE_TOKEN: 'sk-write-capable',
    })

    expect(result.success).toBe(true)
  })
})
