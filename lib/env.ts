import { z } from 'zod'

import { assertServerEnvironment } from '@/utils/assert-server-environment'

/**
 * Typed Environment Variables
 *
 * Provides validated, type-safe access to environment variables.
 * Import `env` instead of using `process.env` directly for type safety.
 *
 * @example
 * ```ts
 * import { env } from '@/lib/env'
 *
 * // Type-safe access with IntelliSense
 * const url = env.NEXT_PUBLIC_BASE_URL // string | undefined
 * const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID // string | undefined
 * ```
 */

const declaredEnv = z.object({
  // Core
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  NEXT_PUBLIC_BASE_URL: z.url().optional(),

  // Sanity (supports both Satus and Vercel Marketplace conventions)
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
  // Sanity API version (YYYY-MM-DD) — validated here so a malformed value
  // fails loudly at startup instead of silently falling back to the
  // hardcoded default in lib/integrations/sanity/env.ts. NOTE: this schema
  // key is not currently consumed by sanity/env.ts, which reads
  // process.env.NEXT_PUBLIC_SANITY_API_VERSION directly to stay client-bundle-safe
  // for the Sanity Studio route (see sanity/env.ts for the caveat).
  NEXT_PUBLIC_SANITY_API_VERSION: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      error: 'NEXT_PUBLIC_SANITY_API_VERSION must be in YYYY-MM-DD format',
    })
    .optional(),
  // Public read token; NEXT_PUBLIC_ variant supports Vercel Marketplace installs
  NEXT_PUBLIC_SANITY_API_READ_TOKEN: z.string().optional(),
  // Server-side fallback read token (non-NEXT_PUBLIC_ variant for Vercel Marketplace)
  SANITY_API_READ_TOKEN: z.string().optional(),
  // Private server-side token for mutations (Satus convention)
  SANITY_PRIVATE_TOKEN: z.string().optional(),
  // Alias for SANITY_PRIVATE_TOKEN used by Vercel Marketplace provisioning
  SANITY_API_WRITE_TOKEN: z.string().optional(),
  // Sanity's own CLI/template convention for the project ID env var name —
  // recognized so a project provisioned by `sanity init` or the CLI
  // template validator isn't treated as unconfigured.
  SANITY_STUDIO_PROJECT_ID: z.string().optional(),
  // Webhook secret for on-demand revalidation (app/api/revalidate)
  SANITY_REVALIDATE_SECRET: z.string().optional(),

  // Shopify
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_REVALIDATION_SECRET: z.string().optional(),

  // HubSpot
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  NEXT_PUBLIC_HUBSPOT_PORTAL_ID: z.string().optional(),
  // Opt-in allowlist of form IDs the newsletter action may submit to
  // (comma-separated). Server-only — unset means no restriction.
  HUBSPOT_ALLOWED_FORM_IDS: z.string().optional(),

  // Mailchimp
  MAILCHIMP_API_KEY: z.string().optional(),
  MAILCHIMP_SERVER_PREFIX: z.string().optional(),
  MAILCHIMP_AUDIENCE_ID: z.string().optional(),

  // Turnstile
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_GOOGLE_ANALYTICS: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().optional(),
})

/**
 * A write-capable token may never sit behind a `NEXT_PUBLIC_` name.
 *
 * `DEPLOYMENT.md` §0 states the rule as an absolute — *"Never give a token a
 * `NEXT_PUBLIC_` prefix"* — and until now nothing enforced it. That absolute is
 * also not quite the rule this codebase follows, and the gap is worth naming
 * rather than papering over: `NEXT_PUBLIC_SANITY_API_READ_TOKEN` feeds
 * `browserToken` in `next-sanity`'s `defineLive`, and a browser token that
 * cannot reach the browser is not a token, it is a typo. That one variable is
 * *designed* to be inlined, which is exactly why it must be Viewer-only.
 *
 * So the enforceable rule is narrower and sharper than the prose one: the
 * value inlined into every visitor's bundle must never be the same string as a
 * token that can write or delete. That is mechanical, so it is checked here
 * instead of trusted to a comment.
 *
 * Server-side only. This file already asserts a server environment below, and
 * the check must stay here rather than in `lib/integrations/sanity/env.ts` —
 * that module is dual-compiled into the client bundle, so reading the write
 * token there to compare it would inline the very secret this guard exists to
 * keep out.
 */
