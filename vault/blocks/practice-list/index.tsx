/**
 * PracticeList — what the studio does, opened one at a time.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why this block exists
 *
 * `docs/stages/TAHAP-14.md` §1 measured melius.com and found three gaps. Two
 * were closed by 14a and by the reveal coverage above; this is the third:
 * **content that changes in place**. A page whose sections only scroll past
 * is read; a page where something rearranges under the cursor is used, and
 * that difference is most of what separates the two sites once the motion
 * grammar is equal.
 *
 * The site already shipped `components/ui/accordion` and `components/ui/tabs`
 * and **no page used either** — the same "tooling built and left idle"
 * finding Tahap 12 kept turning up.
 *
 * ## Why native `<details>`, and not that accordion
 *
 * `components/ui/accordion` is Base UI `Collapsible` plus React `Activity`:
 * client-only, so its content exists only after hydration. The home page has
 * a stated exit criterion — readable with JavaScript disabled — from Tahap 3,
 * re-asserted by `e2e/no-javascript.e2e.ts`. An accordion there would put
 * three sections of copy behind a script.
 *
 * `<details>` opens with no JavaScript at all, is keyboard-operable and
 * screen-reader-announced by the browser, and needs no `aria-expanded` to be
 * kept in sync. The pattern is already in this repo at
 * `components/ui/error-view/index.tsx:63`.
 *
 * ## Why nothing here is invented copy
 *
 * The plan for this stage allowed for placeholder prose, marked as
 * placeholder. It turned out not to be needed: `messages/*.json` already
 * carries a real sentence per practice — `workIndex.<practice>Intro`, written
 * in Tahap 13 and used as the masthead of each filtered catalogue. Reusing it
 * means this section says exactly what the rest of the site already says, in
 * both languages, with nothing for the studio to correct later.
 *
 * The panel therefore holds that sentence and a route to the work itself.
 * A disclosure that opens onto invented filler would be worse than no
 * disclosure, which is the roadmap's own rule about empty sections.
 *
 * ## Motion
 *
 * The panel's entrance animates `opacity` and `transform` only — `CLAUDE.md`
 * #4 forbids animating height, and a `<details>` height transition is exactly
 * the tempting violation. The disclosure itself opens instantly, which is
 * also what a control should do; what animates is the content arriving inside
 * the box the browser has already opened.
 */

import cn from 'clsx'
import { type ReactNode, ViewTransition } from 'react'

import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { type Practice, practiceTemplate } from '@/lib/content/practices'
import { transitionName } from '@/lib/motion/transition-name'
import { Reveal } from '@/vault/motion/reveal'

import s from './practice-list.module.css'

interface PracticeEntry {
  value: Practice
  /** The practice's name, localized. */
  label: string
  /** One sentence on what it is — the catalogue's own masthead line. */
  intro: string
}

interface PracticeListProps {
  id: string
  eyebrow: ReactNode
  title: ReactNode
  entries: readonly PracticeEntry[]
  /** Label for the link into each filtered catalogue. */
  linkLabel: string
  className?: string | undefined
}

export function PracticeList({
  id,
  eyebrow,
  title,
  entries,
  linkLabel,
  className,
}: PracticeListProps) {
  return (
    <section id={id} className={cn(s.section, className)}>
      <SectionHeader reveal eyebrow={eyebrow} title={title} />

      <Reveal className={s.list}>
        {entries.map((entry) => (
          <details key={entry.value} data-reveal-item className={s.item}>
            {/*
              The heading lives inside the summary so the disclosure's
              accessible name is the practice, and the document outline still
              has an h3 per practice for `e2e/reveal-coverage.e2e.ts` and for
              anyone navigating by heading.
            */}
            {/*
              The summary is this block's pressable noun, not the link inside
              the panel.

              `e2e/interaction-grammar.e2e.ts` walks every `[data-press]` and
              requires it to answer a hover and a press. A control that only
              exists once a disclosure is open cannot answer either — it is
              not hoverable, not focusable, and has no computed transition —
              and marking one there made the gate report three silent nouns
              whose CSS was perfect. The gate was right: a marked noun has to
              be reachable at rest.

              This is also the truer reading. The interaction this block adds
              is *opening a practice*, and the summary is the control that
              does it. The link in the panel is ordinary navigation, styled
              like the rest of the site but not a noun in the grammar.
            */}
            <summary className={s.summary} data-press="practice" data-intent="">
              {/*
                The name is carried to the practice's page rather than
                cross-faded away from it.

                Same mechanism as the work card to its detail page: React
                pairs `<ViewTransition>` elements by name, and the paired
                element does not have to be the one that was pressed — the
                link in the panel below does the navigating, this does the
                travelling.

                `ui-ux-pro-max` is explicit that a navigation morphs **one**
                pair and no more ("compounding Flips are hard to time
                correctly"). This is that one pair; the panel's link carries
                no name of its own.
              */}
              <ViewTransition
                name={transitionName(`practice-${entry.value}`)}
                share="morph"
                default="none"
              >
                <h3 className={cn('h2', s.name)}>{entry.label}</h3>
              </ViewTransition>
              {/*
                Decoration only. The browser announces open/closed state for a
                `<details>` on its own, so a marker that repeated it would be
                said twice.
              */}
              <span className={s.marker} aria-hidden="true" />
            </summary>

            <div className={s.panel}>
              <p className={cn('p-big', s.intro)}>{entry.intro}</p>
              <Link
                href={practiceTemplate(entry.value)}
                className={cn('caption', s.link)}
                // Stands the route-change overlay down for this navigation so
                // the name above can morph into the page's heading instead of
                // being swept over by a panel.
                transition="morph"
              >
                {linkLabel}
              </Link>
            </div>
          </details>
        ))}
      </Reveal>
    </section>
  )
}
