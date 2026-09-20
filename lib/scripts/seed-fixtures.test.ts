import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { isFullWidth, loneHalves } from '@/vault/blocks/project-gallery'

import { PLATES, PLATE_ALT, PREFIX, PROJECTS } from './seed-fixtures'

/**
 * The fixture tables, checked without seeding anything — Tahap 82.
 *
 * ## Why this file could not exist until now
 *
 * `seed-fixtures.ts` ran its entry point at module scope, so importing it did
 * not read the tables — it **seeded the dataset**. A reader without a token
 * had their process killed by a `process.exit(1)` at load instead, which is
 * the same problem wearing the other face. Tahap 82 put both behind
 * `import.meta.main`, and that is what makes the tables readable as data.
 *
 * ## What it holds, and why each one is here rather than assumed
 *
 * `RUN_MINIMUM` is 4 and the pool held three plates, so the horizontal track
 * had never rendered once since Tahap 64. Raising the count is easy to do
 * wrongly in exactly two ways, and both are mechanical enough to test:
 *
 * 1. **Repeating a plate inside one project** reaches four while putting the
 *    same picture on the page twice — and `PLATE_ALT` would then read the same
 *    sentence twice in a row, which is the defect Tahap 44 closed by giving
 *    the description to the plate instead of the project.
 * 2. **Leaving a half-width plate alone in its row.** `loneHalves` exists
 *    because Tahap 44's first fix corrected the track and left the row: spans
 *    running `half, full, half` put 572px of empty page beside each picture.
 *    Four plates give more room for that to happen, not less.
 *
 * The flow is not re-implemented here. `loneHalves` is the function the block
 * itself uses, imported rather than copied, so this cannot pass against a rule
 * the page no longer follows.
 */

/** What `vault/blocks/project-gallery` will compute for a plate. */
const ratioOf = (name: keyof typeof PLATES) =>
  PLATES[name].width / PLATES[name].height

