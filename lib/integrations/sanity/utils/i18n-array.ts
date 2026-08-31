import { z } from 'zod'

/**
 * Reading `internationalizedArray*` values in Studio context.
 *
 * The plugin stores a localized field as `[{ _key: 'en', value: '…' }, …]`
 * rather than an object. GROQ resolves that to a plain string before it
 * reaches the frontend (see `queries.ts`), so this module exists only for the
 * places that read the raw document shape: slug sources, previews, and
 * anything else running inside the Studio.
 *
 * Studio callbacks (`slug.options.source`, `preview.prepare`) hand back
 * loosely-typed documents, so the value is *parsed* at that boundary rather
 * than narrowed with ad-hoc `typeof` checks. A malformed field yields no
 * value instead of throwing: a preview title is not worth crashing the
 * Studio over.
 */

/** One entry of an `internationalizedArray*` field. */
const entrySchema = z.object({
  _key: z.string(),
  // `value` is absent while an editor is still filling the field in, and is
  // a Portable Text array for rich-text variants — only strings are useful
  // to the callers here, so anything else parses away.
  value: z.string().optional(),
})

const fieldSchema = z.array(entrySchema)

export type InternationalizedArrayEntry = z.infer<typeof entrySchema>
export type InternationalizedArrayField = z.infer<typeof fieldSchema>

/**
 * The value stored for `locale`, or `undefined` when the field is absent,
 * malformed, or has no entry for that locale.
 */
export function localeValue(
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- this IS the I/O boundary: Sanity Studio callbacks (slug.options.source, preview.prepare) hand back untyped documents, and `fieldSchema.safeParse` below is the validation
  field: unknown,
  locale: string
): string | undefined {
  const parsed = fieldSchema.safeParse(field)
  if (!parsed.success) return undefined

  return parsed.data.find((entry) => entry._key === locale)?.value
}

/**
 * The locales a translatable field must carry before it can be published.
 *
 * Mirrors `internationalizedArray({ languages })` in `sanity.config.ts`. Kept
 * as a literal rather than imported from `lib/i18n/routing.ts` because this
 * module runs inside the Studio bundle, which has no reason to pull in the
 * app's routing configuration.
 */
const REQUIRED_LOCALES = ['en', 'id'] as const

/**
 * Validation for an `internationalizedArray*` field that needs every language.
 *
 * `Rule.required()` on one of these fields only asserts that the array is not
 * empty — an entry for a single language satisfies it. That is how a work
 * filled in Indonesian only reached Publish, after which `/en/work/<slug>`
 * rendered the **slug** as its `<h1>`: the GROQ `coalesce` falls back to `en`,
 * and there was no `en` (`docs/AUDIT-2026-08.md` §2.5).
 *
 * The studio writes in Indonesian, so Indonesian-first is the likely order,
 * and all three fixtures happened to be complete in both — which is why the
 * suite stayed green over it.
 *
 * @example
 * ```ts
 * validation: (Rule) => Rule.required().custom(requireEveryLocale)
 * ```
 */
export function requireEveryLocale(
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- this IS the I/O boundary: Sanity hands validators the raw field value, and `fieldSchema.safeParse` below is the validation
  field: unknown
): true | string {
  const parsed = fieldSchema.safeParse(field)
  if (!parsed.success) return 'Expected a translatable field.'

  const missing = REQUIRED_LOCALES.filter(
    (locale) =>
      !parsed.data.find((entry) => entry._key === locale)?.value?.trim()
  )

  if (missing.length === 0) return true

  return `Fill in every language before publishing. Missing: ${missing.join(', ')}.`
}
