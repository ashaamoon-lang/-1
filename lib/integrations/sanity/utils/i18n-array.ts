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
