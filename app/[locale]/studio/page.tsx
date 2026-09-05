import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { locale as localeRootParam } from 'next/root-params'

import { ProgressText } from '@/components/effects/progress-text'
import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { PRACTICES, practiceTemplate } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { featuredProjectsQuery } from '@/lib/integrations/sanity/queries'
import { generatePageMetadata } from '@/lib/utils/metadata'
import { ProjectCard } from '@/vault/blocks/project-card'
import { StepSequence } from '@/vault/blocks/step-sequence'
import { Reveal } from '@/vault/motion/reveal'
import { TextReveal } from '@/vault/motion/text-reveal'

import s from './page.module.css'

/**
 * The studio page — who works here, and what happens if you hire them.
 *
 * ## Why this route exists
 *
 * `STUDIO` has been in the header since the first stage, pointing at a `#studio`
 * anchor on the home page. Tahap 22 measured the consequence: `/en/studio`
 * answered with "Page not found", and it was the one nav label that stage
 * deliberately did **not** redirect, on the written promise that it would
 * become a real route here.
 *
 * ## The text is scaffolding, and that is deliberate
 *
 * The owner's instruction for this stage: write the copy as layout scaffolding,
 * because the whole site's text is going to be replaced later, and focus on
 * design and motion. So the copy is written to **realistic length** — a
 * two-line heading, a three-line lead, a 90-110 word statement — because a
 * layout proved with one short sentence breaks the moment real prose arrives.
 *
 * The colophon is the exception: those facts are true, and left true, so one
 * section of this page needs no rewrite later.
 *
 * ## What it reuses, and why nothing is new
 *
 * Every moving part here already ships elsewhere: `TextReveal` for the `h1`
 * (the entrance vocabulary Tahap 23 unified), `Reveal` for block entrances,
 * and `ProgressText` for the long statement — whose own doc names this exact
 * case, *"a long passage the reader moves through"*, and which until now lived
 * on one route type only.
 *
 * One choreographed moment, and it has a name: **`studio-statement`**, the
 * scrub. `docs/MOTION-SPEC.md` §9.5 allows two per page; using one is
 * restraint rather than a shortfall.
 *
 * The sticky section label in "how we work" is **layout, not animation** — CSS
 * `position: sticky`, no JavaScript, no bytes, and nothing that counts against
 * that budget of two.
 */

interface StudioPageProps {
  params: Promise<Record<string, never>>
}

export async function generateMetadata(_props: StudioPageProps) {
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale
  const t = await getTranslations('studio')

  return generatePageMetadata({
    title: t('title'),
    description: t('lead'),
    url: localizedPath(locale, '/studio'),
  })
}

/**
 * The work this page's prose is about — Tahap 44.
 *
 * ## Why a page that was entirely static now fetches
 *
 * `/en/studio` rendered **zero images**, measured on the production build's
 * server HTML, on a site whose subject is commissioned artwork. It was the
 * longest page after the catalogue and had nothing on it to look at.
 *
 * That was never a content problem: six covers were already published and
 * already rendering on three other routes. This page simply never asked for
 * them, because it had no reason to fetch anything at all.
 *
 * `'use cache'` for the same reason every other route uses it — the page is
 * statically prerendered and must stay that way; `e2e/response-headers.e2e.ts`
 * asserts it is cacheable.
 */
async function evidence(locale: string) {
  'use cache'
  const projects = await sanityFetch({
    query: featuredProjectsQuery,
    // `$locale` picks the reader's language out of each internationalized
    // field; the query coalesces to English when a field has no translation.
    params: { locale },
    perspective: 'published',
    stega: false,
  })
  /*
   * Three, not four. The strip is one row of the 12-column grid at
   * `span 4`; a fourth would wrap and make this a listing, which is what
   * `/work` already is. Sliced here rather than in the query so the query
   * stays the same one the home page reads — two queries that differ only by
   * a limit are two things to keep in step.
   */
  return projects.data.slice(0, 3)
}

