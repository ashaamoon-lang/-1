/**
 * The disciplines a commission can belong to.
 *
 * One list, three consumers that must never disagree:
 *
 *  - `lib/integrations/sanity/schemas/project.ts` offers them to the editor,
 *  - `app/[locale]/work/discipline/[value]/` serves one page per value,
 *  - `lib/seo/route-catalog.ts` puts those pages in the sitemap.
 *
 * Values are unlocalized on purpose. They are stored in Sanity and appear in
 * URLs, so they have to be stable across both languages; the *label* is
 * translated (`messages/{en,id}.json`, `workIndex.<value>`), the key is not.
 * Adding one here without adding its label to both message files is a type
 * error, which is the point.
 */
export const DISCIPLINES = ['painting', 'mural', 'illustration'] as const

export type Discipline = (typeof DISCIPLINES)[number]

export function isDiscipline(value: string | undefined): value is Discipline {
  // SAFETY: `DISCIPLINES` is a readonly tuple of string literals. Widening it
  // to `readonly string[]` only relaxes the element type for `includes`, which
  // cannot accept an argument outside the narrower union, and reads no
  // property the tuple does not have. Same shape as `isLocale` in
  // `lib/i18n/routing.ts`.
  return (
    value !== undefined && (DISCIPLINES as readonly string[]).includes(value)
  )
}

/**
 * The URL segment that separates a discipline view from a project.
 *
 * `/work/discipline/mural` and `/work/rimbun` share the `/work/` parent, so
 * this word is reserved: a project whose slug is `discipline` would be
 * shadowed by the filter route and become unreachable. Next matches a static
 * segment before a dynamic one, so the collision is silent — the project would
 * simply never render, with no error anywhere.
 *
 * Three places enforce the reservation rather than trusting anyone to
 * remember it: the Sanity slug validation rejects it at authoring time,
 * `generateStaticParams` in `work/[slug]` filters it out, and that page
 * `notFound()`s it at request time.
 */
export const DISCIPLINE_SEGMENT = 'discipline'

/** Locale-free route template for one discipline view. */
export function disciplineTemplate(value: Discipline): string {
  return `/work/${DISCIPLINE_SEGMENT}/${value}`
}