export const envSchema = declaredEnv.superRefine((value, ctx) => {
  const publicToken = value.NEXT_PUBLIC_SANITY_API_READ_TOKEN
  if (!publicToken) return

  const writeTokens = [
    ['SANITY_API_WRITE_TOKEN', value.SANITY_API_WRITE_TOKEN],
    ['SANITY_PRIVATE_TOKEN', value.SANITY_PRIVATE_TOKEN],
  ] as const

  for (const [name, writeToken] of writeTokens) {
    if (writeToken && writeToken === publicToken) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_SANITY_API_READ_TOKEN'],
        message:
          `NEXT_PUBLIC_SANITY_API_READ_TOKEN has the same value as ${name}. ` +
          'The NEXT_PUBLIC_ prefix inlines it into the JavaScript sent to ' +
          'every visitor, so this publishes a write-capable credential. Use a ' +
          'Viewer token there, or leave it unset — see docs/DEPLOYMENT.md §0.',
      })
    }
  }
})

type Env = z.infer<typeof envSchema>

/**
 * Validated environment variables with full TypeScript IntelliSense.
 *
 * All fields are optional -- integrations check their own requirements
 * via the registry's `isConfigured()`. This object provides type-safe access
 * without runtime validation overhead (parsing happens once at import).
 */
assertServerEnvironment('@/lib/env')

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env: Env = parsedEnv.data

/**
 * Canonical base URL for the application.
 *
 * Falls back to `https://localhost:3000` for local development (the dev server
 * supports --https mode). In production, NEXT_PUBLIC_BASE_URL must be set —
 * omitting it causes all canonical URLs, sitemaps, and OG images to resolve
 * to localhost, breaking SEO entirely.
 */
export const APP_BASE_URL = env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

/**
 * Warned once per process, and the "once" is the whole of this block.
 *
 * ## What it looked like without the latch
 *
 * The warning is correct and it stays. What was wrong was its volume: this
 * module is evaluated once per entry point, and `next build` collects page
 * data across seven worker processes, so a single missing value printed
 * **fourteen times** through one build — interleaved with the progress bar,
 * so the log read as if something were failing repeatedly rather than as one
 * setting being absent.
 *
 * That is not a cosmetic complaint. `RENCANA` §8.7 carries it as risk R2 in
 * another costume: after ten identical lines nobody reads the eleventh, and
 * the eleventh is where a different warning hides. A warning repeated past
 * the point of being read has stopped being a warning.
 *
 * ## Why `globalThis` rather than a module-level `let`
 *
 * A module-level flag is per module instance, and the repetition comes from
 * the module being evaluated more than once inside a process — different
 * entry points, different bundles, same worker. `globalThis` is the only
 * scope the copies share. Across processes it cannot help, which is correct
 * and deliberate: seven workers now print once each rather than twice, and a
 * reader still learns the value is missing wherever they look.
 *
 * ## What it is NOT
 *
 * It is not a fix for the missing value. `NEXT_PUBLIC_BASE_URL` is baked at
 * build time, so setting it later without rebuilding changes nothing —
 * `docs/DEPLOYMENT.md` §2.1 and the domain step in `RENCANA` own that, and
 * both are still open.
 */
declare global {
  /*
   * Declared rather than asserted. A `Record<symbol, unknown>` cast would
   * have satisfied the compiler and failed `anti-slop/no-unsafe-dictionary-type`
   * for a good reason: it hands every later reader a bag with no value
   * contract. This says what the property is and what it may hold.
   */
  // `var` rather than `let`: it is the only declaration form that augments
  // `globalThis`, which is the whole point of this block.
  var arthBaseUrlWarned: boolean | undefined
}

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.NEXT_PUBLIC_BASE_URL &&
  !globalThis.arthBaseUrlWarned
) {
  globalThis.arthBaseUrlWarned = true
  console.warn(
    '[env] NEXT_PUBLIC_BASE_URL is not set in production. ' +
      'Canonical URLs, sitemaps, and OG image paths will resolve to localhost, ' +
      'which harms SEO. Set NEXT_PUBLIC_BASE_URL to your production domain.'
  )
}
