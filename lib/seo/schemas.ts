import type { Locale } from '@/lib/i18n/routing'

import { SITE, siteFacts } from './site'

/**
 * Typed schema.org node builders for JSON-LD.
 *
 * Hard rule: never emit a key whose value is null, undefined, or an empty
 * array. A `"description": null` is actively worse than an absent key —
 * validators flag it and answer engines treat the entity as incomplete.
 * Every optional field below is built by assigning to the field only when a
 * value is present (never an unconditional `field: undefined`, which would
 * still emit the key under `exactOptionalPropertyTypes`).
 */

export const ORGANIZATION_ID = `${SITE.url}/#organization`
export const WEBSITE_ID = `${SITE.url}/#website`

interface PostalAddress {
  '@type': 'PostalAddress'
  addressCountry: string
}

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  '@id': string
  name: string
  url: string
  logo: string
  description: string
  alternateName?: readonly string[]
  knowsAbout?: readonly string[]
  areaServed?: string
  foundingDate?: string
  email?: string
  sameAs?: readonly string[]
  address?: PostalAddress
}

export interface WebSiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  '@id': string
  name: string
  url: string
  publisher: { '@id': string }
}

export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

interface CollectionItemListItem {
  '@type': 'ListItem'
  position: number
  name: string
  url: string
}

interface CollectionItemList {
  '@type': 'ItemList'
  numberOfItems: number
  itemListElement: CollectionItemListItem[]
}

export interface CollectionPageSchema {
  '@context': 'https://schema.org'
  '@type': 'CollectionPage'
  name: string
  url: string
  isPartOf: { '@id': string }
  description?: string
  mainEntity?: CollectionItemList
}

interface ArticleAuthor {
  '@type': 'Person'
  name: string
}

export interface ArticleSchema {
  '@context': 'https://schema.org'
  '@type': 'Article'
  headline: string
  url: string
  publisher: { '@id': string }
  description?: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: ArticleAuthor
}

/** The union every JSON-LD node builder here can produce; `JsonLd` renders any of them. */
export type JsonLdSchema =
  | OrganizationSchema
  | WebSiteSchema
  | BreadcrumbListSchema
  | CollectionPageSchema
  | ArticleSchema

/**
 * The Organization node, stated in one language.
 *
 * `locale` is not optional-for-convenience: `description`, `knowsAbout` and
 * `areaServed` are the three properties an answer engine quotes back, and
 * emitting the English ones on `/id` told every engine the studio describes
 * itself in English only. The `@id` is deliberately *not* per-locale — it is
 * the same organization in both languages, and splitting it would create two
 * entities out of one.
 */
export function organizationSchema(locale?: Locale): OrganizationSchema {
  const facts = siteFacts(locale)

  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: facts.name,
    url: facts.url,
    logo: facts.logo,
    description: facts.description,
  }

  if (facts.alternateNames.length) schema.alternateName = facts.alternateNames
  if (facts.knowsAbout.length) schema.knowsAbout = facts.knowsAbout
  if (facts.areaServed) schema.areaServed = facts.areaServed
  if (facts.foundingDate) schema.foundingDate = facts.foundingDate
  if (facts.email) schema.email = facts.email
  if (facts.sameAs.length) schema.sameAs = facts.sameAs
  if (facts.addressCountry) {
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry: facts.addressCountry,
    }
  }

  return schema
}

export function websiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: SITE.url,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

export function breadcrumbSchema(
  items: readonly { name: string; url: string }[]
): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * A listing page — index, archive, category — as `CollectionPage` wrapping an
 * `ItemList` of what it links to.
 *
 * Without this a listing is just a page of links: a crawler has to follow
 * every one to learn what the collection contains, and an answer engine
 * asking "what has this studio worked on?" has nothing to read in one fetch.
 * The `ItemList` states the membership and the order directly.
 *
 * `url` and every item `url` must be absolute — relative paths are dropped by
 * most consumers, and a half-relative `ItemList` validates clean while
 * pointing nowhere.
 */
export function collectionPageSchema(input: {
  name: string
  url: string
  description?: string
  items: readonly { name: string; url: string }[]
}): CollectionPageSchema {
  const schema: CollectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: input.url,
    isPartOf: { '@id': WEBSITE_ID },
  }

  if (input.description) schema.description = input.description

  // An empty list is worse than no list: it asserts the collection is
  // empty rather than leaving the question open.
  if (input.items.length) {
    schema.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url,
      })),
    }
  }

  return schema
}

export interface ArticleSchemaInput {
  headline: string
  description?: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  authorName?: string
}

export function articleSchema(input: ArticleSchemaInput): ArticleSchema {
  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    url: input.url,
    publisher: { '@id': ORGANIZATION_ID },
  }

  if (input.description) schema.description = input.description
  if (input.image) schema.image = input.image
  if (input.datePublished) schema.datePublished = input.datePublished
  if (input.dateModified) schema.dateModified = input.dateModified
  if (input.authorName) {
    schema.author = { '@type': 'Person', name: input.authorName }
  }

  return schema
}
