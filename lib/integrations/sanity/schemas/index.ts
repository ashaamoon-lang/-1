/**
 * Sanity Schema Types
 *
 * All schema definitions for Sanity CMS, organized in a flat structure.
 */

import type { SchemaTypeDefinition } from 'sanity'

import { article } from './article'
// Import all schema definitions
import { link } from './link'
import { localeRichText, localeString, localeText } from './locale'
import { metadata } from './metadata'
import { navigation } from './navigation'
import { page } from './page'
import { project } from './project'
import { richText } from './richText'
import { studioSettings } from './studioSettings'

// Re-export all schemas for convenience
export {
  article,
  link,
  localeRichText,
  localeString,
  localeText,
  metadata,
  navigation,
  page,
  project,
  richText,
  studioSettings,
}

// Schema collection for Sanity configuration
export const schema = {
  types: [
    // Object types (reusable components)
    link,
    metadata,
    richText,

    // Localized object types. Must be registered BEFORE any document that
    // references them by name, or Sanity resolves `localeString` to nothing
    // and the field silently disappears from the Studio.
    localeString,
    localeText,
    localeRichText,

    // Document types (content pages)
    page,
    article,
    project,

    // Singleton types (one-off content)
    navigation,
    studioSettings,
  ],
} satisfies { types: SchemaTypeDefinition[] }
