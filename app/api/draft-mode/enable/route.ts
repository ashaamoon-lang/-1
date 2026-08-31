import { defineEnableDraftMode } from 'next-sanity/draft-mode'
import { type NextRequest, NextResponse } from 'next/server'

import { isConfigured } from '@/integrations/registry'
import { client } from '@/integrations/sanity/client'
import { privateToken } from '@/integrations/sanity/env'
import { getClientIP, rateLimit, rateLimiters } from '@/lib/utils/rate-limit'

// Draft mode genuinely requires the private token — client.fetch has no
// perspective:'drafts' access without one. Fail with a clear error instead
// of letting `defineEnableDraftMode` hit a confusing downstream 401/403.
const draftModeHandler =
  isConfigured('sanity') && client && privateToken !== ''
    ? defineEnableDraftMode({
        client: client.withConfig({ token: privateToken }),
      })
    : {
        GET: () =>
          NextResponse.json(
            {
              error:
                isConfigured('sanity') && client
                  ? 'Draft mode requires SANITY_PRIVATE_TOKEN (or SANITY_API_WRITE_TOKEN) to be set'
                  : 'Sanity is not configured',
            },
            { status: 503 }
          ),
      }

const { GET: enableDraftMode } = draftModeHandler

/**
 * Rate-limited, like every other route handler in this app except this one.
 *
 * `defineEnableDraftMode` validates a secret from the query string and returns
 * 401 on a bad one — correct, but unbounded: nothing stopped an attacker
 * trying secrets as fast as the network allowed. `/api/revalidate` has carried
 * `rateLimiters.standard` all along, and `/api/draft-mode/disable` needs none
 * (it only clears a cookie). This one guards a credential and had nothing
 * (`docs/AUDIT-2026-08.md` §Tier 4).
 *
 * Keyed by IP and prefixed so it shares no budget with the revalidate webhook.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const ip = getClientIP(request)
  const limit = rateLimit(`draft-mode:${ip}`, rateLimiters.standard)

  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.resetIn) } }
    )
  }

  return enableDraftMode(request)
}
