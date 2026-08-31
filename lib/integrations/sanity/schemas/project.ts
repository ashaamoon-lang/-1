import { defineArrayMember, defineField, defineType } from 'sanity'

import { localeValue, requireEveryLocale } from '../utils/i18n-array'

/**
 * Localized fields use `internationalizedArray*` types registered by the
 * plugin in `sanity.config.ts`, not localized objects. Sanity's guidance is
 * explicit that objects hit document attribute limits; an array grows a row
 * per language instead of an attribute per language.
 *
 * The shape is `[{ _key: 'en', value: '…' }]`, so Studio-side reads (slug
 * source, preview) go through `localeValue` rather than `field.en`.
 */
const DEFAULT_LOCALE = 'en'

/**
 * A commissioned work.
 *
 * The core content type: everything the site shows is a project, plus the
 * studio's own copy. Images are the medium here (illustration, painting,
 * mural), so the schema is built around still imagery rather than video.
 */
export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'internationalizedArrayString',
      // Every language, not just one — see `requireEveryLocale`. Without it a
      // work published in Indonesian only rendered its slug as the English
      // `<h1>`.
      validation: (Rule) => Rule.required().custom(requireEveryLocale),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Shared across languages — /en/work/<slug> and /id/work/<slug>.',
      options: {
        // Sources from the default-locale title. A path string like
        // `title.en` no longer resolves: the plugin stores an array, so the
        // entry has to be looked up by `_key`. A localized slug would also
        // give the same work two URLs per language and make hreflang pairing
        // guesswork instead of a lookup.
        source: (doc) => localeValue(doc.title, DEFAULT_LOCALE) ?? '',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom((slug) => {
          // Copied deliberately from `page.ts`, which documents why: a dot is
          // a valid Sanity slug character but collides with proxy.ts's
          // FILE_EXTENSION heuristic, which treats any dotted last segment as
          // a static asset. Such a route vanishes silently from the sitemap,
          // /llms.txt, and Markdown negotiation.
          if (slug?.current?.includes('.')) {
            return 'Slug cannot contain a dot ("."). Dotted paths are treated as static files and are excluded from the sitemap, llms.txt, and Markdown negotiation.'
          }
          return true
        }),
    }),

    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'image',
      description: 'Used in the work grid and as the OpenGraph image.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'internationalizedArrayString',
          description:
            'Describe the artwork, not the layout — "mural, three figures in ochre", not "project image". Read by screen readers and by search.',
          validation: (Rule) => Rule.required().custom(requireEveryLocale),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'internationalizedArrayString',
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      description: 'Left unlocalized: a name is a name in both languages.',
    }),

    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: (Rule) => Rule.integer().min(1900).max(2200),
    }),

    defineField({
      name: 'discipline',
      title: 'Discipline',
      type: 'string',
      description:
        'Which kind of work this is. Drives the filter on /work and the structured data.',
      /*
       * A closed list, and deliberately NOT localized.
       *
       * `medium` below is free prose and stays that way — "Acrylic on canvas"
       * is a description, not a category. But `lib/seo/site.ts` advertises
       * exactly three disciplines in three places (`services`, `knowsAbout`,
       * `description`) and nothing in the schema could express which one a
       * work belongs to, so neither a visitor nor an agent could act on the
       * claim.
       *
       * The value is a key; the label is translated in `messages/*.json`.
       * Localizing the value would give one work two different filter URLs,
       * and `?discipline=mural` would stop meaning the same thing in each
       * language.
       */
      options: {
        list: [
          { title: 'Painting', value: 'painting' },
          { title: 'Mural', value: 'mural' },
          { title: 'Illustration', value: 'illustration' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      initialValue: 'painting',
    }),

    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'internationalizedArrayString',
      description: 'e.g. "Acrylic on canvas" / "Akrilik di atas kanvas".',
    }),

    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'string',
      description: 'e.g. 120 × 90 cm. Unlocalized — units read the same.',
    }),

    defineField({
      name: 'body',
      title: 'Description',
      type: 'internationalizedArrayRichText',
    }),

    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description:
        'Lower numbers first in the work grid. Curation is editorial, so it is explicit rather than derived from the date.',
      initialValue: 100,
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show on the home page selection.',
      initialValue: false,
    }),

    defineField({
      name: 'listed',
      title: 'Listed publicly',
      type: 'boolean',
      description:
        'Off = removed from the work index, the sitemap, llms.txt and the next-project chain. The page itself stays reachable by its link, but tells search engines not to index it.',
      /*
       * `featured` and `listed` are not the same switch, and conflating them
       * is what `docs/PANDUAN-STUDIO.md` §7 did: it told the studio to turn
       * Featured off to hide a work. That only removes it from the home page.
       * Measured — the work stayed in `sitemap.xml` (twice), in `/llms.txt`
       * (twice), and in the next-project chain, and
       * `e2e/project-detail.e2e.ts` actively asserted it must
       * (`docs/AUDIT-2026-08.md` §2.2).
       *
       *   featured -> curation: does this belong on the home page
       *   listed   -> catalogue: does this exist publicly at all
       *
       * Off does not 404. Links already shared have to keep working; the page
       * goes `noindex` and disappears from every listing instead. That is a
       * rule the studio can be told in one sentence, and "it 404s" is not.
       */
      initialValue: true,
    }),

    defineField({
      name: 'span',
      title: 'Grid span',
      type: 'number',
      description:
        'Half width (6) or full width (12) of the 12-column grid. Mixing widths is what stops the grid reading as a spreadsheet.',
      options: {
        list: [
          { title: 'Half (6 columns)', value: 6 },
          { title: 'Full (12 columns)', value: 12 },
        ],
        layout: 'radio',
      },
      initialValue: 6,
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: 'metadata',
      title: 'SEO & Metadata',
      type: 'metadata',
    }),
  ],

  preview: {
    select: {
      // The whole array — `title.en` is not a valid path into it.
      title: 'title',
      slug: 'slug.current',
      media: 'cover',
      year: 'year',
    },
    prepare({ title, slug, media, year }) {
      return {
        title: localeValue(title, DEFAULT_LOCALE) || 'Untitled',
        subtitle: [year, slug && `/${slug}`].filter(Boolean).join(' · '),
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Curated order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
})
