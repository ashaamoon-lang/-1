import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locale as localeRootParam } from 'next/root-params'

import { ProgressText } from '@/components/effects/progress-text'
import { Wrapper } from '@/components/layout/wrapper'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import {
  PRACTICES,
  type Practice,
  isPractice,
  practiceTemplate,
} from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, type Locale, routing } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { workIndexQuery } from '@/lib/integrations/sanity/queries'
import { SITE } from '@/lib/seo/site'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { NextPractice } from '@/vault/blocks/next-practice'
import { PracticeHero } from '@/vault/blocks/practice-hero'
import { ProjectGrid } from '@/vault/blocks/project-grid'
import { Reveal } from '@/vault/motion/reveal'

import s from './page.module.css'

/**
 * `/[locale]/practice/[value]` — the page about one practice.
 *
 * ## Why a page and not the filtered catalogue it replaces
 *
 * These three values have been structural vocabulary since Tahap 13: a closed
 * schema list, a URL segment, JSON-LD entries, the catalogue's filter chips,
 * three lines in the home hero, and since Tahap 14b a `<details>` on the home
 * page. What they never had was somewhere that is *about* them — only a
 * listing narrowed to them, which answers "what work is there" and not "what
 * is this".
 *
 * `/work/practice/<value>` used to be that listing. It now redirects here, so
 * one subject has one URL. Two would split what an answer engine reads and
 * make a reader choose between them for no reason —
 * `docs/stages/TAHAP-15.md` §5.1.
 *
 * ## Where the content comes from
 *
 * The nameplate's sentence is `workIndex.<practice>Intro`, written in Tahap 13
 * and already used as each filtered catalogue's masthead — real copy, both
 * languages, nothing invented here. The work is the CMS's. Only the statement
 * is new prose, and it is **marked as placeholder** with the same mechanism
 * the home page uses, because the studio has not written it. Tahap 13 §9 stays
 * open; this page does not pretend otherwise.
 *
 * ## `gsap`, not `webgl`
 *
 * `ProgressText` scrubs word opacity against scroll position, which needs
 * ScrollTrigger. That is the only heavy library this route opts into:
 * `e2e/route-budget.e2e.ts` allows three.js on exactly one route and this is
 * not it, so the plates here are the plain images `/en/work` renders.
 */

interface PracticePageProps {
  params: Promise<{ value: string }>
}

/**
 * Static, complete, and independent of the CMS — the same reasoning the
 * filtered route carried. Three compile-time values, so no Sanity round trip
 * and no empty-dataset sentinel.
 */
/**
 * This route blocks on its own params, and says so.
 *
 * Next 16 reports a route that reads `params` outside a `<Suspense>` as one
 * that "may prevent the navigation from being instant", and offers two ways
 * out: stream a placeholder, or declare the route blocking. Tahap 16c
 * measured the first one. Wrapping this page's body in `<Suspense>` took its
 * no-JavaScript render from **924 characters to 20** — literally
 * "Skip to main content" — because everything here depends on `params` and so
 * there is no smaller unit to wrap; the shell that arrives instantly is an
 * empty page.
 *
 * That is the same regression `e2e/no-javascript.e2e.ts` was built to stop
 * after a single `loading.tsx` reduced the home page to 28 characters for a
 * crawler. Trading the site's readability without JavaScript for a shell with
 * nothing in it is not a trade worth making.
 *
 * So the honest declaration is this one. It changes no behaviour — the route
 * already blocked — it states the intent, and it silences a diagnostic that
 * would otherwise train everyone to ignore the console.
 * `docs/stages/TAHAP-16.md` §7 carries the measurement.
 */
export const instant = false

export function generateStaticParams() {
  return PRACTICES.map((value) => ({ value }))
}

/**
 * `'use cache'` is required rather than stylistic: `sanityFetch` calls
 * `cacheTag()` internally, which under Cache Components is only legal inside
 * a cached function. Locale and practice are arguments so they are part of
 * the key — two practices must not share one cached result.
 */
async function fetchPractice(locale: string, practice: Practice) {
  'use cache'
  const projects = await sanityFetch({
    query: workIndexQuery,
    params: { locale, practice },
    perspective: 'published',
    stega: false,
  })
  return projects.data
}

/** The practice after this one, wrapping at the end so the three form a circuit. */
function nextPractice(value: Practice): Practice {
  const index = PRACTICES.indexOf(value)
  // SAFETY: `value` is a `Practice`, so `indexOf` returns a real index and
  // the modulo keeps the result inside the tuple's bounds — the lookup can
  // never be `undefined`. TypeScript widens an indexed access on a readonly
  // tuple to `Practice | undefined` because it cannot see that arithmetic.
  return PRACTICES[(index + 1) % PRACTICES.length] as Practice
}

