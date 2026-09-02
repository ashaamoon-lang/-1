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
 * The URL segment that separates a filter from a work.
 *
 * `/work/practice/ai-data` is a filtered catalogue; `/work/rimbun` is one
 * piece of work. Without a segment between them a work whose slug happened to
 * be `ai-data` would shadow the filter, so the schema forbids that slug — and
 * it imports this constant to do it, rather than repeating the string.
 */
export const PRACTICE_SEGMENT = 'practice'

export function practiceTemplate(value: Practice): string {
  return `/work/${PRACTICE_SEGMENT}/${value}`
}
