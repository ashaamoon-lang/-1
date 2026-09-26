import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { webglIntent } from './webgl-intent'

/**
 * Navigating back and forth never orphans a live WebGL context — Tahap 96.
 *
 * ## The defect this exists to prevent
 *
 * Tahap 85 fixed a page that went blank after navigation by **rebuilding** the
 * r3f root when a hidden page tree is shown again: `cachedNavigations` keeps
 * the previous tree in the document, its context is torn down while hidden,
 * and the rebuild is what brings it back. `TAHAP-85.md` §6.3 left the cost of
 * that rebuild unmeasured, and this is the half of it that can become a
 * defect.
 *
 * A browser caps simultaneous WebGL contexts — Chrome at roughly sixteen. A
 * rebuild that leaves the replaced context alive would reach that cap in a
 * dozen navigations, and a canvas that then fails to initialise is a page that
 * silently loses its accent: the same shape as the defect Tahap 85 was written
 * for, arrived at from the other side.
 *
 * ## What it measures
 *
 * Measured on this project's laptop, five cycles, against a production build:
 *
 * ```
 * cycle  adopted  lost  restored  live+attached  live+detached  inDoc
 * 0        1       0      0           1              0            1
 * 1        1       1      0           0              0            1
 * 2        2       1      0           1              0            1
 * 5        5       4      0           1              0            1
 * ```
 *
 * One new canvas element per rebuild, the previous one's context released,
 * never restored, and **never once a canvas outside the document still holding
 * a live context**. That last column is the leak, and zero is the claim this
 * gate keeps.
 *
 * ## Two earlier versions of this measurement were wrong
 *
 * The first wrapped `HTMLCanvasElement.prototype.getContext`. That needed a
 * chain of type assertions to re-express an overloaded DOM method, which this
 * repository's lint refuses, and its own liveness check called `getContext` on
 * every canvas — inflating its count by one per read.
 *
 * The second counted canvas elements against `webglcontextlost` events and
 * called the difference "unreleased contexts". It is not: one element can lose
 * and regain a context repeatedly, so the two series are not commensurable. It
 * reported a leak of one where the measurement above shows none.
 *
 * What is counted now is neither: each canvas carries its own lost/restored
 * state, and the question asked is whether any canvas is **live while
 * detached**. Nothing here patches a built-in or calls `getContext`.
 */

/** Cycles run before the counts are compared. */
const CYCLES = 4

/** A route with a canvas, and one without, to navigate between. */
const HOME = '/en'
const AWAY = '/en/studio'

interface Counts {
  /** Canvas elements that have ever been in the document. */
  adopted: number
  /** Canvases holding a context and still in the document. */
  liveAttached: number
  /** Canvases holding a context that are no longer in the document. */
  liveDetached: number
  /** Canvas elements in the document right now. */
  inDoc: number
}

declare global {
  interface Window {
    __glLifecycle?: { list: { el: HTMLCanvasElement; lost: boolean }[] }
  }
}

/**
 * Tracks each canvas's own context state from inside the page.
 *
 * Installed before any application script runs, so the first canvas is counted
 * too.
 */
async function installCounter(page: Page) {
  await page.addInitScript(() => {
    const state: NonNullable<Window['__glLifecycle']> = { list: [] }
    window.__glLifecycle = state

    const adopt = (canvas: HTMLCanvasElement) => {
      if (canvas.dataset.glSeen) return
      canvas.dataset.glSeen = 'yes'
      const entry = { el: canvas, lost: false }
      state.list.push(entry)
      canvas.addEventListener('webglcontextlost', () => {
        entry.lost = true
      })
      canvas.addEventListener('webglcontextrestored', () => {
        entry.lost = false
      })
    }

    const scan = (node: Element | null) => {
      if (!node) return
      if (node instanceof HTMLCanvasElement) adopt(node)
      for (const canvas of node.querySelectorAll('canvas')) adopt(canvas)
    }

    /*
     * Observed on `document`, not on `document.documentElement` — an init
     * script runs before the document has an element, so observing that would
     * throw and take the rest of this script with it. It did: an earlier
     * version of this counter reported nothing forever, and the gate below
     * passed by comparing nothing to nothing.
     */
    new MutationObserver(() => scan(document.documentElement)).observe(
      document,
      { childList: true, subtree: true }
    )

    scan(document.documentElement)
  })
}

/** Reads the counters without creating a context of its own. */
async function counts(page: Page): Promise<Counts> {
  return page.evaluate(() => {
    const list = window.__glLifecycle?.list ?? []
    return {
      adopted: list.length,
      liveAttached: list.filter((entry) => !entry.lost && entry.el.isConnected)
        .length,
      liveDetached: list.filter((entry) => !entry.lost && !entry.el.isConnected)
        .length,
      inDoc: document.querySelectorAll('canvas').length,
    }
  })
}

/** One away-and-back navigation, entirely client-side. */
async function cycle(page: Page) {
  const link = page.locator(`a[href$="${AWAY}"]`).first()
  await link.scrollIntoViewIfNeeded()
  await link.click()
  await page.waitForURL(`**${AWAY}`, { timeout: 30_000 })
  await page.waitForTimeout(700)
  await page.goBack()
  await page.waitForURL((url) => url.pathname === HOME, { timeout: 30_000 })
  await page.waitForTimeout(1100)
}

test.describe('the WebGL root survives navigation without hoarding', () => {
  test('repeated back-navigation orphans no live WebGL context', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await installCounter(page)
    await page.goto(HOME, { waitUntil: 'domcontentloaded' })

    const intent = await webglIntent(page)
    test.skip(!intent.intended, intent.reason)

    await page
      .locator('canvas')
      .first()
      .waitFor({ state: 'attached', timeout: 30_000 })
    await page.waitForTimeout(1500)

    const first = await counts(page)
    for (let index = 0; index < CYCLES; index++) await cycle(page)
    const last = await counts(page)

    /*
     * Anti-vacuum, and it is not hypothetical — Tahap 96.
     *
     * An earlier build of this gate installed its observer on
     * `document.documentElement`, which does not exist yet when an init script
     * runs. `observe` threw, the counter never ran, and every comparison below
     * held zero against zero. It passed in 17 seconds, measuring nothing. A
     * leak injected to prove it could go red is what exposed that instead.
     */
    expect(
      first.adopted,
      'the counter saw no canvas at all — it is broken, not the page'
    ).toBeGreaterThan(0)

    expect(
      last.liveDetached,
      `${last.liveDetached} canvas(es) left the document still holding a live WebGL context after ${CYCLES} navigations — a browser caps these at about sixteen, and the page loses its accent once it does`
    ).toBe(0)

    expect(
      last.liveAttached,
      `${last.liveAttached} live contexts are attached at once; this site mounts a single shared canvas`
    ).toBeLessThanOrEqual(1)

    expect(
      last.inDoc,
      `the document held ${first.inDoc} canvas(es) before and ${last.inDoc} after ${CYCLES} navigations — they are accumulating`
    ).toBe(first.inDoc)
  })
})
