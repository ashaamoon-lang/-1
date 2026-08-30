import { defineRouting } from 'next-intl/routing'

/**
 * Locale routing — the single source of truth for which locales exist.
 *
 * `localePrefix: 'always'` is deliberate, not the default taken by accident.
 * Both locales carry a path prefix (`/en`, `/id`) and the root redirects.
 *
 * The alternative — root serving the default locale, prefix only for the
 * other — gives the home page two valid URLs. `lib/seo/alternates.ts` is
 * explicit that a page's canonical must match the URL `app/sitemap.ts`
 * submits, or a search engine crawls one and indexes the other. Symmetric
 * prefixes mean exactly one canonical form per page, with no special case in
 * the sitemap, `/llms.txt`, or Markdown negotiation.
 *
 * It also keeps `proxy.ts` simple: 'always' makes next-intl emit plain
 * redirects rather than internal rewrites, so it never competes with the
 * Markdown rewrite that proxy already performs.
 */
export const routing = defineRouting({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]

/**
 * Narrowing guard for a value arriving from a URL segment.
 *
 * The parameter is `string | undefined` rather than `unknown` because that is
 * exactly what `next/root-params` hands back: the segment matched, or nothing.
 * Widening it to `unknown` would invite callers to pass unparsed input from
 * anywhere.
 */
export function isLocale(value: string | undefined): value is Locale {
  // SAFETY: `routing.locales` is a readonly tuple of string literals. Widening
  // it to `readonly string[]` only relaxes the element type for the `includes`
  // call — which cannot accept the narrower literal union — and reads no
  // property that the tuple does not have.
  return (
    value !== undefined &&
    (routing.locales as readonly string[]).includes(value)
  )
}

/** BCP 47 tags, for `<html lang>` and hreflang. */
export const LOCALE_TAGS = {
  en: 'en-US',
  id: 'id-ID',
} as const satisfies Record<Locale, string>

/**
 * The same locale in OpenGraph's spelling: `language_TERRITORY`, underscore.
 *
 * OpenGraph is not BCP 47 and never was — its spec asks for `en_US`, and a
 * consumer that reads `en-US` there falls back to its own default. So the
 * hyphenated tag above is correct for `<html lang>` and hreflang and wrong
 * for `og:locale`, which is exactly the kind of near-miss that ships: both
 * strings look right, and no validator in the build reads either one.
 *
 * Derived rather than listed as a second map, so the two spellings cannot
 * drift apart when a locale is added.
 */
export function ogLocale(locale: Locale): string {
  return LOCALE_TAGS[locale].replace('-', '_')
}

/** Human-readable names, for the language switcher. */
export const LOCALE_LABELS = {
  en: 'English',
  id: 'Bahasa Indonesia',
} as const satisfies Record<Locale, string>
