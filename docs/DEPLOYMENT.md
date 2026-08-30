# DEPLOYMENT

How to take this site from a clone to a live domain. Written to be followed
top to bottom without prior knowledge of the codebase.

Two hosts are covered: **Vercel** (recommended first, and what the build is
tuned for) and **a VPS** (for later, when you want to own the machine).

---

## 0. Before anything — the security bit that matters most

**Use a Viewer token in production, not a developer or editor token.**

The site needs a Sanity token for exactly one thing: reading _draft_ content
so the Presentation tool can preview unpublished work. Reading published
content needs no token at all — the `production` dataset is public.

A Viewer token can only read. A developer or editor token can **write and
delete your entire content library**. If the server is ever compromised, that
difference is the whole story.

Create one at **manage.sanity.io → your project → API → Tokens → Add token**,
role **Viewer**.

> **If a token has ever been pasted into a chat, an issue, a screenshot, or a
> commit — revoke it.** Same screen, delete and create a new one. Rotating is
> free and takes a minute; assuming it was fine is the expensive option.

**Never give a token a `NEXT_PUBLIC_` prefix.** That prefix inlines the value
into the JavaScript sent to every visitor's browser. It is not a leak that
shows up in testing — the site works perfectly while publishing your
credentials. `lib/integrations/sanity/env.ts` documents this too.

---

## 1. Environment variables

Copy `.env.example` to `.env.local` for local work. `.env.local` is gitignored
and must stay that way.

### Required

| Variable                        | Value                    | Notes                        |
| ------------------------------- | ------------------------ | ---------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `az53j4l1`               | Public. Safe in the browser. |
| `NEXT_PUBLIC_SANITY_DATASET`    | `production`             | Public.                      |
| `NEXT_PUBLIC_BASE_URL`          | `https://yourdomain.com` | **No trailing slash.**       |

`NEXT_PUBLIC_BASE_URL` is not cosmetic. It drives canonical URLs, `hreflang`,
the sitemap, and social images. Leave it unset and the build warns, then
publishes `localhost` URLs to search engines.

### Recommended

| Variable                   | Value              | Needed for                        |
| -------------------------- | ------------------ | --------------------------------- |
| `SANITY_API_WRITE_TOKEN`   | a **Viewer** token | Draft mode + Presentation preview |
| `SANITY_REVALIDATE_SECRET` | a random string    | The publish webhook (§4)          |

Despite the name, `SANITY_API_WRITE_TOKEN` is only ever read — it is the
variable name the starter looks for. Put a Viewer token in it.

Generate the webhook secret with:

```bash
openssl rand -base64 32
```

### Optional

`NEXT_PUBLIC_SANITY_API_VERSION` (defaults to `2025-03-01`) and
`NEXT_PUBLIC_FACEBOOK_APP_ID`.

---

## 2. Deploy to Vercel

1. Push the branch to GitHub, then **Add New → Project** on Vercel and import
   the repository.
2. Framework preset **Next.js**. Leave build and output settings alone — the
   repo's `vercel.json` and `next.config.ts` already carry what is needed.
3. Add every variable from §1 under **Settings → Environment Variables**.
   Apply them to Production _and_ Preview, or previews will render with
   `localhost` canonicals.
4. Deploy.

### Immediately after the first deploy

**Add your domain to Sanity's CORS allowlist**, or the Studio will load and
then fail every request with an opaque network error:

manage.sanity.io → project → **API → CORS origins → Add origin**

- `https://yourdomain.com` — tick **Allow credentials**
- `https://your-project.vercel.app` — for preview deploys

This step is the single most common reason a correct deployment appears
broken.

---

## 3. Check the deploy is actually right

Run these against the live domain. Each one catches a different real failure.

```bash
SITE=https://yourdomain.com

# Root must redirect to a locale, not serve a page
curl -sSI $SITE/ | grep -i "^location"          # expect /en

# Both languages render
curl -sSo /dev/null -w "%{http_code}\n" $SITE/en
curl -sSo /dev/null -w "%{http_code}\n" $SITE/id

# hreflang present, and pointing at the real domain (not localhost)
curl -sS $SITE/en | grep -o '<link rel="alternate" hrefLang[^>]*>'

# Sitemap lists both locales, with the real domain
curl -sS $SITE/sitemap.xml | grep -o '<loc>[^<]*</loc>'

# The CMS loads
curl -sSo /dev/null -w "%{http_code}\n" $SITE/studio
```

