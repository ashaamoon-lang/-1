/**
 * Next.js Request Proxy
 *
 * Handles cross-cutting concerns for incoming requests, before route matching.
 *
 * Customize:
 * - Rate limiting: Adjust rateLimiters config per route pattern
 * - Auth: Add token/session validation before route matching
 * - Logging: Add request logging for observability
 * - CORS: Add custom CORS headers for API routes
 *
 * Note: Security headers are configured in next.config.ts (static, no need for proxy)
 */

import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { guessedDestination } from '@/lib/i18n/guessed-paths'
import { routing } from '@/lib/i18n/routing'
import {
  type DocumentMediaType,
  HTML_FORMAT_OVERRIDE_PARAM,
  HTML_FORMAT_OVERRIDE_VALUE,
  HTML_MEDIA_TYPE,
  MARKDOWN_MEDIA_TYPE,
  mergeVary,
  negotiateDocumentType,
} from '@/lib/seo/content-negotiation'
import {
  MARKDOWN_HANDLER_PATH,
  MARKDOWN_SOURCE_PATH_HEADER,
  routePathFromMarkdown,
} from '@/lib/seo/markdown-path'
import { getClientIP, rateLimit, rateLimiters } from '@/lib/utils/rate-limit'

/**
 * Paths this proxy must exclude from page-document negotiation for a reason
 * neither the `matcher` below nor `FILE_EXTENSION` already covers.
 * `/robots.txt` and `/sitemap.xml` never reach `proxy()` at all — the
 * `matcher` excludes them. `/llms.txt` and `/manifest.webmanifest` reach
 * `proxy()` but are already caught by `FILE_EXTENSION` (dotted last
 * segment). Only `/agent-content` has neither property: the matcher doesn't
 * exclude it and it has no file extension, so without this entry a request
 * to it would be treated as a page document and become eligible for its own
 * rewrite target. Exported so `proxy.test.ts` can assert this stays the
 * only entry — see the parity test there and `vercel.json`'s route `src`,
 * which independently encodes the same exclusions.
 */
/**
 * next-intl's locale router, built once at module scope — it is derived purely
 * from static config, so rebuilding it per request would be waste.
 *
 * `routing.localePrefix` is 'always', which makes this emit plain redirects
 * (`/` -> `/en`) rather than internal rewrites. That is what lets it coexist
 * with the Markdown rewrite below: only one of the two ever rewrites a given
 * request.
 */
const handleI18nRouting = createMiddleware(routing)

/**
 * Route prefixes that must never receive a locale prefix.
 *
 * Sanity Studio is the whole list today, and it is not optional: without this,
 * next-intl redirects `/studio` to `/en/studio`, which does not exist —
 * Studio lives under `app/(chrome)/`, deliberately outside the localized tree.
 * That would take the CMS offline while every page still looked fine.
 *
 * Everything else that must stay unlocalized is already excluded upstream:
 * `/api/*` and `/_next/*` by `isPageDocumentRequest`, `/agent-content` by
 * `MACHINE_PATHS`, dotted paths (`/llms.txt`, `/manifest.webmanifest`,
 * `/icon.png`) by `FILE_EXTENSION`, and `/robots.txt` + `/sitemap.xml` by the
 * `matcher` at the bottom of this file.
 */
export const NON_LOCALIZED_PREFIXES = ['/studio'] as const

/** Exported for `proxy.test.ts`; not used outside this module at runtime. */
export function isLocalizable(pathname: string): boolean {
  return !NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export const MACHINE_PATHS = new Set([MARKDOWN_HANDLER_PATH])

export const FILE_EXTENSION = /\/[^/]+\.[^/]+$/
// Proxy response headers are applied to the rendered response. Include the
// router cache keys that Next emits so adding Accept cannot replace them.
const NEXT_DOCUMENT_VARY =
  'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch'

function isRouterRequest(request: NextRequest): boolean {
  return (
    request.headers.has('rsc') ||
    request.headers.has('next-router-prefetch') ||
    request.headers.has('next-router-state-tree') ||
    request.headers.has('next-router-segment-prefetch') ||
    request.headers.get('sec-purpose')?.includes('prefetch') === true ||
    request.headers.get('purpose') === 'prefetch'
  )
}

function isPageDocumentRequest(
  request: NextRequest,
  isMarkdownPath: boolean
): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (request.nextUrl.pathname.startsWith('/api/')) return false
  if (request.nextUrl.pathname.startsWith('/_next/')) return false
  if (MACHINE_PATHS.has(request.nextUrl.pathname)) return false
  if (isRouterRequest(request)) return false
  if (!isMarkdownPath && FILE_EXTENSION.test(request.nextUrl.pathname)) {
    return false
  }

  return true
}

/**
 * `markdownRoute` (an explicit `.md` alias) always wins negotiation by
 * design — see the e2e coverage for "explicit Markdown aliases without an
 * Accept header". `isHtmlFormatOverride` short-circuits it to HTML for the
 * loop-breaker case above. Otherwise, Accept drives the choice as usual.
 */
