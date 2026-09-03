import { getTranslations } from 'next-intl/server'
import type { PortableTextBlock } from 'next-sanity'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { Wrapper } from '@/components/layout/wrapper'
import { nextProject } from '@/lib/content/next-project'
import { PRACTICE_SEGMENT } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { RichText } from '@/lib/integrations/sanity/components/rich-text'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  projectQuery,
  projectSlugsQuery,
  projectsQuery,
} from '@/lib/integrations/sanity/queries'
import { transitionName } from '@/lib/motion/transition-name'
import { generateSanityMetadata } from '@/lib/utils/metadata'
import { NextProject } from '@/vault/blocks/next-project'
import { ProjectGallery } from '@/vault/blocks/project-gallery'
import { ProjectHero } from '@/vault/blocks/project-hero'

import s from './page.module.css'

/*
 * Published content only, and deliberately no `draftMode()`.
 *
 * `'use cache'` is required, not stylistic: `sanityFetch` calls `cacheTag()`
 * internally, and under Cache Components that is only legal inside a cached
 * function. Slug and locale are arguments so both are part of the cache key.
 *
 * ## Why draft mode is gone
 *
 * Reading `draftMode()` is a request-time access, which pushes the whole page
 * into a dynamic hole. Two things were measured as a result, and neither was
 * a theory:
 *
 *   - with JavaScript off the page rendered 28 characters — the real markup
 *     sat in a `<div hidden>` only an inline script reveals
 *     (`docs/stages/TAHAP-9.md` §1);
 *   - the response was `Cache-Control: no-store`, so every view of the most
 *     shareable page class on the site hit the origin and Sanity
 *     (`docs/AUDIT-2026-08.md` §Tier 1).
 *
 * `app/[locale]/page.tsx` justified keeping it by calling these routes
 * "dynamic (◐) by nature and lose nothing". That sentence was wrong, and it
 * is what this change corrects.
 *
 * ## What it costs, stated plainly
 *
 * The Presentation tool no longer previews *unpublished* edits to a project.
 * It still previews published ones live, through `SanityLive` tag
 * revalidation. Three things make that trade the right way round:
 * `docs/PANDUAN-STUDIO.md` teaches the studio to publish and look — it never
 * mentions preview at all; `docs/DEPLOYMENT.md` marks the token
 * "Recommended", not required; and the home page made this exact trade in
 * Tahap 3, so keeping project pages different would be two rules for one
 * question.
 */