If `hreflang` or the sitemap show `localhost`, `NEXT_PUBLIC_BASE_URL` is
missing or wrong. Fix it and redeploy — the values are baked in at build time.

---

## 4. Publish webhook (so edits appear without a redeploy)

Without this, published changes only show up on the next deploy.

manage.sanity.io → project → **API → Webhooks → Create webhook**

| Field       | Value                                       |
| ----------- | ------------------------------------------- |
| URL         | `https://yourdomain.com/api/revalidate`     |
| Dataset     | `production`                                |
| Trigger on  | Create, Update, Delete                      |
| HTTP method | `POST`                                      |
| API version | `v2025-03-01`                               |
| Secret      | the same `SANITY_REVALIDATE_SECRET` from §1 |

The route verifies the signature and returns **401** on a bad one, and **503**
if the secret is not configured — so a misconfigured webhook fails loudly
instead of silently doing nothing.

---

## 5. Deploying to a VPS later

The app is a standard Next.js server. Nothing here is Vercel-specific except
`@vercel/analytics`, which no-ops when `VERCEL_ENV` is unset.

```bash
bun install
bun run build
bun run start          # listens on :3000
```

Put nginx or Caddy in front for TLS and proxy to `:3000`. Run it under
systemd or PM2 so it restarts on reboot. Set the same environment variables in
the service definition — **not** in a file inside the web root.

Two things Vercel did for you that you now own:

- **Image optimisation** runs on your CPU. Watch memory on a small instance.
- **Caching.** `next start` has no CDN in front of it. Add one, or accept that
  every request reaches the origin.

---

## 6. Pre-launch checklist

- [ ] Production token is **Viewer** role, not developer/editor
- [ ] Any token ever pasted into a chat or issue has been **revoked**
- [ ] No token sits behind a `NEXT_PUBLIC_` variable
- [ ] `.env.local` is not committed (`git ls-files .env.local` returns nothing)
- [ ] `NEXT_PUBLIC_BASE_URL` set, no trailing slash
- [ ] Domain and preview domain added to Sanity CORS, credentials allowed
- [ ] `/` redirects to `/en`; `/en` and `/id` return 200
- [ ] `sitemap.xml` and `hreflang` show the real domain
- [ ] Publish webhook configured and returning 200 on a test publish
- [ ] `bun run check`, `bun run build`, `CI=true bun run test:e2e` all pass

---

## 7. Known limitations, stated plainly

**`script-src` allows `'unsafe-inline'`.** The Content-Security-Policy is
otherwise tight — `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`,
and Sanity origins scoped exactly — but inline scripts are permitted. This is
the upstream starter's default and what Next.js needs without nonce plumbing.
It weakens XSS protection. Tightening it means adding a nonce, and is worth
doing before handling anything sensitive. The policy is composed in
`lib/integrations/csp.ts`.

**The `production` dataset is public-read.** Anyone who knows the project ID
can query published content. For a portfolio that is fine — the content is
public anyway — but do not put anything private in it.

**No performance measurement has been done.** Every performance figure in this
repository is a budget, not a profiler result. See `docs/RESOURCES.md`.

---

## Troubleshooting

| Symptom                                | Cause                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| Studio loads then all requests fail    | Domain missing from Sanity CORS (§2)                                           |
| `hreflang`/sitemap say `localhost`     | `NEXT_PUBLIC_BASE_URL` unset at **build** time                                 |
| `/studio` 404s                         | `NEXT_PUBLIC_SANITY_PROJECT_ID` missing — the config returns `null` without it |
| Draft mode returns 503                 | No token set; needs `SANITY_API_WRITE_TOKEN` (§1)                              |
| Webhook returns 401                    | Secret in Sanity differs from `SANITY_REVALIDATE_SECRET`                       |
| Published edits do not appear          | Webhook not configured (§4)                                                    |
| `/` returns 404 instead of redirecting | `proxy.ts` not deployed, or its `matcher` was edited                           |
