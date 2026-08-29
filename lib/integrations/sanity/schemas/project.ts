import { defineArrayMember, defineField, defineType } from 'sanity'

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
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Shared across languages — /en/work/<slug> and /id/work/<slug>.',
      options: {
        // Sources from the default-locale title; a localized slug would give
        // the same work two URLs per language and make hreflang pairing
        // guesswork instead of a lookup.
        source: 'title.en',
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
          type: 'localeString',
          description:
            'Describe the artwork, not the layout — "mural, three figures in ochre", not "project image". Read by screen readers and by search.',
          validation: (Rule) => Rule.required(),
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
              type: 'localeString',
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
      name: 'medium',
      title: 'Medium',
      type: 'localeString',
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
      type: 'localeRichText',
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
      title: 'title.en',
      slug: 'slug.current',
      media: 'cover',
      year: 'year',
    },
    prepare({ title, slug, media, year }) {
      return {
        title: title || 'Untitled',
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
