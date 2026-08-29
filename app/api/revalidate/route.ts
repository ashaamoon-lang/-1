import { parseBody } from 'next-sanity/webhook'
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

import { getClientIP, rateLimit, rateLimiters } from '@/lib/utils/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit to prevent cache flooding
  const ip = getClientIP(request)
  const rateLimitResult = rateLimit(`revalidate:${ip}`, rateLimiters.standard)

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { data: null, error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetIn),
        },
      }
    )
  }
  try {
    const secret = process.env.SANITY_REVALIDATE_SECRET
    if (!secret) {
      return new Response('Webhook secret not configured', { status: 503 })
    }

    const { body, isValidSignature } = await parseBody<{
      _type: string
      slug?: { current: string }
    }>(request, secret)

    if (!isValidSignature) {
      return new Response('Invalid signature', { status: 401 })
    }

    if (!body?._type) {
      return new Response('Bad Request', { status: 400 })
    }

    revalidateTag(body._type, {})

    if (body.slug?.current) {
      revalidateTag(`${body._type}:${body.slug.current}`, {})
    }

    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('Revalidation client error: invalid JSON body', error)
      return new Response('Invalid JSON body', { status: 400 })
    }

    console.error('Revalidation error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