export default async function StudioPage() {
  /*
   * `workIndex`, not `work`.
   *
   * The practice labels — "Consulting", "AI & Data", "Commission" — live in
   * `workIndex`, which is the namespace the filter chips and the footer index
   * already read (`components/layout/footer` does the same). Reaching for
   * `work` renders the key path instead of the label: this page shipped
   * `work.consulting` as a visible heading until it was looked at.
   */
  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  const [t, tPractice, works] = await Promise.all([
    getTranslations('studio'),
    getTranslations('workIndex'),
    evidence(locale),
  ])

  /*
   * The four steps, as data rather than four copy-pasted blocks.
   *
   * They are numbered 01-04 in the design because they are genuinely a
   * sequence — what happens first constrains what is possible next. A numbered
   * marker on a list that is not ordered is decoration; here it carries
   * information, which is the only reason it earns the space.
   */
  const steps = ['scope', 'read', 'decide', 'deliver'] as const

  return (
    <Wrapper theme="dark" gsap>
      <div className={s.page}>
        {/*
          The first screen's tone. Decoration only — `aria-hidden`, no content,
          no pointer events — and marked so `e2e/visual-substance.e2e.ts` can
          hide it and prove it adds light rather than subtracting it.
        */}
        <div className={s.wash} data-accent-region="" aria-hidden="true" />

        {/*
          The hero borrows the project page's discipline from Tahap 19: the
          facts sit in a `<dl>` on the first screen, not below the fold. A
          reader deciding whether to make contact should not have to scroll to
          learn where the studio is or how many people are in it.
        */}
        <header className={s.hero}>
          <div className={s.heroText}>
            <p className={cn('caption', s.eyebrow)}>{t('eyebrow')}</p>
            {/*
              One word, exactly as the catalogue's `h1` is "Work" with an
              eyebrow framing it. Diverging here would make a third pattern out
              of a page that should be reading from the same one.
            */}
            <TextReveal as="h1" split="lines" className={cn('h1', s.title)}>
              {t('title')}
            </TextReveal>
            <Reveal>
              <p data-reveal-item className={cn('p-big', s.lead)}>
                {t('lead')}
              </p>
            </Reveal>
          </div>

          <Reveal className={s.facts}>
            <dl data-reveal-item className={s.factList}>
              {(['founded', 'based', 'team', 'languages'] as const).map(
                (fact) => (
                  <div className={s.fact} key={fact}>
                    <dt className={cn('caption', s.factLabel)}>
                      {t(`facts.${fact}`)}
                    </dt>
                    <dd className={cn('caption', s.factValue)}>
                      {t(`facts.${fact}Value`)}
                    </dd>
                  </div>
                )
              )}
            </dl>
            {/*
              Said out loud — Tahap 35.

              Three of these four are invented. This page's own header comment
              records that everything but the colophon is scaffolding, and
              `Founded 2021` / `Jakarta, working remotely` / `Four, plus
              specialists` were shipped with no qualification at all, in the
              one place a reader goes to learn who the studio is.

              `lib/seo/site.ts` deliberately publishes none of them: copying
              them into `schema.org` would have multiplied the invention
              rather than reconciled it. Silence there, a label here. The same
              shape `practice.placeholderNote` already uses on three pages.

              Not an eyebrow, and not styled as one: `taste-skill` caps
              eyebrows per section and this is a footnote, not a category.
            */}
            <p data-reveal-item className={cn('caption', s.factsNote)}>
              {t('factsNote')}
            </p>
          </Reveal>
        </header>

        {/*
          `studio-statement` — the page's one choreographed moment.

          `start`/`end` are set for the same reason the practice page sets
          them, and that file records the measurement: the defaults assume a
          passage taller than the viewport, so on a paragraph shorter than a
          screen the whole scrub resolves in a single frame and the component
          ships as a plain fade while looking like it works.
        */}
        <section className={s.statementSection} data-studio-statement="">
          <Reveal>
            <p data-reveal-item className={cn('caption', s.eyebrow)}>
              {t('statementEyebrow')}
            </p>
          </Reveal>
          <ProgressText
            /*
             * Measured in Tahap 25 §2.2 before these were changed: with
             * `top 80%` the passage was already a third revealed at
             * `scrollY 0` — a reader landed in the middle of the effect —
             * and every word was at full opacity by 400px, long before they
             * had finished reading ninety of them.
             *
             * `top bottom` opens the scrub only once the passage's top
             * reaches the bottom edge of the screen, so nothing has started
             * on arrival. `bottom 30%` closes it near the end of the read
             * rather than at the top of the viewport, which spreads the
             * ninety words across roughly a screen and a half of scroll.
             */
            start="top bottom"
            end="bottom 30%"
            className={cn('p-big', s.statement)}
          >
            {t('statement')}
          </ProgressText>
        </section>

        {/*
          The work the statement above is about — Tahap 44.

          Placed after the statement rather than before it, and that ordering
          is the whole argument: a studio page that opens with pictures is a
          portfolio, and `/work` is already the portfolio. This page says what
          the studio does and then shows that it has done it. Evidence follows
          a claim; it does not replace one.

          `Reveal` and nothing else — no new named moment, no `data-epic`.
          `MOTION-SPEC.md` §9.5 already allots this page two, and each card
          brings its own `work-transport` for the navigation it starts. Adding
          motion to a page that was short of *content* would only have made
          the emptiness move.
        */}
        {works.length > 0 && (
          <Reveal as="section" className={s.evidence}>
            <p data-reveal-item className={cn('caption', s.eyebrow)}>
              {t('evidenceEyebrow')}
            </p>
            {/*
              The cards directly, not `ProjectGrid` — and this is a
              measurement, not a preference.

              `ProjectGrid` calls `useFlipGrid`, because the catalogue needs
              to animate surviving cards when a filter changes the list under
              them. Nothing on this page ever changes this list, so the FLIP
              module and its ScrollTrigger import were weight shipped to run
              nothing: `/en/studio` went from 856KB to **902KB** against a
              900KB ceiling in `e2e/route-budget.e2e.ts`.

              `ProjectCard` is still reused — it is the card, and this strip
              must be the same object the rest of the site shows. What is not
              reused is the grid host, which exists for a behaviour this page
              does not have.
            */}
            <ul className={s.evidenceList}>
              {works.map((project) => (
                <li data-reveal-item key={project._id}>
                  <ProjectCard
                    project={project}
                    span={4}
                    /*
                      Zero preloaded: this sits several screens down, and
                      marking cards above the fold is what `preload` is for.
                    */
                    preload={false}
                  />
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/*
          `studio-process` — the page's second choreographed moment, and the
          one that makes the first section's held label mean something.

          Tahap 24 shipped this as a sticky label beside four compact steps.
          Re-measured in Tahap 25: the pin held for ~200px in an 800px
          viewport and was over before a reader noticed it. The block below
          gives it both the length and the job it was missing — see
          `vault/blocks/step-sequence`.
        */}
        <StepSequence
          label={t('processEyebrow')}
          steps={steps.map((step) => ({
            key: step,
            title: t(`process.${step}Title`),
            body: t(`process.${step}Body`),
          }))}
        />

        {/*
          Capabilities, grouped by the three practices — and the grouping comes
          from `lib/content/practices.ts`, the same constant the routes and the
          footer index read. A hand-written fourth grouping here would be a
          second source of truth for what this studio does.
        */}
        <Reveal as="section" className={s.capabilities}>
          <p data-reveal-item className={cn('caption', s.eyebrow)}>
            {t('capabilitiesEyebrow')}
          </p>
          <dl className={s.capabilityList}>
            {PRACTICES.map((practice) => (
              <div className={s.capability} data-reveal-item key={practice}>
                {/*
                  The name is the link — Tahap 38.

                  This section already says it is "grouped by the three
                  practices", and each of those three has had a page since
                  Tahap 15a that nothing on this page pointed at: measured,
                  `/en/studio` offered **one** onward link in its own content,
                  the closing "See the work". A reader who got this far is
                  reading about a practice, and the page about it was one
                  segment away and invisible.
                */}
                <dt className={cn('h3', s.capabilityName)}>
                  <Link
                    href={practiceTemplate(practice)}
                    className={s.capabilityLink}
                    // `MOTION-SPEC.md` §9 — INTENT and COMMIT on a noun the
                    // reader can press.
                    data-press="practice"
                    data-intent=""
                  >
                    {tPractice(practice)}
                  </Link>
                </dt>
                <dd className={cn('caption', s.capabilityItems)}>
                  {t(`capabilities.${practice}`)}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/*
          The receipt. Unlike everything above it, this is not scaffolding —
          these four facts are true of this site, and they are left true so one
          section survives the rewrite the rest of this page is waiting for.
        */}
        <Reveal as="section" className={s.colophon}>
          <p data-reveal-item className={cn('caption', s.eyebrow)}>
            {t('colophonEyebrow')}
          </p>
          <dl className={s.colophonList}>
            {(['built', 'type', 'colour', 'access'] as const).map((entry) => (
              <div className={s.colophonEntry} data-reveal-item key={entry}>
                <dt className={cn('caption', s.factLabel)}>
                  {t(`colophon.${entry}`)}
                </dt>
                <dd className={cn('caption', s.colophonValue)}>
                  {t(`colophon.${entry}Value`)}
                </dd>
              </div>
            ))}
          </dl>
          <p data-reveal-item className={cn('caption', s.colophonNote)}>
            {t('colophonNote')}
          </p>
        </Reveal>

        <Reveal as="section" className={s.closing}>
          <p data-reveal-item className={cn('p-big', s.closingLine)}>
            {t('closing')}
          </p>
          <div data-reveal-item>
            <Link
              href="/work"
              className={cn('caption', s.closingAction)}
              // `MOTION-SPEC.md` §9 — the page's one forward action.
              data-press="cta"
              data-intent=""
            >
              {t('closingAction')}
            </Link>
          </div>
        </Reveal>
      </div>
    </Wrapper>
  )
}
