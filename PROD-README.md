# Arth — website

The site for **Arth**, a commissioned-artwork studio. Bilingual (English and
Indonesian), content-managed in Sanity, built on Next.js 16.

Three documents, three readers — start with the one that matches you:

| You are…                   | Read                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| the studio, adding artwork | [`docs/PANDUAN-STUDIO.md`](./docs/PANDUAN-STUDIO.md) — Indonesian, no terminal |
| deploying it               | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) — env vars, Vercel, CORS, webhook |
| working on the code        | this file, then [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md)      |

---

## Quick start

```bash
bun install
cp .env.example .env.local     # then fill in the Sanity values
bun dev                        # http://localhost:3000 → redirects to /en
```

The site boots with no environment variables at all — every integration
self-disables when its variables are absent. Without Sanity credentials you get
the layout and placeholder copy; with them, the real content.

---

## What is where

```
app/
  [locale]/            every page a visitor sees. `[locale]` is `en` or `id`.
  (chrome)/            Sanity Studio, on its own root layout — no site chrome
  sitemap.ts robots.ts manifest.ts llms.txt/ agent-content/
                       machine-facing surfaces, never localized as a path
components/            shared UI primitives (most have a Storybook story)
vault/                 the site's own blocks: hero, project grid, galleries
lib/
  i18n/                routing, locales, path helpers
  seo/                 canonical, hreflang, sitemap catalog, entity facts
  content/             fallback copy used until the CMS has real values
  integrations/sanity/ schemas, queries, live preview
  styles/              design tokens — colour, type, spacing, easing
  scripts/             CLI tools (see below)
docs/                  deployment, design system, motion spec, stage records
```

Two rules explain most of the structure:

- **Every page URL carries a locale prefix** (`/en/…`, `/id/…`). A bare `/work/x`
  is not a page; it redirects. Anything that _advertises_ a URL — sitemap,
  `/llms.txt`, `/ai`, canonical tags — must emit the prefixed form.
- **Nothing hardcodes a design value.** Colour, spacing, duration and easing all
  come from tokens in `lib/styles/`. See `CLAUDE.md` for the full list.

---

## Commands

| Command                    | What it does                                                       |
| -------------------------- | ------------------------------------------------------------------ |
| `bun dev`                  | Dev server                                                         |
| `bun run build`            | Production build                                                   |
| `bun run start`            | Serve the production build                                         |
| `bun run check`            | **Everything CI runs**: lint, format, types, unit tests, manifests |
| `bun test`                 | Unit tests only                                                    |
| `CI=true bun run test:e2e` | Playwright + axe, against a production build                       |
| `bun run storybook`        | Component catalogue                                                |
| `bun run brand:assets`     | Re-render the OG card and icons from the design tokens             |
| `bun run sanity:typegen`   | Regenerate CMS types after a schema change                         |

`lefthook` runs lint and typecheck on every commit.

`CI=true` on the e2e suite matters: without it Playwright uses the dev server,
where on-demand compilation races Next's prefetch validation and
`not-found.e2e.ts` flakes. The production path is the deciding signal.

---

## Environment variables

Full table with values in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) §1. The
short version:

| Variable                        | Required | Note                                  |
| ------------------------------- | -------- | ------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`          | for prod | No trailing slash. Baked in at build. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for CMS  | Public.                               |
| `NEXT_PUBLIC_SANITY_DATASET`    | for CMS  | Usually `production`.                 |
| `SANITY_API_WRITE_TOKEN`        | previews | Use a **Viewer**-role token.          |
| `SANITY_REVALIDATE_SECRET`      | webhook  | `openssl rand -base64 32`             |

**`NEXT_PUBLIC_BASE_URL` is read at build time, not at runtime.** Change it and
you must rebuild — canonical URLs, hreflang, the sitemap and the share image all
carry it. Deploy without it and the site publishes `localhost` URLs to search
engines.

**Never put a token behind a `NEXT_PUBLIC_` prefix.** That inlines it into the
JavaScript every visitor downloads, and the site keeps working perfectly while
it does so.

---

## Content

The studio manages everything at `/studio`. Publishing fires a webhook to
`POST /api/revalidate`, which updates the live site without a deploy.

Editorial copy is **not** in the code. `messages/en.json` and `messages/id.json`
hold interface text only — nav labels, buttons. Anything the studio should be
able to reword lives in Sanity, with placeholders in `lib/content/` until it
does.

---

## Deployment

Vercel, on push. First-time setup — including the two steps that are easy to
miss (Sanity CORS, and the publish webhook) — is in
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md). A VPS path is documented there too;
nothing here is Vercel-specific except `@vercel/analytics`, which no-ops when
`VERCEL_ENV` is unset.

---

## Known limitations, stated plainly

- **No performance measurement beyond this container.** Numbers in `docs/` are
  measured against `next start` on localhost, or labelled as budgets. No field
  data, no real devices, no Lighthouse score.
- **`script-src` allows `'unsafe-inline'`.** Next's own bootstrap is inline and
  there is no nonce pipeline. See `docs/DEPLOYMENT.md` §7.
- **The `production` dataset is public-read.** Fine for a portfolio; do not put
  anything private in it.
- **`bun run handoff` and `setup:lean` are starter tools and are not exercised
  by CI.** `handoff` would strip the Satūs credit from the footer, which must
  stay — Satūs is MIT and the notice is part of the licence.

---

Built on [Satūs](https://github.com/darkroomengineering/satus) by
[darkroom.engineering](https://darkroom.engineering), MIT licensed.
