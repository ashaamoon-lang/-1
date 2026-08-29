import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * The studio's own copy and contact details — a singleton.
 *
 * Everything the site says about itself lives here rather than in
 * `messages/*.json`. The split is deliberate and worth keeping straight:
 *
 * - `messages/` holds **interface** text (nav labels, button copy). It ships
 *   with the code, changes when the code changes, and is typed.
 * - This document holds **editorial** text (the statement, the contact line).
 *   The studio must be able to reword it without a deploy.
 *
 * Putting editorial copy in `messages/` is the mistake that forces a developer
 * into every wording change.
 */
export const studioSettings = defineType({
  name: 'studioSettings',
  title: 'Studio',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Studio name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'headline',
      title: 'Hero headline',
      type: 'localeString',
      description:
        'One line. It is the first thing a visitor reads and the page’s only <h1>.',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'subline',
      title: 'Hero subline',
      type: 'localeText',
      description: 'One sentence. A hero is not a paragraph.',
    }),

    defineField({
      name: 'statement',
      title: 'Studio statement',
      type: 'localeRichText',
      description: 'The About / Philosophy section.',
    }),

    defineField({
      name: 'portrait',
      title: 'Portrait',
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

    defineField({
      name: 'email',
      title: 'Contact email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),

    defineField({
      name: 'socials',
      title: 'Social links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),

    defineField({
      name: 'metadata',
      title: 'Default SEO',
      type: 'metadata',
      description:
        'Fallback metadata for pages that declare none of their own.',
    }),
  ],

  preview: {
    select: { title: 'name' },
    prepare({ title }) {
      return { title: title || 'Studio', subtitle: 'Site-wide settings' }
    },
  },
})
