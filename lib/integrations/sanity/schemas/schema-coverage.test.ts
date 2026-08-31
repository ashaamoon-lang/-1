import { describe, expect, it } from 'bun:test'

import { Glob } from 'bun'

import { schema } from './index'

/**
 * Every document type an editor can create must be renderable.
 *
 * ## What this caught
 *
 * Two document types shipped for ten stages with no way to see them:
 *
 *   - **`navigation`** — a singleton with menu items, no GROQ query, no
 *     component, no consumer of any kind. It sat in the Studio sidebar
 *     inviting the studio to build a menu that nothing would ever read, while
 *     `components/layout/header` rendered a hardcoded one.
 *   - **`article`** — a full blog document type with its own
 *     `/[locale]/articles/[slug]` route, on a commissioned-artwork studio site
 *     with no writing. `docs/PANDUAN-STUDIO.md` never mentioned it, so the one
 *     person meant to use it was never told it existed.
 *
 * Both were inherited from the Satūs starter and neither was a decision. The
 * cost is not disk space: a document type an editor can fill in and the site
 * cannot show is worse than a missing feature, because it quietly discards
 * real work. `docs/stages/TAHAP-10.md` §1.3 records the removal.
 *
 * ## How "rendered" is decided
 *
 * A document type counts as rendered when its name appears in a GROQ query in
 * `queries.ts` — that is the only route by which its data can reach a page,
 * and it is a fact about the code rather than a list to keep in step. Object
 * types (`link`, `metadata`, `richText`) are excluded: they exist to be
 * embedded in documents and never get a query of their own.
 *
 * The check is deliberately shallow. It cannot prove a query is *called*, and
 * it does not try — `e2e/no-javascript.e2e.ts` and `route-sweep` cover
 * whether the pages actually render. What it proves is that no type has been
 * added to the Studio with no path out of it at all, which is the failure
 * that actually happened.
 */

const QUERIES = new URL('../queries.ts', import.meta.url).pathname

describe('schema coverage', () => {
  it('every document type is read by at least one query', async () => {
    const queries = await Bun.file(QUERIES).text()

    const documentTypes = schema.types
      .filter((type) => type.type === 'document')
      .map((type) => type.name)

    // A fresh clone must not pass this vacuously.
    expect(documentTypes.length).toBeGreaterThan(0)

    const unread = documentTypes.filter(
      (name) =>
        !queries.includes(`_type == "${name}"`) &&
        !queries.includes(`"${name}"`)
    )

    expect(
      unread,
      `document types with no query — either render them or remove them from the Studio: ${unread.join(', ')}`
    ).toEqual([])
  })

  it('no schema file is left behind after a type is removed', async () => {
    // Widened to `string`: `schema.types` is a literal tuple, so `Set<…>.has`
    // would only accept a name that is already registered — which is the
    // opposite of what this check asks.
    const registered = new Set<string>(schema.types.map((type) => type.name))
    // The plugin-generated `internationalizedArray*` types are registered in
    // `sanity.config.ts`, not here, and have no file in this directory.
    const ignored = new Set(['index', 'schema-coverage.test'])

    const orphans: string[] = []
    for await (const file of new Glob('*.ts').scan({
      cwd: new URL('.', import.meta.url).pathname,
    })) {
      const name = file.replace(/\.ts$/, '')
      if (ignored.has(name) || name.endsWith('.test')) continue
      if (!registered.has(name)) orphans.push(file)
    }

    expect(
      orphans,
      `schema files not registered in schema.types — dead code: ${orphans.join(', ')}`
    ).toEqual([])
  })
})
