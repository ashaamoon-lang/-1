import { Wrapper } from '@/components/layout/wrapper'
import { Hero } from '@/vault/blocks/hero'

import { HOME_HEADLINE } from './copy'

import s from './page.module.css'

/**
 * Foundation homepage.
 *
 * This is **not** the designed site — real pages are built after the
 * foundation is reviewed. It exists for two concrete reasons:
 *
 * 1. It exercises the vault end-to-end (`Hero` → `TextReveal`, `Magnetic`,
 *    `SceneShell`), so the components are proven to render in a real Next.js
 *    build rather than only in Storybook.
 * 2. It satisfies the repository's own contracts. `e2e/agent-readiness.e2e.ts`
 *    requires the homepage to serve exactly one `<h1>`, a non-skipping heading
 *    order, and ≥500 characters of readable text without JavaScript. Those
 *    tests are correct, and an empty homepage fails them — a foundation that
 *    fails its own test suite is not finished.
 *
 * Replace the copy when the real site is designed; keep the structure.
 */
export default function Home() {
  return (
    // No `webgl` prop: `lib/features` already mounts a shared root canvas in
    // the site layout, which Hero's SceneShell portals into. Adding
    // `<Wrapper webgl>` here would mount a SECOND root canvas — the case
    // Wrapper's own docs warn about — and the two instances race to claim
    // primary during a prefetch render, which breaks the 404 page's console.
    <Wrapper theme="dark" lenis={{}}>
      {/*
        No <main> here: Wrapper already renders `<main id="main-content">`,
        which is what the skip link targets. Nesting a second one produced
        three axe landmark violations (landmark-no-duplicate-main,
        landmark-main-is-top-level, landmark-unique) that the e2e gate did
        not catch, because it filtered to critical/serious only.
      */}
      <Hero
        headline={HOME_HEADLINE}
        subline="A studio foundation built on measured decisions, not borrowed taste."
        action={
          <button type="button" className={s.cta}>
            See the foundation
          </button>
        }
      />

      <section className={s.section}>
        <h2 className={s.heading}>What this repository is</h2>
        <p className={s.body}>
          This is the foundation for a commissioned-artwork studio site. It
          starts from Satūs, the production Next.js starter published by
          darkroom.engineering — the studio behind Lenis, the smooth-scroll
          library that turns up in the shipped source of award-winning sites
          across the industry. Starting there means starting from the same line
          as the studios doing this work professionally, under the MIT licence,
          rather than assembling a stack from tutorials.
        </p>
        <p className={s.body}>
          On top of that sits a research layer. Ten award-winning sites were
          measured directly from their live production CSS: the easing curves
          they actually ship, the durations they actually use, how many font
          weights they allow themselves, how their grids are declared. The raw
          counts are committed alongside the analysis, so every claim in the
          design system can be checked rather than taken on trust.
        </p>

        <h3 className={s.subheading}>What the measurements showed</h3>
        <p className={s.body}>
          The most useful finding was that the easing curves these studios ship
          are already named tokens in this codebase. The curve used most heavily
          on one measured site is exactly the token defined here as
          ease-out-quart; another site&rsquo;s is exactly ease-out-expo. The
          most common duration across the field is 400ms, not the 300ms that
          ships as a default in most component libraries. Restraint, applied
          consistently, is what separates these sites from competent ones — two
          typefaces, three weights, one accent colour, a handful of durations,
          chosen once and never violated.
        </p>
        <p className={s.body}>
          Seven of the ten sites ship no reduced-motion handling in their CSS at
          all. That gap is treated here as an opportunity rather than a
          precedent: every component in this repository honours the preference,
          and does so without leaving content stranded invisible when animation
          is skipped.
        </p>
      </section>
    </Wrapper>
  )
}