describe('the fixture gallery feeds the horizontal track', () => {
  it('reads tables at all, so a broken import cannot pass silently', () => {
    // Anti-vacuum. Every assertion below iterates; an empty table would
    // satisfy all of them and report a dataset that does not exist.
    expect(PROJECTS.length, 'no fixture projects found').toBeGreaterThan(0)
    expect(Object.keys(PLATES).length).toBeGreaterThan(6)
  })

  it('seeds both gallery shapes, because the suite needs one of each', () => {
    /*
     * The first version of this test demanded four plates from **every**
     * project, and it was wrong in a way only the rendered page could show.
     *
     * 4 is `RUN_MINIMUM` in `vault/blocks/project-gallery`: at or above it the
     * gallery stops being a twelve-column grid and becomes a pinned horizontal
     * track. Raising all six therefore did not add a layout, it **replaced**
     * one — and `project-spread.e2e.ts` went red with "renders no artwork" on
     * `FEATURED_WORK`, the route ten e2e files navigate to by name.
     *
     * So the requirement is not "every project runs". It is that the dataset
     * carries a representative of each shape, which is the same argument
     * `e2e/fixtures.ts` makes for naming the square cover.
     */
    const run = PROJECTS.filter((project) => project.gallery.length >= 4)
    const grid = PROJECTS.filter((project) => project.gallery.length < 4)

    expect(
      run.length,
      'no project clears RUN_MINIMUM, so the horizontal track never renders'
    ).toBeGreaterThan(0)
    expect(
      grid.length,
      'every project became a track, so the grid has no route left to measure'
    ).toBeGreaterThan(0)
  })

  it('gives the grid work enough plates to have rows at all', () => {
    // Two plates cannot strand a half and cannot fill a row badly; the gate
    // that measures rows needs something to measure.
    for (const project of PROJECTS) {
      expect(
        project.gallery.length,
        `${project.slug} carries ${project.gallery.length} gallery plates`
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it('never shows one project the same plate twice', () => {
    for (const project of PROJECTS) {
      const unique = new Set(project.gallery)
      expect(
        unique.size,
        `${project.slug} repeats a plate: ${project.gallery.join(', ')}`
      ).toBe(project.gallery.length)
    }
  })

  it('strands a half on purpose, so the spread has somewhere to render', () => {
    /*
     * The first version of this test demanded **zero** lone halves, and it
     * had `loneHalves` backwards.
     *
     * That function is not a defect detector. It is the mechanism that picks
     * which plate gets `data-spread` — Tahap 44's fix for the 572px of empty
     * page that used to sit beside a lone portrait. A half alone in its row is
     * a **handled** case: it spreads, and its note fills the space.
     *
     * Forbidding it emptied the feature of coverage. With every project's
     * halves paired, `data-spread` rendered nowhere, and
     * `project-spread.e2e.ts:234` skipped itself on CI with "this project has
     * no spread to check" — one more skip than the run before, which is how it
     * was found. The gate was green and holding nothing.
     */
    const grid = PROJECTS.filter((project) => project.gallery.length < 4)
    const spreads = grid.filter((project) =>
      loneHalves(
        project.gallery.map((name) => isFullWidth(ratioOf(name)))
      ).some(Boolean)
    )

    expect(
      spreads.length,
      'no grid project strands a half, so `data-spread` renders on no page ' +
        'and its gates skip themselves'
    ).toBeGreaterThan(0)
  })

  it('gives every stranded half a note to fill its row with', () => {
    /*
     * `project-gallery` only spreads a lone half when it has something to put
     * in the hole: `lone[position] === true && entry.note !== null`, and the
     * note is the image's own alt. A stranded half without one gets the plain
     * half it always had — which is the defect, not a smaller version of it.
     */
    for (const project of PROJECTS) {
      const lone = loneHalves(
        project.gallery.map((name) => isFullWidth(ratioOf(name)))
      )
      for (const [index, name] of project.gallery.entries()) {
        if (lone[index] !== true) continue
        expect(
          PLATE_ALT,
          `${project.slug} strands ${name}, which has no alt to spread with`
        ).toHaveProperty(name)
      }
    }
  })

  it('describes every plate a project actually shows', () => {
    // The gallery plates carry their own description; a cover falls back to
    // the project's. A plate reaching a page without one would be read out
    // with somebody else's sentence.
    for (const project of PROJECTS) {
      for (const name of project.gallery) {
        expect(PLATE_ALT, `${name} has no description`).toHaveProperty(name)
      }
    }
  })

  it('describes them in both languages', () => {
    for (const [name, alt] of Object.entries(PLATE_ALT)) {
      const locales = alt.map((entry) => entry._key).sort()
      expect(locales, `${name} is not bilingual`).toEqual(['en', 'id'])
      for (const entry of alt) {
        expect(
          entry.value.length,
          `${name} ${entry._key} is empty`
        ).toBeGreaterThan(10)
      }
    }
  })

  it('names the prefix its own documentation promises', () => {
    /*
     * These disagreed for seventy-eight stages. The constant read `fixture-`
     * while the module's opening paragraph told the reader `fixture.`, and
     * that paragraph is the one place somebody checks before trusting
     * `--clean` with a real dataset. The doc was corrected in Tahap 82; this
     * is what stops it drifting back.
     *
     * `--clean` matches on this prefix rather than a list of names, so every
     * plate added later is removed without touching that function — which is
     * only true while the prefix is one value, in one place.
     */
    const source = readFileSync(
      join(import.meta.dir, 'seed-fixtures.ts'),
      'utf8'
    )
    const [doc] = source.split('*/')

    expect(PREFIX, 'the prefix stopped being a prefix').toMatch(/^[a-z]+[-.]$/)
    expect(
      doc,
      `the module doc does not name ${PREFIX}, the prefix --clean matches on`
    ).toContain(`\`${PREFIX}\``)
  })

  it('exercises isFullWidth on both sides of its boundary', () => {
    /*
     * The point of the ratios, stated as a test rather than only as a comment.
     *
     * Before Tahap 82 the dataset held 0.750, 1.000 and 1.778 — nothing had
     * ever approached the boundary from below on a rendered page, and
     * `TAHAP-44` records why a passing unit test is a different claim from
     * that: the gap between the two is where Tahap 11b's defect lived.
     */
    const shown = new Set(PROJECTS.flatMap((project) => project.gallery))
    const ratios = [...shown].map(ratioOf)

    expect(ratios.some((ratio) => ratio < 1)).toBe(true)
    expect(ratios.some((ratio) => ratio === 1)).toBe(true)
    expect(ratios.some((ratio) => ratio > 1)).toBe(true)

    const nearBelow = ratios.filter((ratio) => ratio >= 0.95 && ratio < 1)
    expect(
      nearBelow.length,
      'no plate approaches the full-width boundary from below'
    ).toBeGreaterThan(0)
  })
})
