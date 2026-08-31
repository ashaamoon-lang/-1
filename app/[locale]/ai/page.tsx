import { getTranslations } from 'next-intl/server'
import { locale as localeRootParam } from 'next/root-params'

import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, LOCALE_TAGS, routing } from '@/lib/i18n/routing'
import {
  getCmsRoutes,
  localizedContentRoutes,
  STATIC_ROUTES,
} from '@/lib/seo/routes'
import { formatList, SITE, siteFacts } from '@/lib/seo/site'
import { generatePageMetadata } from '@/lib/utils/metadata'

/**
 * `/ai` — a plain-HTML index of the site for LLM agents and crawlers.
 *
 * Visual-first sites (WebGL canvases, animated layouts, client-rendered
 * copy) give answer engines almost nothing to cite, and JS-heavy pages give
 * non-executing crawlers even less. One plain-HTML route that names the
 * entity and links every page is the highest-leverage AEO surface a site
 * can ship — cheaper than structured data, cheaper than a CMS migration.
 *
 * It is intentionally ugly: this is a data surface, not a designed page.
 * Real semantic elements only (`h1`/`h2`/`dl`/`ul`/`a[href]`) so it reads
 * the same whether it's parsed by a browser, a crawler, or an LLM's HTML
 * parser tool.
 *
 * Reads the same `lib/seo/route-catalog` STATIC_ROUTES catalog that
 * `app/sitemap.ts` and `/llms.txt` do — the single source those surfaces
 * share, so none of them can drift from the others.
 *
 * `Link` (`@/components/ui/link`) is a `'use client'` component (it reads
 * `usePathname` for active-link state and `useSyncExternalStore` for
 * prefetch hints). This route intentionally carries zero client
 * components, so internal/external links below are bare `<a href>`
 * elements rather than `Link` — the rendered markup is identical either
 * way, but this keeps the whole route server-only end to end.
 */

/**
 * A function, not `export const metadata`.
 *
 * The static object could not read the locale, so it declared
 * `canonical: /ai` on both `/en/ai` and `/id/ai` — a URL this app does not
 * serve and `app/sitemap.ts` never submits, which is worse than declaring
 * none. Its `og:url` was inherited from the layout, so the machine view also
 * told crawlers it *was* the home page.
 *
 * Nothing caught it: the canonical looked plausible, and no gate compared
 * the sitemap against the pages it lists. `lib/utils/metadata.test.ts` now
 * covers the helper; this route is the reason the sweep exists at all.
 */
export async function generateMetadata() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return generatePageMetadata({
    title: 'Machine view',
    description: `Plain-text index of ${SITE.name} for AI agents and crawlers.`,
    url: localizedPath(locale, '/ai'),
  })
}