function resolveSelectedType(
  request: NextRequest,
  markdownRoute: string | null,
  isHtmlFormatOverride: boolean
): DocumentMediaType | null {
  if (isHtmlFormatOverride) return HTML_MEDIA_TYPE
  if (markdownRoute !== null) return MARKDOWN_MEDIA_TYPE
  return negotiateDocumentType(request.headers.get('accept'))
}

/**
 * `vercel.json`'s route transform unconditionally appends `Accept` to Vary
 * on every page-document response after this middleware has already run, so
 * a response that sets it here can carry `Accept` twice on the wire. That's
 * spec-legal (repeated Vary field values are equivalent to one) and
 * deliberate, not drift: this middleware sets Vary from the actual
 * negotiation outcome (so a rewrite or 406 always carries it correctly),
 * while `vercel.json`'s CDN-layer append is a blanket safety net that still
 * applies to responses served from cache before this middleware runs.
 */
function addAcceptVary(
  response: NextResponse,
  existingVary = response.headers.get('vary')
): NextResponse {
  response.headers.set('vary', mergeVary(existingVary, 'Accept'))
  return response
}

export function proxy(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = getClientIP(request)
    const result = rateLimit(`api:${ip}`, rateLimiters.relaxed)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.resetIn),
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  /*
   * A URL the reader guessed from a nav label, sent where it belongs.
   *
   * Placed here — before content negotiation and before next-intl — because
   * this is a decision about the *path*, and every step below reasons about a
   * path it assumes will resolve. Running it first also means the redirect is
   * a real 308: `proxy.ts` executes before rendering, so unlike the
   * not-found status (which Cache Components force to 200 — see
   * `e2e/not-found.e2e.ts`), a genuine status is available at this layer.
   *
   * The table and its reasoning live in `lib/i18n/guessed-paths.ts`.
   */
  const guessed = guessedDestination(request.nextUrl.pathname)
  if (guessed) {
    return NextResponse.redirect(new URL(guessed, request.url), 308)
  }

  if (request.nextUrl.pathname === MARKDOWN_HANDLER_PATH) {
    return new NextResponse('Not found.\n', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  const markdownRoute = routePathFromMarkdown(request.nextUrl.pathname)
  if (!isPageDocumentRequest(request, markdownRoute !== null)) {
    return NextResponse.next()
  }

  // The markdown handler redirects here with this param when a client's
  // Accept prefers Markdown for a page that turns out to only have an HTML
  // representation — see `lib/seo/markdown-document.ts`. Honoring it by
  // forcing HTML, instead of negotiating again, is what breaks the loop:
  // without it, a client that still sends the same Accept header would
  // negotiate back to Markdown and bounce off the same redirect forever.
  const isHtmlFormatOverride =
    markdownRoute === null &&
    request.nextUrl.searchParams.get(HTML_FORMAT_OVERRIDE_PARAM) ===
      HTML_FORMAT_OVERRIDE_VALUE

  const selectedType = resolveSelectedType(
    request,
    markdownRoute,
    isHtmlFormatOverride
  )

  if (selectedType === null) {
    return new NextResponse(
      'Not acceptable. Available representations: text/html, text/markdown.\n',
      {
        status: 406,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          vary: 'Accept',
        },
      }
    )
  }

  if (selectedType === MARKDOWN_MEDIA_TYPE) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = MARKDOWN_HANDLER_PATH
    rewriteUrl.search = ''
    // Carries the original query string (e.g. `?variant=x`) alongside the
    // path so the HTML-fallback 303 in markdown-document.ts can merge
    // `format=html` into it instead of discarding it — rewriteUrl.search was
    // cleared above because MARKDOWN_HANDLER_PATH itself takes no query.
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(
      MARKDOWN_SOURCE_PATH_HEADER,
      (markdownRoute ?? request.nextUrl.pathname) + request.nextUrl.search
    )

    return addAcceptVary(
      NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      })
    )
  }

  // Not localizable (Studio): pass through untouched, but still advertise the
  // negotiation Vary so a cached response cannot be reused across Accept.
  if (!isLocalizable(request.nextUrl.pathname)) {
    return addAcceptVary(NextResponse.next(), NEXT_DOCUMENT_VARY)
  }

  // HTML was selected, so this is a real page document — hand it to the locale
  // router. Ordering is deliberate: Markdown was resolved above, so a `.md`
  // alias is already rewritten and never reaches next-intl, which would
  // otherwise try to prefix it.
  const i18nResponse = handleI18nRouting(request)

  // A locale redirect (`/` -> `/en`, or an unprefixed path being prefixed) is
  // not a page document. Attaching content-negotiation Vary to it would tell
  // caches to key a 307 on Accept, splitting the cache for no benefit — the
  // negotiation happens again on the followed URL anyway.
  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse
  }

  return addAcceptVary(i18nResponse, NEXT_DOCUMENT_VARY)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
}
