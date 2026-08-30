# Layout Components

Site-wide layout structure: header, footer, and page wrapper.

## Architecture

There is **no `app/layout.tsx`**. The app uses Next's multiple-root-layouts
pattern, because `/studio` must not be localized and must not inherit the
site's providers:

```
app/[locale]/layout.tsx   → <html lang={locale}> + providers (NO header/footer)
  └── page.tsx            → uses <Wrapper>
       └── Wrapper        → Header + <main id="main-content"> + Footer
app/(chrome)/layout.tsx   → minimal <html> shell for the Sanity Studio
```

`[locale]` sits above its layout, which is what makes it a _root parameter_ —
`next/root-params` hands the active locale to any Server Component without
prop drilling, and pages stay prerendered under `cacheComponents`.

## Important

**`<Wrapper>` ALREADY includes `<Header>`, `<main>`, and `<Footer>`.**

Do not add any of them to:

- `app/[locale]/layout.tsx`
- individual page files
- nested layout files

A second `<main>` is not a cosmetic mistake: it produced three axe landmark
violations (`landmark-no-duplicate-main`, `landmark-main-is-top-level`,
`landmark-unique`) that the e2e gate missed because it filtered to
critical/serious only. See `docs/stages/TAHAP-2.md` §8.1.

## Components

| Component  | Purpose                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `wrapper/` | Page container with theme, Lenis, WebGL support. **Includes Header + Footer** |
| `header/`  | Wordmark, in-page nav, language switcher                                      |
| `footer/`  | Contact, social, colophon                                                     |
| `lenis/`   | Smooth scroll provider                                                        |
| `theme/`   | Theme context provider                                                        |

## Usage

```tsx
// app/[locale]/page.tsx
import { Wrapper } from '@/components/layout/wrapper'

export default function Page() {
  return (
    <Wrapper theme="dark">
      {/* Header, <main> and Footer are automatic */}
      <section>Your content here</section>
    </Wrapper>
  )
}
```

## Wrapper props

| Prop        | Type                      | Default  | Description                 |
| ----------- | ------------------------- | -------- | --------------------------- |
| `theme`     | `'dark' \| 'light'`       | `'dark'` | Colour theme                |
| `lenis`     | `boolean \| LenisOptions` | `true`   | Smooth scrolling            |
| `webgl`     | `boolean`                 | `false`  | Enable WebGL canvas         |
| `className` | `string`                  | –        | Additional classes for main |

`theme` takes `ThemeName`, derived from `themes` in `lib/styles/colors.ts`.
The `red` theme was removed in Tahap 1 v2 — see `docs/stages/TAHAP-1.md`.

## One rule that is easy to break

Header and Footer render inside `Wrapper`, which is a Client Component, so
both are client components in practice even without their own `'use client'`.

**Never read the clock during render in either of them.** `new Date()` in a
component body is a dynamic read; under Cache Components it bails the whole
boundary to client-side rendering, and `/en` and `/id` ship as an empty
shell — build green, dev correct, production blank. If a rendered value needs
the date, read it at module scope. `components/layout/footer/index.tsx`
carries the full note, and `e2e/agent-readiness.e2e.ts` guards it.