export default async function AiPage() {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  /*
   * Section headings come from the message catalogue.
   *
   * They were English literals, so `/id/ai` served 37 of 37 visible strings
   * in English under `lang="id-ID"` — and that page is in the sitemap, so an
   * answer engine indexed two identical documents as two languages. axe
   * passes either way: `html-has-lang` checks the attribute exists, not that
   * the content matches it (`docs/AUDIT-2026-08.md` §2.4).
   *
   * What stays untranslated is deliberate: the studio's name, its email and
   * its URLs — proper nouns. Everything else now moves, including the entity
   * prose: `lib/seo/site.ts` used to hold one English string per fact, so
   * this page's own description, service list and agent instructions stayed
   * English under `lang="id-ID"` even after the headings were translated.
   * `e2e/promises.e2e.ts` §locale parity measures it.
   */
  const t = await getTranslations('machineView')
  const facts = siteFacts(locale)

  // This page is itself locale-scoped, so its links carry its own locale.
  // They used to be the bare templates, which 307 to whichever locale the
  // fetching agent's `Accept-Language` happens to imply — not necessarily
  // the language of the page the link was found on.
  const cmsRoutes = localizedContentRoutes(await getCmsRoutes(), locale)

  return (
    <>
      <h1>{facts.name}</h1>
      <p>{facts.description}</p>

      <h2>{t('facts')}</h2>
      <dl>
        {facts.foundingDate && (
          <>
            <dt>{t('founded')}</dt>
            <dd>{facts.foundingDate}</dd>
          </>
        )}
        {facts.locationName && (
          <>
            <dt>{t('location')}</dt>
            <dd>{facts.locationName}</dd>
          </>
        )}
        {facts.areaServed && (
          <>
            <dt>{t('areaServed')}</dt>
            <dd>{facts.areaServed}</dd>
          </>
        )}
        {facts.email && (
          <>
            <dt>{t('email')}</dt>
            <dd>{facts.email}</dd>
          </>
        )}
        {facts.services.length > 0 && (
          <>
            <dt>{t('services')}</dt>
            <dd>{formatList(facts.services)}</dd>
          </>
        )}
        {facts.knowsAbout.length > 0 && (
          <>
            <dt>{t('expertise')}</dt>
            <dd>{formatList(facts.knowsAbout)}</dd>
          </>
        )}
      </dl>

      <h2>{t('pages')}</h2>
      <ul>
        {/*
          Both languages are listed, not just this page's own. The machine
          view exists to hand a crawler every address the site has, and
          `hrefLang` says which language each one is in — so an agent that
          fetched `/id/ai` can still find and correctly label the English
          catalogue. (The CMS links below *are* scoped to this locale: those
          are per-document, and listing both would double every project.)
        */}
        {STATIC_ROUTES.map((page) => (
          <li key={page.path}>
            {/* oxlint-disable-next-line react/forbid-elements -- this route is intentionally client-component-free; the Link component is 'use client', so a bare anchor keeps the whole page server-only (see file header) */}
            <a href={page.path} hrefLang={LOCALE_TAGS[page.locale]}>
              {page.label}
            </a>
            : {page.description}
          </li>
        ))}
        {cmsRoutes.map((page) => (
          <li key={page.path}>
            {/* oxlint-disable-next-line react/forbid-elements -- this route is intentionally client-component-free; the Link component is 'use client', so a bare anchor keeps the whole page server-only (see file header) */}
            <a href={page.path}>{page.label}</a>
          </li>
        ))}
      </ul>

      {facts.agentGuidance?.whenToUse.length ? (
        <>
          <h2>{t('whenToUse')}</h2>
          <ul>
            {facts.agentGuidance.whenToUse.map((useCase) => (
              <li key={useCase.name}>
                <strong>{useCase.name}:</strong> {useCase.description}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {facts.agentGuidance?.howToUse.length ? (
        <>
          <h2>{t('howToUse')}</h2>
          <ol>
            {facts.agentGuidance.howToUse.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ol>
        </>
      ) : null}

      {facts.developerResources?.length ? (
        <>
          <h2>{t('developerResources')}</h2>
          <ul>
            {facts.developerResources.map((resource) => (
              <li key={resource.url}>
                {/* oxlint-disable-next-line react/forbid-elements -- external link, and this route is intentionally client-component-free (see file header) */}
                <a href={resource.url}>{resource.name}</a>:{' '}
                {resource.description}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {SITE.sameAs.length > 0 && (
        <>
          <h2>{t('elsewhere')}</h2>
          <ul>
            {SITE.sameAs.map((url) => (
              <li key={url}>
                {/* oxlint-disable-next-line react/forbid-elements -- external link, and this route is intentionally client-component-free (see file header) */}
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>{t('forAgents')}</h2>
      <ul>
        <li>
          {/* oxlint-disable-next-line react/forbid-elements, nextjs/no-html-link-for-pages -- non-page static route; this route is intentionally client-component-free (see file header) */}
          <a href="/llms.txt">/llms.txt</a>
        </li>
        <li>
          {/* oxlint-disable-next-line react/forbid-elements, nextjs/no-html-link-for-pages -- non-page static route; this route is intentionally client-component-free (see file header) */}
          <a href="/sitemap.xml">/sitemap.xml</a>
        </li>
        <li>
          {/* oxlint-disable-next-line react/forbid-elements, nextjs/no-html-link-for-pages -- non-page static route; this route is intentionally client-component-free (see file header) */}
          <a href="/robots.txt">/robots.txt</a>
        </li>
      </ul>
    </>
  )
}
