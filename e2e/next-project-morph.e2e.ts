import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { transitionName } from '../lib/motion/transition-name'
import { FEATURED_WORK } from './fixtures'

/**
 * The next project's cover morphs into the next project's hero — and only
 * when it is the link the reader pressed.
 *
 * `vault/blocks/next-project/link.tsx` names the cover at the press, not at
 * render. These pin both halves of that decision. Pressing the next project
 * forms the pair. Leaving the case study any other way carries this page's
 * hero alone — the defect that kept the morph under *Ditunda* in
 * `docs/HANDOFF.md` §4.1, where a cover named at render also pairs with its
 * catalogue card and two covers fly into the grid.
 *
 * Names are read where the browser captures them, the method
 * `captureMorph` in `motion.e2e.ts` established: at the start of the update
 * callback the old page is still in the DOM with its names applied, and once
 * the update is done the new page carries its own.
 */

declare global {
  var __nextMorph: { old: string[]; fresh: string[] }
}

async function recordMorphs(page: Page) {
  await page.evaluate(() => {
    const record: typeof globalThis.__nextMorph = { old: [], fresh: [] }
    globalThis.__nextMorph = record

    const named = () =>
      [...document.querySelectorAll('*')]
        .map((element) => getComputedStyle(element).viewTransitionName)
        .filter((name) => name !== '' && name !== 'none')

    const original = document.startViewTransition.bind(document)
    document.startViewTransition = (argument) => {
      const wrap =
        (update: ViewTransitionUpdateCallback | null | undefined) =>
        async () => {
          record.old.push(...named())
          await update?.()
        }
      let options = argument
      if (typeof argument === 'function') options = wrap(argument)
      else if (argument !== undefined) {
        options = { ...argument, update: wrap(argument.update) }
      }

      const transition = original(options)
      const settle = () => {
        record.fresh.push(...named())
      }
      transition.updateCallbackDone.then(settle, settle)
      return transition
    }
  })
}

async function nextSlug(page: Page) {
  const href =
    (await page.locator('[data-press="next"]').first().getAttribute('href')) ??
    ''
  return href.split('/').pop() ?? ''
}

test.describe('the next project carries its cover', () => {
  test('pressing it morphs the cover into the next hero', async ({ page }) => {
    await page.goto(`/en/work/${FEATURED_WORK}`)
    await page.waitForTimeout(1500)

    const slug = await nextSlug(page)
    expect(slug, 'the case study rendered no next project').not.toBe('')

    const next = page.locator('[data-press="next"]').first()
    await next.scrollIntoViewIfNeeded()
    // Its reveal and its veil settle before the press, as a reader's would.
    await page.waitForTimeout(1200)

    await recordMorphs(page)
    await next.click()
    await page.waitForURL(`**/work/${slug}`)
    await page.waitForTimeout(1800)

    const { old, fresh } = await page.evaluate(() => globalThis.__nextMorph)
    expect(old, 'the pressed cover was not named for the morph').toContain(
      transitionName(slug)
    )
    expect(fresh, 'the next hero did not take the name').toContain(
      transitionName(slug)
    )
  })

  test('leaving another way carries this page’s hero alone', async ({
    page,
  }) => {
    await page.goto(`/en/work/${FEATURED_WORK}`)
    await page.waitForTimeout(1500)

    const slug = await nextSlug(page)
    expect(slug, 'the case study rendered no next project').not.toBe('')

    await recordMorphs(page)
    await page.locator('a[href="/en/work"]').first().click()
    await page.waitForURL('**/en/work')
    await page.waitForTimeout(1800)

    const { old } = await page.evaluate(() => globalThis.__nextMorph)
    const covers = [
      ...new Set(old.filter((name) => name.startsWith(transitionName('')))),
    ]
    expect(
      covers,
      `the next cover was named without being pressed: ${covers.join(', ')}`
    ).toEqual([transitionName(FEATURED_WORK)])
  })
})