async function fetchProject(slug: string, locale: string) {
  'use cache'
  const [project, siblings] = await Promise.all([
    sanityFetch({
      query: projectQuery,
      params: { slug, locale },
      perspective: 'published',
      stega: false,
    }),
    // The full ordered list, for "next project". Fetched here rather than in a
    // second cached function so both share one cache entry and one
    // revalidation — they always change together.
    sanityFetch({
      query: projectsQuery,
      params: { locale },
      perspective: 'published',
      stega: false,
    }),
  ])
  return { project: project.data, siblings: siblings.data }
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

/**
 * A slug that matches no document, used only when the CMS is empty.
 *
 * Cache Components rejects a build where `generateStaticParams` returns
 * nothing: "all `generateStaticParams` functions must return at least one
 * result". A fresh clone has zero published projects, so something has to be
 * returned.
 *
 * This renders a 404. It is in no sitemap, linked from nowhere, and
 * discoverable only by typing it — its entire job is to satisfy a build-time
 * validation.
 */
const EMPTY_DATASET_SENTINEL = '__no-projects__'

/**
 * Prerenders every published project.
 *
 * ## This reverses a decision, and the reason is measurement
 *
 * Tahap 4 concluded that `generateStaticParams` "cannot exist under Cache
 * Components while the dataset can be empty", weighed a fabricated sentinel
 * slug against staying dynamic, and called the sentinel "worse than the
 * alternative". That judgment was sound given what was known — and what was
 * known was wrong. The comment in `app/[locale]/page.tsx` asserted these
 * routes are "dynamic (◐) by nature and lose nothing".
 *
 * They lost two things, both measured since:
 *
 *   - **28 characters without JavaScript.** The page's markup shipped inside
 *     a `<div hidden>` that only an inline script reveals
 *     (`docs/stages/TAHAP-9.md` §1).
 *   - **`Cache-Control: no-store`.** Every view of the most shareable page
 *     class hit the origin and Sanity (`docs/AUDIT-2026-08.md` §Tier 1).
 *
 * Against that, one unlisted 404 route on an empty dataset is cheap.
 *
 * ## What still works when the CMS changes
 *
 * `dynamicParams` defaults to true, so a project published after the last
 * build still renders — on demand, then cached by `'use cache'` and
 * revalidated by the publish webhook. Prerendering is an optimisation here,
 * not a gate on content existing.
 *
 * Deliberately not locale-parameterised: a slug is shared across languages,
 * so one list drives both locales' routes.
 */
async function fetchProjectSlugs() {
  // `sanityFetch` calls `cacheTag()`, which is only legal inside a cached
  // function — `generateStaticParams` is not one, so the fetch is wrapped.
  'use cache'
  const { data } = await sanityFetch({
    query: projectSlugsQuery,
    params: {},
    perspective: 'published',
    stega: false,
  })
  return data
}

/**
 * This route blocks on its own params, and says so.
 *
 * Next 16 reports a route that reads `params` outside a `<Suspense>` as one
 * that "may prevent the navigation from being instant", and offers two ways
 * out: stream a placeholder, or declare the route blocking. Tahap 16c
 * measured the first one. Wrapping this page's body in `<Suspense>` took its
 * no-JavaScript render from **924 characters to 20 on the sibling practice route, measured there** — literally
 * "Skip to main content" — because everything here depends on `params` and so
 * there is no smaller unit to wrap; the shell that arrives instantly is an
 * empty page.
 *
 * That is the same regression `e2e/no-javascript.e2e.ts` was built to stop
 * after a single `loading.tsx` reduced the home page to 28 characters for a
 * crawler. Trading the site's readability without JavaScript for a shell with
 * nothing in it is not a trade worth making.
 *
 * So the honest declaration is this one. It changes no behaviour — the route
 * already blocked — it states the intent, and it silences a diagnostic that
 * would otherwise train everyone to ignore the console.
 * `docs/stages/TAHAP-16.md` §7 carries the measurement.
 */
export const instant = false

export async function generateStaticParams() {
  if (!isConfigured('sanity')) return [{ slug: EMPTY_DATASET_SENTINEL }]

  const data = await fetchProjectSlugs()
  const slugs = (data ?? []).filter(
    (slug): slug is string => Boolean(slug) && slug !== PRACTICE_SEGMENT
  )

  return slugs.length > 0
    ? slugs.map((slug) => ({ slug }))
    : [{ slug: EMPTY_DATASET_SENTINEL }]
}

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
  // Belt and braces for the reserved segment. The router never routes
  // `/work/practice` here — the static segment wins — but `dynamicParams`
  // means a document on this slug would otherwise be served at a URL that
  // contradicts the practice route one level down.
  if (slug === PRACTICE_SEGMENT) notFound()

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const [{ project, siblings }, t] = await Promise.all([
    fetchProject(slug, locale),
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
          // Pairs this cover with the catalogue card the reader came from, so
          // the browser morphs one into the other. Both ends derive the name
          // from `lib/motion/transition-name.ts` — a mismatch produces no
          // error, just a morph that silently stops happening.
          transitionName={transitionName(slug)}
          meta={[
            { label: t('client'), value: project.client },
            { label: t('year'), value: project.year },
            { label: t('engagement'), value: project.engagement },
            { label: t('scope'), value: project.scope },
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

  const { project } = await fetchProject(slug, locale)
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