export default async function PracticePage({ params }: PracticePageProps) {
  if (!isConfigured('sanity')) notFound()

  const { value } = await params
  // `dynamicParams` defaults to true, so a hand-typed `/en/practice/sculpture`
  // reaches this component. That names a practice the agency does not have —
  // a 404, not an empty page.
  if (!isPractice(value)) notFound()

  const requested = await localeRootParam()
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale

  const [projects, t, tWork, tNav] = await Promise.all([
    fetchPractice(locale, value),
    getTranslations('practice'),
    // The practice's name and its one-sentence description are already
    // written here, in both languages, and already used as the masthead of
    // each filtered catalogue. Reading them rather than adding a second set
    // keeps this page saying what the rest of the site says.
    getTranslations('workIndex'),
    getTranslations('nav'),
  ])

  const next = nextPractice(value)

  return (
    <Wrapper theme="dark" gsap>
      <div className={s.page}>
        {/*
          The first screen's tone. Decoration only — `aria-hidden`, no content,
          no pointer events — and marked so `e2e/visual-substance.e2e.ts` can
          hide it and prove it adds light rather than subtracting it, which is
          the defect Tahap 17 found on the home hero.
        */}
        <div className={s.wash} data-accent-region="" aria-hidden="true" />

        {/*
          Where this page sits — Tahap 38.

          A practice page is a landing page: it is the one that should rank
          for "commissioned mural" rather than the generic index, so most of
          its readers arrive without having seen `/work` at all. The trail is
          the only thing on the page that says the catalogue exists before the
          reader reaches the bottom of it.
        */}
        <Breadcrumbs
          className={s.breadcrumbs}
          label={tNav('breadcrumb')}
          trail={[
            {
              href: '/',
              label: tNav('crumbHome'),
              url: `${SITE.url}${localizedPath(locale, '/')}`,
            },
            {
              href: '/work',
              label: tNav('work'),
              url: `${SITE.url}${localizedPath(locale, '/work')}`,
            },
            {
              label: tWork(value),
              url: `${SITE.url}${localizedPath(locale, practiceTemplate(value))}`,
            },
          ]}
        />

        <PracticeHero
          value={value}
          eyebrow={t('eyebrow')}
          label={tWork(value)}
          intro={tWork(`${value}Intro`)}
          count={tWork('count', { count: projects.length })}
        />

        {/*
          No `SectionHeader` here, and no heading at all.

          The obvious shape was `<SectionHeader eyebrow title="" />`, which
          renders an **empty `<h2>`** — an outline entry with no text, which
          axe reports as `empty-heading` and a screen reader announces as a
          heading that says nothing. A section whose only label is a mono
          eyebrow does not need a heading to have one.

          The marker sits on the `<section>`, not on `ProgressText`: that
          component renders a `<span>` with `ref`, `className` and `style`
          only and spreads nothing else, so an attribute passed to it would be
          dropped silently and the gate would fail against correct markup.
        */}
        <section data-practice-statement="" className={s.section}>
          <Reveal>
            <p data-reveal-item className={cn('caption', s.eyebrow)}>
              {t('statementEyebrow')}
            </p>
          </Reveal>
          {/*
            `ProgressText` was built at the fork, carries `scrub: true`, and
            had **zero consumers** for fifteen stages — while its own doc
            comment already named what it is for: "a long passage the reader
            moves through". A practice's statement is exactly that, and this
            is the only place on the site that matches the description.
          */}
          <ProgressText
            /*
             * `start`/`end` are set, and that is the difference between this
             * scrubbing and this doing nothing.
             *
             * The defaults are `top top` → `bottom bottom`, which assume a
             * passage taller than the viewport: the trigger opens when the
             * element's top reaches the top of the screen and closes when its
             * bottom reaches the bottom. A three-line statement is far shorter
             * than a screen, so those two positions are a few pixels apart and
             * the whole scrub resolves in one frame.
             *
             * Measured before this was set: all 46 words moved together,
             * `min` opacity equal to `max` at every scroll position — the
             * component ran, split the text, and produced a single fade. It
             * would have shipped as "ProgressText is finally used" while doing
             * nothing the reader could see.
             *
             * `top 80%` → `bottom 40%` spans roughly 40% of the viewport's
             * height regardless of how short the paragraph is, so the words
             * arrive across a real scroll distance.
             */
            start="top 80%"
            end="bottom 40%"
            className={cn('p-big', s.statement)}
          >
            {t(`${value}Statement`)}
          </ProgressText>
          <p className={cn('caption', s.placeholder)}>{t('placeholderNote')}</p>
        </section>

        {projects.length > 0 ? (
          <section className={s.section}>
            <SectionHeader reveal title={t('workTitle')} />
            {/*
              `catalogue`, not the default `editorial` layout: a work's `span`
              is a composition choice for the home page's curated handful, and
              a listing wants one rhythm. `vault/blocks/project-grid`
              documents the measurement that forced the split.
            */}
            <ProjectGrid projects={projects} layout="catalogue" />
          </section>
        ) : (
          /*
           * The designed absence, with a door in it — Tahap 38.
           *
           * All three practice pages are prerendered whether or not the
           * studio has published work under them, so this branch is
           * reachable, and until now it was a sentence and a dead end: the
           * only way onward from it was the next-practice circuit at the very
           * bottom. A reader who came looking for consulting work and found
           * none is exactly the reader who should be shown the rest.
           */
          <Reveal className={s.section}>
            <p data-reveal-item className="p-big">
              {t('empty')}
            </p>
            <p data-reveal-item>
              <Link
                href="/work"
                className={cn('caption', s.emptyAction)}
                data-press="cta"
                data-intent=""
              >
                {t('emptyAction')}
              </Link>
            </p>
          </Reveal>
        )}

        <NextPractice
          href={localizedPath(locale, practiceTemplate(next))}
          eyebrow={t('nextEyebrow')}
          label={tWork(next)}
        />
      </div>
    </Wrapper>
  )
}

export async function generateMetadata({ params }: PracticePageProps) {
  const { value } = await params
  const requested = await localeRootParam()
  const locale: Locale = isLocale(requested) ? requested : routing.defaultLocale
  const t = await getTranslations('workIndex')

  if (!isPractice(value)) {
    // Matches the `notFound()` above. Without it the 404 would inherit the
    // parent layout's title and be indexable under whatever was typed.
    return generatePageMetadata({
      title: t('title'),
      noIndex: true,
      url: localizedPath(locale, '/work'),
    })
  }

  return generatePageMetadata({
    title: t(`${value}Title`),
    description: t(`${value}Intro`),
    url: localizedPath(locale, practiceTemplate(value)),
  })
}
