import {
  buildAgentGuidanceMarkdown,
  buildCmsRoutesMarkdown,
  buildDeveloperResourcesMarkdown,
  buildStaticRoutesMarkdown,
} from '@/lib/seo/agent-content'
import { mergeVary } from '@/lib/seo/content-negotiation'
import { getAdvertisedRoutes } from '@/lib/seo/routes'
import { formatList, type ResolvedSiteFacts, siteFacts } from '@/lib/seo/site'

/**
 * `/llms.txt` — the emerging convention for giving LLMs a plain-text site
 * summary they can fetch without executing JS or parsing HTML.
 *
 * This is the cheapest possible AEO (answer-engine optimization) win: one
 * static endpoint that states the entity in the format crawlers already
 * expect. The entity section is generated from `lib/seo/site.ts` rather
 * than hand-written so it can never drift from the JSON-LD graph or
 * on-page copy; the content list is generated from the same
 * `getCmsRoutes()` that feeds `app/sitemap.ts`, so both surfaces describe
 * the same set of pages.
 *
 * No `export const dynamic = 'force-static'` here — this project runs
 * Next's Cache Components (`cacheComponents: true`), which forbids the
 * classic route segment config. `'use cache'` on the body builder is the
 * Cache Components equivalent. It has to wrap the plain-string builder
 * rather than the handler itself: a `'use cache'` boundary serializes its
 * return value, and a `Response` instance is not a plain object.
 */

function buildAbout(facts: ResolvedSiteFacts): string {
  const clauses: string[] = []

  if (facts.foundingDate) clauses.push(`Founded in ${facts.foundingDate}.`)
  if (facts.locationName) clauses.push(`Based in ${facts.locationName}.`)
  if (facts.services.length)
    clauses.push(`Services: ${formatList(facts.services)}.`)
  if (facts.knowsAbout.length)
    clauses.push(`Areas of expertise: ${formatList(facts.knowsAbout)}.`)

  // Fresh clone: no optional SITE fields are set yet. Say so plainly instead
  // of emitting an empty section or a sentence with a hole in it.
  if (clauses.length === 0) {
    return `No additional facts configured yet — populate lib/seo/site.ts.`
  }

  return clauses.join(' ')
}

async function buildBody(): Promise<string> {
  'use cache'
  /*
   * Written in the default locale, and that is a decision rather than an
   * oversight.
   *
   * `/llms.txt` is an unlocalized path by convention — the convention is the
   * whole point, since a crawler looks for exactly this address — so there is
   * no locale to read. What it must not do is *hide* the other language:
   * `buildStaticRoutesMarkdown()` is called with no locale below, so the Key
   * pages list carries `/en/…` and `/id/…` side by side and a crawler that
   * only ever fetches this file still learns the site is bilingual.
   */
  const facts = siteFacts()
  // Expanded per locale, like the sitemap's. This file used to list the bare
  // template (`https://…/work/rimbun`), which is a URL that only 307s — on
  // the one surface whose entire purpose is handing a crawler the address to
  // record.
  const cmsRoutes = await getAdvertisedRoutes()

  return `# ${facts.name}

> ${facts.description}

## About

${buildAbout(facts)}

## Key pages

${buildStaticRoutesMarkdown()}${buildCmsRoutesMarkdown(cmsRoutes)}${buildAgentGuidanceMarkdown()}${buildDeveloperResourcesMarkdown()}
`
}

export async function GET() {
  const body = await buildBody()
  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      vary: mergeVary(null, 'Accept'),
    },
  })
}
