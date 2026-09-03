import { defineField, defineType } from 'sanity'

import { PRACTICES } from '@/lib/content/practices'

import { requireEveryLocale } from '../utils/i18n-array'

/**
 * A journal entry — the studio writing about how it works.
 *
 * ## This re-opens a door Tahap 10 deliberately closed, and that is worth saying
 *
 * The Satūs starter shipped an `article` document type with its own
 * `/[locale]/articles/[slug]` route, and Tahap 10 removed it. The reasoning is
 * in `schema-coverage.test.ts` and it was right: it was "a full blog document
 * type on a commissioned-artwork studio site with no writing",
 * `docs/PANDUAN-STUDIO.md` never mentioned it, and the one person meant to use
 * it was never told it existed.
 *
 * Three things are different here, and all three are the reason the door is
 * open again rather than an argument that it should never have shut:
 *
 * 1. It was **asked for** — the site owner named the journal as a route to
 *    build, so it is a decision rather than an inheritance.
 * 2. It has a **route, a query, and a rendered page** on the day it ships, so
 *    nothing an editor writes here is discarded.
 * 3. It is **documented** for the person expected to use it.
 *
 * If those stop being true, this type should go the way `article` did.
 *
 * ## The scaffolding contract
 *
 * `lib/content/journal-fallback.ts` carries three entries in code so the
 * layout can be judged before the studio has written anything. **The moment
 * one document of this type is published, that file stops being rendered
 * entirely** — all or nothing, so a reader is never shown invented articles
 * beside real ones with no way to tell which is which.
 */
export const journalEntry = defineType({
  name: 'journalEntry',
  title: 'Journal entry',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      // Every language, for the reason `project.title` records: an entry
      // published in one language only rendered its slug as the other
      // language's heading.
      validation: (Rule) => Rule.required().custom(requireEveryLocale),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'The URL segment. Shared by both languages.',
      options: { source: 'title.0.value', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'date',
      title: 'Published',
      type: 'date',
      description:
        'Rendered in the reader’s language, so store the date and not a formatted string.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'internationalizedArrayText',
      description:
        'One or two sentences. Shown on the index and under the title.',
      validation: (Rule) => Rule.required().custom(requireEveryLocale),
    }),

    defineField({
      name: 'body',
      title: 'Body',
      type: 'internationalizedArrayRichText',
      description: 'The entry itself.',
    }),

    defineField({
      name: 'practice',
      title: 'Practice',
      type: 'string',
      description:
        'Which practice this belongs under. Optional — an entry may belong to none.',
      options: {
        // From the same constant the routes, the footer index and the studio
        // page read, so a practice cannot exist here and nowhere else.
        list: PRACTICES.map((value) => ({ title: value, value })),
        layout: 'radio',
      },
    }),

    defineField({
      name: 'listed',
      title: 'Listed',
      type: 'boolean',
      initialValue: true,
      description:
        'Turn off to withdraw an entry from the journal, the sitemap and /llms.txt.',
    }),
  ],

  preview: {
    select: { title: 'title.0.value', subtitle: 'date' },
  },
})
