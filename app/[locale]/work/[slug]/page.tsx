import { getTranslations } from 'next-intl/server'
import type { PortableTextBlock } from 'next-sanity'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { nextProject } from '@/lib/content/next-project'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { RichText } from '@/lib/integrations/sanity/components/rich-text'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { projectQuery, projectsQuery } from '@/lib/integrations/sanity/queries'
import { generateSanityMetadata } from '@/lib/utils/metadata'
import { NextProject } from '@/vault/blocks/next-project'
import { ProjectGallery } from '@/vault/blocks/project-gallery'
import { ProjectHero } from '@/vault/blocks/project-hero'

import s from './page.module.css'

/*
 * `'use cache'` is required, not stylistic: `sanityFetch` calls `cacheTag()`
 * internally, and under Cache Components that is only legal inside a cached
 * function — draft mode included. Slug and locale are arguments so both are
 * part of the cache key.
 */
async function fetchProject(
  slug: string,
  locale: string,
  perspective: 'published' | 'drafts',
  stega: boolean
) {
  'use cache'
  const [project, siblings] = await Promise.all([
    sanityFetch({
      query: projectQuery,
      params: { slug, locale },
      perspective,
      stega,
    }),
    // The full ordered list, for "next project". Fetched here rather than in a
    // second cached function so both share one cache entry and one
    // revalidation — they always change together.
    sanityFetch({
      query: projectsQuery,
      params: { locale },
      perspective,
      stega,
    }),
  ])
  return { project: project.data, siblings: siblings.data }
}

async function fetchProjectForRequest(slug: string, locale: string) {
  const { isEnabled: isDraftMode } = await draftMode()
  return isDraftMode
    ? fetchProject(slug, locale, 'drafts', true)
    : fetchProject(slug, locale, 'published', false)
}

/**
 * One commissioned work, at `/[locale]/work/[slug]`.
 *
 * ## Why `/work/` and not the `[...slug]` catch-all
 *
 * Sanity enforces slug uniqueness per type, not across types, so a work and a
 * page may both be called "About". Sharing the catch-all would let one
 * silently win. A namespace of its own makes that impossible rather than
 * unlikely — and `urlForReference` maps `project` documents here, so CMS links
 * resolve to the same URL the router serves.
 *
 * ## Static params
 *
 * `projectSlugsQuery` is deliberately not locale-parameterised: a slug is
 * shared across languages, so one list drives both locales' routes. With an
 * empty dataset the list is empty and Next still builds the route — which is
 * the state of a fresh clone, and must not be a build error.
 */
interface ProjectPageProps {
  params: Promise<{ slug: string }>
}

/*
 * There is deliberately no `generateStaticParams` here.
 *
 * The roadmap asked for one, and it cannot exist under Cache Components while
 * the dataset can be empty. Next rejects the build outright:
 *
 *   When using Cache Components, all `generateStaticParams` functions must
 *   return at least one result. This is to ensure that we can perform
 *   build-time validation that there is no other dynamic accesses that would
 *   cause a runtime error.
 *
 * With zero published projects the list is empty, so the only ways to satisfy
 * it are to prerender a fabricated slug that 404s, or to require the CMS to
 * hold content before the repo can build. Both are worse than the alternative.
 *
 * So this route is Partial Prerender (`◐`), exactly like the sibling CMS
 * routes `[...slug]` and `articles/[slug]`, neither of which declares static
 * params either. The shell is prerendered, the project renders on first
 * request, and `'use cache'` plus SanityLive tag revalidation caches it from
 * there. `projectSlugsQuery` stays in `queries.ts` — `app/sitemap.ts` still
 * enumerates every project, which is what the exit criterion actually needs.
 */

/**
 * Last-resort title when the CMS has none in either language.
 *
 * `project.title ?? slug` used to be the fallback, and it rendered
 * `panas-sore` as an `<h1>`. The GROQ `coalesce` only falls back *to* English,
 * so a work published in Indonesian first had no English title at all — and
 * the studio writes in Indonesian, so that is the likely order
 * (`docs/AUDIT-2026-08.md` §2.5). `requireEveryLocale` in the schema now stops
 * that at Publish; this covers documents written before it existed.
 *
 * `??` also missed the empty-string case, which is what an editor who clears
 * a field leaves behind — hence `||`.
 *
 * A title in the wrong language would be better still, but the query has
 * already collapsed the field to one string by the time it arrives here.
 * Turning a URL segment back into words is the honest floor.
 */
