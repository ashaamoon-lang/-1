/**
 * Regression test for issue #395: `mobile-vh()` emitted
 * `clamp(Nvh, Nsvh, Ndvh)`. `clamp(MIN, VAL, MAX)` is `max(MIN, min(VAL,
 * MAX))`, and on modern mobile browsers `vh >= dvh >= svh`, so that clamp
 * always collapsed to plain `vh` — the address-bar-hidden value the
 * project's own `h-dvh` house rule exists to avoid. `mobile-vh()` now emits
 * `dvh` directly.
 *
 * Run with: bun test lib/styles/scripts/postcss-functions.test.ts
 */

import { describe, expect, it } from 'bun:test'

import { functions } from './postcss-functions.mjs'

describe('mobile-vh()', () => {
  it('emits a plain dvh value, never a vh/svh/dvh clamp', () => {
    const result = functions['mobile-vh']('75')

    expect(result).toMatch(/^-?[\d.]+dvh$/)
    expect(result).not.toContain('clamp')
    expect(result).not.toContain('svh')
  })

  it('scales proportionally to the mobile screen height', () => {
    const result = functions['mobile-vh']('100')
    expect(result).toBe(functions['mobile-vh']('100'))
    expect(result.endsWith('dvh')).toBe(true)
  })
})

describe('the viewport-width functions are bounded', () => {
  /*
   * Added with the band in Tahap 36. These two functions had no unit coverage
   * at all while they emitted a bare `vw` — the shape that put a 24px padding
   * at 51px on a 799px screen and 17.8px one pixel later. Now that they emit
   * a clamp with derived bounds, the bounds are worth asserting.
   */
  const parse = (value: string) => {
    const match = value.match(
      /^clamp\((-?[\d.]+)px,\s*(-?[\d.]+)vw,\s*(-?[\d.]+)px\)$/
    )
    if (!match) throw new Error(`not a banded clamp: ${value}`)
    return {
      floor: Number.parseFloat(match[1] ?? ''),
      vw: Number.parseFloat(match[2] ?? ''),
      ceiling: Number.parseFloat(match[3] ?? ''),
    }
  }

  it('is exact at its own design width', () => {
    // 24px authored at the 375 anchor must still be 24px at 375.
    const mobile = parse(functions['mobile-vw']('24'))
    expect((mobile.vw / 100) * 375).toBeCloseTo(24, 3)

    // and 32px authored at the 1440 anchor must still be 32px at 1440.
    const desktop = parse(functions['desktop-vw']('32'))
    expect((desktop.vw / 100) * 1440).toBeCloseTo(32, 3)
  })

  it('never renders below the value at the narrowest supported width', () => {
    const mobile = parse(functions['mobile-vw']('24'))
    // 320/375 of 24.
    expect(mobile.floor).toBeCloseTo(20.48, 2)
    expect((mobile.vw / 100) * 320).toBeCloseTo(mobile.floor, 2)
  })

  it('stops growing where the token curve stops', () => {
    const desktop = parse(functions['desktop-vw']('32'))
    // 1920/1440 of 32.
    expect(desktop.ceiling).toBeCloseTo(42.667, 2)
    expect((desktop.vw / 100) * 1920).toBeCloseTo(desktop.ceiling, 2)
  })

  it('cuts the step at the breakpoint for a matched pair', () => {
    // The measured worst case: what a component using the same design number
    // either side of the breakpoint renders at 799px and at 800px.
    const at = (value: string, width: number) => {
      const { floor, vw, ceiling } = parse(value)
      return Math.min(Math.max((vw / 100) * width, floor), ceiling)
    }
    const before = at(functions['mobile-vw']('24'), 799)
    const after = at(functions['desktop-vw']('24'), 800)

    /*
     * 51.1 -> 13.3 before, a **3.84x** fall. Now 32.0 -> 20.5, **1.5625x**.
     *
     * That residual is not a tuning choice, it is arithmetic: at the
     * breakpoint the mobile branch is pinned to its ceiling and the desktop
     * branch to its floor, so the step is exactly `ceiling / floor` —
     * 1.3333 / 0.8533. Shrinking it further means narrowing the band until
     * these functions stop scaling at all, which is a different decision
     * from bounding them. `docs/stages/TAHAP-36.md` §6 records it as the
     * known residual and names what closing it would cost.
     */
    expect(before / after).toBeCloseTo(1.5625, 3)
    expect(before / after).toBeLessThan(3.84)
  })

  it('leaves zero alone', () => {
    expect(functions['mobile-vw']('0')).toBe('0px')
  })
})
