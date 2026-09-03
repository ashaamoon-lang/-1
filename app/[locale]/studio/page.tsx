import cn from 'clsx'
import { getTranslations } from 'next-intl/server'
import { locale as localeRootParam } from 'next/root-params'

import { ProgressText } from '@/components/effects/progress-text'
import { Wrapper } from '@/components/layout/wrapper'
import { Link } from '@/components/ui/link'
import { PRACTICES } from '@/lib/content/practices'
import { localizedPath } from '@/lib/i18n/paths'
import { isLocale, routing } from '@/lib/i18n/routing'
import { generatePageMetadata } from '@/lib/utils/metadata'
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
  const [t, tPractice] = await Promise.all([
    getTranslations('studio'),
    getTranslations('workIndex'),
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
                <dt className={cn('h3', s.capabilityName)}>
                  {tPractice(practice)}
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
