/**
 * Primary-claim invariants for the root WebGL canvas.
 *
 * The claim decides which `<Canvas root>` instance actually mounts a
 * WebGLRenderer when more than one is in the tree. Two properties have to hold
 * at once, and they pull in opposite directions:
 *
 *  1. The claim itself is decided SYNCHRONOUSLY from the render body, so the
 *     first commit already knows the winner and two instances never both mount
 *     a renderer for a frame.
 *  2. Subscribers must NOT be notified during that render, because notifying
 *     runs `useSyncExternalStore` listeners — setState on other mounted
 *     `<Canvas>` components — while React is rendering.
 *
 * Violating (2) produced "Cannot update a component (`Canvas`) while rendering
 * a different component (`Canvas`)" and intermittently failed
 * `e2e/not-found.e2e.ts`, on a page that mounts no canvas of its own. The
 * failure was timing-dependent, so it is pinned here rather than left to a
 * flaky end-to-end run to catch again.
 */

import { afterEach, describe, expect, it } from 'bun:test'

import {
  claimPrimary,
  getPrimaryClaimId,
  registerRootCanvasMount,
  releasePrimary,
  subscribePrimaryClaim,
} from './store'

/** Let a queued microtask run. */
const flushMicrotasks = () => Promise.resolve()

afterEach(() => {
  // Module state is shared across tests in this file; free whatever holds it.
  const held = getPrimaryClaimId()
  if (held) releasePrimary(held)
})

describe('claimPrimary', () => {
  it('decides the winner synchronously, in the render body', () => {
    expect(claimPrimary('first')).toBe(true)
    // A second instance rendering in the same commit must lose immediately —
    // not after an effect, or both would mount a renderer for a frame.
    expect(claimPrimary('second')).toBe(false)
    expect(getPrimaryClaimId()).toBe('first')
  })

  it('is idempotent, so a Strict Mode double render is safe', () => {
    expect(claimPrimary('only')).toBe(true)
    expect(claimPrimary('only')).toBe(true)
    expect(getPrimaryClaimId()).toBe('only')
  })

  it('does NOT notify subscribers synchronously', async () => {
    let notifications = 0
    const unsubscribe = subscribePrimaryClaim(() => {
      notifications++
    })

    claimPrimary('render-phase')

    // The regression: a synchronous notify here is a setState during another
    // component's render.
    expect(notifications).toBe(0)

    await flushMicrotasks()
    expect(notifications).toBe(1)

    unsubscribe()
  })
})

describe('releasePrimary', () => {
  it('promotes a registered survivor', () => {
    const unregisterA = registerRootCanvasMount('a')
    const unregisterB = registerRootCanvasMount('b')

    expect(claimPrimary('a')).toBe(true)
    releasePrimary('a')

    // 'b' takes over without waiting for its own next render.
    expect(getPrimaryClaimId()).toBe('b')

    unregisterA()
    unregisterB()
  })

  it('ignores a release from an id that does not hold the claim', () => {
    expect(claimPrimary('holder')).toBe(true)
    releasePrimary('impostor')
    expect(getPrimaryClaimId()).toBe('holder')
  })
})