function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  if (!isConfigured('sanity')) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const [{ project, siblings }, t] = await Promise.all([
    fetchProjectForRequest(slug, locale),
    getTranslations('project'),
  ])

  if (!project) notFound()

  const next = nextProject(siblings, slug)

  // SAFETY: the query projects the localized `body` as Portable Text.
  // TypeGen derives its own structurally identical block/span/markDefs type,
  // which TS cannot unify with next-sanity's PortableTextBlock.
  const body = project.body as PortableTextBlock[] | null

  return (
    <Wrapper theme="dark" lenis={{ anchors: true }}>
      <article className={s.article}>
        <ProjectHero
          title={project.title || humanizeSlug(slug)}
          cover={project.cover}
          coverAlt={project.coverAlt ?? ''}
          meta={[
            { label: t('client'), value: project.client },
            { label: t('year'), value: project.year },
            { label: t('medium'), value: project.medium },
            { label: t('dimensions'), value: project.dimensions },
          ]}
        />

        {body && (
          <div className={s.body}>
            <RichText content={body} />
          </div>
        )}

        {project.gallery && project.gallery.length > 0 && (
          <ProjectGallery
            className={s.gallery}
            images={project.gallery.map((image) => ({
              ...image,
              alt: image.alt,
            }))}
          />
        )}

        {next?.slug?.current && (
          <NextProject
            className={s.next}
            eyebrow={t('nextProject')}
            title={next.title ?? next.slug.current}
            slug={next.slug.current}
            cover={next.cover}
          />
        )}
      </article>
    </Wrapper>
  )
}

/** Social-card width. 1200 is what every platform samples at. */
const OG_WIDTH = 1200

/**
 * Turns the project's cover asset into a social card.
 *
 * Width only, no crop. A 1.91:1 crop is the convention, and it is the wrong
 * convention for a painting: platforms letterbox an off-ratio image, which
 * shows the whole work, while a crop silently removes part of the
 * composition. The height is computed from the asset's real dimensions so
 * `og:image:height` is not a lie.
 */
function ogImageFor(
  asset: {
    url: string | null
    width: number | null
    height: number | null
  } | null
) {
  if (!asset?.url || !asset.width || !asset.height) return null

  return {
    url: `${asset.url}?w=${OG_WIDTH}&auto=format`,
    width: OG_WIDTH,
    height: Math.round((OG_WIDTH * asset.height) / asset.width),
  }
}

/**
 * The title a soft 404 carries.
 *
 * Every unknown URL rendered `<title>Arth</title>` — a failure page
 * indistinguishable from the home page in a tab strip, in history, and in a
 * bookmark. The guard was `toHaveTitle(/.+/)`, a regex that matches any
 * non-empty string and so could never fail (`docs/AUDIT-2026-08.md` §Tier 3).
 *
 * It matters more here than on a site that can return a real status: Cache
 * Components force this to answer 200 (documented in `e2e/not-found.e2e.ts`),
 * so the title is one of the few honest signals left. `not-found.tsx` itself
 * cannot export metadata, so it has to come from the route that called
 * `notFound()`.
 */
async function notFoundMetadata() {
  const t = await getTranslations('notFound')
  return { title: t('title') }
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params

  if (!isConfigured('sanity')) return

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const { project } = await fetchProjectForRequest(slug, locale)
  if (!project) return notFoundMetadata()

  const path = localizedPath(locale, `/work/${slug}`)

  /*
   * `path` is localized, and that is the whole contract: `generateSanityMetadata`
   * derives the canonical, `og:url` and `og:locale` from this one string, so
   * they cannot disagree with each other. It is also the exact URL
   * `app/sitemap.ts` submits for this page — a canonical that disagrees with
   * the sitemap asks a crawler to fetch one URL and index another.
   *
   * This used to pass the locale-free `/work/${slug}` and then override
   * `alternates` afterwards. That fixed the canonical and hid the fact that
   * `og:url` and `og:locale`, derived from the same argument, were still wrong.
   */
  return generateSanityMetadata({
    document: project,
    url: path,
    image: ogImageFor(project.ogImage),
    type: 'article',
  })
}
