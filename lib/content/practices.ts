/**
 * The three things Arth does, in one place.
 *
 * ## Why this module exists at all
 *
 * The same three values are needed by four systems that cannot see each
 * other: the Sanity schema's closed list, the `/work/practice/<value>` route
 * and its `generateStaticParams`, the sitemap and route catalogue, and the
 * filter chips on the catalogue page. Written out four times they drift, and
 * the drift is silent — a route with no schema value renders an empty
 * catalogue, a schema value with no route is unreachable, and neither fails a
 * build.
 *
 * `lib/content/practices.test.ts` is the other half: it checks that every key
 * here is labelled in both languages and that the structured data advertises
 * the same number of things the catalogue can filter by.
 *
 * ## Practices, not disciplines
 *
 * This module was `disciplines.ts` and held `painting`, `mural`,
 * `illustration` — the site was built as a commissioned-artwork studio for
 * twelve stages before the sector was corrected. Arth is a high-ticket agency:
 * consulting, AI and data, and commissioned work.
 *
 * "Discipline" is a fine-art word. "Practice" is the word the site already
 * uses for this: the hero's right-hand column has been labelled `Practice` /
 * `Praktik` since Tahap 12d.
 *
 * ## The values are keys, and are not localized
 *
 * `ai-data` is a URL segment, a schema value and a message key — the same
 * string in both languages. Localizing it would give one piece of work two
 * different filter URLs, and `/work/practice/ai-data` would stop meaning the
 * same thing in each language. The human labels live in `messages/*.json`.
 */

export const PRACTICES = ['consulting', 'ai-data', 'commission'] as const

export type Practice = (typeof PRACTICES)[number]

export function isPractice(value: string | undefined): value is Practice {
  // SAFETY: `PRACTICES` is a readonly tuple of string literals. Widening it to
  // `readonly string[]` only relaxes the element type for `includes`, which
  // cannot accept an argument outside the narrower union, and reads no
  // property the tuple does not have. Same shape as `isLocale` in
  // `lib/i18n/routing.ts`.
  return value !== undefined && (PRACTICES as readonly string[]).includes(value)
}

/**
 * The top-level segment that practice pages live under.
 *
 * ## It moved in Tahap 15, and what it guards moved with it
 *
 * This used to be a segment *inside* `/work`: `/work/practice/ai-data` was a
 * filtered catalogue sitting beside `/work/rimbun`, one piece of work. What it
 * guarded was that pairing — a work whose slug happened to be `practice` would
 * have shadowed the filter, so the schema forbade it.
 *
 * A practice now has a page of its own at `/practice/<value>`, and the
 * collision is a different one: `/practice` is a static segment competing with
 * `app/[locale]/[...slug]`, the CMS catch-all. Next resolves static segments
 * first, so the page wins — but a CMS page published at slug `practice` would
 * then be unreachable, silently. The schema forbids that instead.
 *
 * Same constant, same reason for existing: a path that is decided in one place
 * and imported everywhere cannot drift from the guard that protects it.
 */
export const PRACTICE_SEGMENT = 'practice'

/**
 * The locale-free path of a practice's page.
 *
 * Eight modules import this — the practice page, the catalogue's hrefs, the
 * old `/work/practice` redirect, the footer, the practice list, the studio and
 * journal pages, and the route catalogue, through which the sitemap,
 * `/llms.txt` and the alternates helper reach it. (It said "ten", counting
 * the `/ai` page; recounted in Tahap 89.) Moving a practice's
 * URL is one edit here, which is the whole reason this module exists
 * (`lib/seo/route-catalog.ts` and `app/[locale]/work/hrefs.ts` both compose it
 * rather than writing the string out).
 */
export function practiceTemplate(value: Practice): string {
  return `/${PRACTICE_SEGMENT}/${value}`
}

/**
 * The character the capability lines are authored with, between items.
 *
 * `messages/{en,id}.json` holds one line per practice —
 * `"Architecture review · System mapping · Technical due diligence · Decision
 * records"` — and that line is **twelve pieces of information across three
 * strings**. The middle dot is the only thing separating them, and it is a
 * presentation device: no capability's name contains one.
 */
export const CAPABILITY_SEPARATOR = '·'

/**
 * One authored capability line, read back as the items it was written from.
 *
 * ## Why the dictionary was not restructured instead
 *
 * The obvious alternative was four named keys per practice
 * (`capabilities.consulting.review`, `.mapping`, …) so `t()` could reach each
 * item directly. It **does not type-check where it is needed**: the page maps
 * over `PRACTICES`, so `practice` is the whole union at the call site, and
 * `t(`capabilities.${practice}.${item}`)` expands to the *product* of three
 * practices and twelve item names — thirty-six keys, of which twelve exist.
 * TypeScript cannot correlate the two halves through a `.map()`, so the shape
 * that looks more typed is the one that needs a cast to compile.
 *
 * Uniform slot names (`one`…`four`) would type cleanly and are worse twice
 * over: they say nothing, and numbering an **unordered** set is the thing
 * `vault/blocks/step-sequence` already records this project as refusing.
 *
 * So the line stays one readable sentence for whoever translates it, and the
 * guarantee moves to `practices.test.ts`, which asserts every practice splits
 * into the same number of non-empty items in **both** locales. A test can
 * promise that; a key name cannot.
 *
 * ## What it does with a line that has no separator
 *
 * Returns the whole line as one item. A translation that lost its dots
 * degrades to a one-item list rather than an empty section — and the test
 * above is what stops that reaching a reader.
 */
export function capabilityItems(line: string): readonly string[] {
  return line
    .split(CAPABILITY_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item !== '')
}
