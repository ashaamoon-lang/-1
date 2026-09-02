import { getTranslations } from 'next-intl/server'
import { locale as localeRootParam } from 'next/root-params'

import type { SectionLink } from '@/components/layout/header'
import { Wrapper } from '@/components/layout/wrapper'
import { SectionHeader } from '@/components/ui/section-header'
import { resolveHomeContent } from '@/lib/content/home-fallback'
import { PRACTICES } from '@/lib/content/practices'
import { isLocale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { RichText } from '@/lib/integrations/sanity/components/rich-text'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import {
  featuredProjectsQuery,
  studioSettingsQuery,
} from '@/lib/integrations/sanity/queries'
import { ContactBlock } from '@/vault/blocks/contact-block'
import { Hero } from '@/vault/blocks/hero'
import { ProjectGrid } from '@/vault/blocks/project-grid'
import { StudioNote } from '@/vault/blocks/studio-note'

import s from './page.module.css'

/*
 * Same `'use cache'` + draftMode shape as `app/[locale]/[...slug]/page.tsx`.
 *
 * The fetch calls `cacheTag()` internally, which under Cache Components is
 * only legal inside a `'use cache'` function. Locale is an argument rather
 * than read inside, so it is part of the cache key: `/en` and `/id` must not
 * share one cached result.
 */
async function fetchHome(
  locale: string,
  perspective: 'published' | 'drafts',
  stega: boolean
) {
  'use cache'
  const [settings, projects] = await Promise.all([
    sanityFetch({
      query: studioSettingsQuery,
      params: { locale },
      perspective,
      stega,
    }),
    sanityFetch({
      query: featuredProjectsQuery,
      params: { locale },
      perspective,
      stega,
    }),
  ])
  return { settings: settings.data, projects: projects.data }
}

/**
 * Published content only, and deliberately no `draftMode()` on this path.
 *
 * Reading draft mode is a request-time access, which pushes the whole page
 * into a dynamic hole under Cache Components. The reader then gets the
 * `loading.tsx` fallback, and the real content arrives in a streamed chunk
 * that only JavaScript can swap in — so with JS disabled the home page is
 * "Skip to main content / Loading" and nothing else. Measured: `<h1>` present
 * in the DOM but hidden, 28 characters of visible text.
 *
 * That was true before this stage too. Tahap 3's no-JS exit criterion passed
 * only because the dataset was empty; the same code against a seeded dataset
 * shows the identical shell. The bug was invisible for exactly as long as
 * there was nothing to render.
 *
 * The trade this makes: the Presentation tool no longer previews *drafts* of
 * the home page — it still previews published changes live through
 * `SanityLive` tag revalidation. Project and article pages keep their draft
 * path, because they are dynamic (`◐`) by nature and lose nothing. The home
 * page is the one route where being readable without JavaScript matters more
 * than previewing an unpublished headline.
 */
async function fetchHomeForRequest(locale: string) {
  // A project without Sanity configured still renders a complete page: every
  // section falls back to `lib/content/home-fallback.ts`, and the work grid is
  // simply absent. This is the same path an empty dataset takes.
  if (!isConfigured('sanity')) return { settings: null, projects: [] }

  return fetchHome(locale, 'published', false)
}

/**
 * The home page — one long page, per `docs/ROADMAP.md` §1.2.
 *
 * ## Which sections exist is decided here, not in the header
 *
 * The roadmap lists five sections and also states that an empty section is
 * more damaging than a missing one. Both hold at once: Work renders only when
 * there is work, and Process is not built at all because no real content for
 * it exists yet (see `docs/stages/TAHAP-3.md` §1).
 *
 * The nav anchors are therefore derived from what actually rendered and passed
 * up to the header, rather than hardcoded there. An anchor pointing at a
 * section that does not exist is a link that silently does nothing — and with
 * an empty dataset that is exactly what `#work` would be.
 *
 * ## Content precedence
 *
 * The CMS wins field by field; `resolveHomeContent` documents why per-field
 * and not per-document. With the dataset empty today, every string here comes
 * from the fallback — which is placeholder copy, and says so on the page.
 */
export default async function Home() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const [{ settings, projects }, t, tWork] = await Promise.all([
    fetchHomeForRequest(locale),
    getTranslations('home'),
    // The practice labels are already localized for the catalogue's filter
    // chips. Reading them from there rather than adding a second set keeps
    // the hero and `/work/practice/<value>` naming the same three things.
    getTranslations('workIndex'),
  ])

  const content = resolveHomeContent(locale, settings)
  const hasWork = projects.length > 0

  // Document order, and only what rendered. `useActiveSection` relies on this
  // order to decide which of several visible sections is the one being read.
  const sections: SectionLink[] = [
    ...(hasWork ? [{ id: 'work', labelKey: 'work' as const }] : []),
    { id: 'studio', labelKey: 'studio' as const },
    { id: 'contact', labelKey: 'contact' as const },
  ]

  return (
    /*
     * `webgl` and `gsap` are mounted here, not in the layout.
     *
     * This is the only page with a scene (the hero's `SceneShell`) and the
     * only one running a GSAP timeline (`TextReveal`). Mounting them in the
     * shared layout made every other route download three.js, R3F and GSAP —
     * measured at 859KB uncompressed of three alone on `/en/ai`.
     *
     * Exactly one root canvas may exist: `lib/features` no longer mounts one,
     * so this is it. Two would race to claim primary (`lib/webgl/store.ts`).
     */
    <Wrapper
      theme="dark"
      /*
       * `anchors` hands same-page hash clicks to Lenis, so a jump to `#work`
       * is eased rather than teleported — the whole reason a single-page site
       * carries a smooth-scroll library at all. Lenis reads
       * `scroll-padding-top` (set globally from `--header-height`), so the
       * target still clears the fixed header.
       *
       * With JavaScript off, Lenis never mounts and the browser's own anchor
       * handling takes over. Same destination, no easing.
       */
      lenis={{ anchors: true }}
      sections={sections}
      webgl
      gsap
    >
      <Hero
        headline={content.headline}
        subline={content.subline}
        /*
         * The counterweight in the columns the headline leaves empty, and the
         * cue that the page continues. `docs/stages/TAHAP-12.md` §3.1 measured
         * what their absence cost: 456px of ink in a 900px screen, three
         * elements of descending width down the left edge, and nothing at all
         * saying a 5749px document followed.
         *
         * The practices are the honest content for it — they are what the
         * studio does, they are already a route (`/work/practice/<value>`),
         * and they come from one vocabulary (`lib/content/practices.ts`).
         */
        index={{
          label: t('heroIndexLabel'),
          items: PRACTICES.map((practice) => tWork(practice)),
        }}
        cue={t('scrollCue')}
        action={
          /* oxlint-disable-next-line react/forbid-elements -- deliberate native
             anchor, same reasoning as the header nav: a same-page hash must
             scroll with the browser's own handling so it still works with
             JavaScript disabled, which is a stated Tahap 3 exit criterion. */
          <a
            href={hasWork ? '#work' : '#contact'}
            className={s.heroCta}
            // Both attributes on one element: this control is its own
            // acknowledgment (the fill inverts on hover), so INTENT and
            // COMMIT live in the same place. `MOTION-SPEC.md` §9.
            data-press="cta"
            data-intent=""
          >
            {hasWork ? t('heroCta') : t('heroCtaContact')}
          </a>
        }
      />

      <div className={s.sections}>
        {hasWork && (
          <section id="work" className={s.section}>
            <SectionHeader
              eyebrow={t('workEyebrow')}
              title={t('workTitle')}
              aside={t('workCount', { count: projects.length })}
            />
            <ProjectGrid projects={projects} />
          </section>
        )}

        <StudioNote
          id="studio"
          className={s.section}
          eyebrow={t('studioEyebrow')}
          title={t('studioTitle')}
          portrait={settings?.portrait ?? null}
          {...(settings?.portraitAlt && { portraitAlt: settings.portraitAlt })}
        >
          {content.statement ? (
            // SAFETY: `statement` is the CMS's Portable Text for this locale.
            // `resolveHomeContent` widens it to `unknown[]` because it also
            // accepts the fallback shape; the query types it as `RichText`,
            // and `RichText` renders nothing for a block it does not know.
            <RichText content={content.statement as never} />
          ) : (
            content.statementFallback.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="p-big">
                {paragraph}
              </p>
            ))
          )}

          {content.isPlaceholder && (
            <p className={`caption ${s.placeholder}`}>{t('placeholderNote')}</p>
          )}
        </StudioNote>

        <ContactBlock
          id="contact"
          className={s.section}
          eyebrow={t('contactEyebrow')}
          title={t('contactTitle')}
          email={content.email}
          emailLabel={t('emailLabel', { name: content.name })}
          socials={content.socials}
          socialsHeading={t('socialsHeading')}
        />
      </div>
    </Wrapper>
  )
}
