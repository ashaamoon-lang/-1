/**
 * PracticeHero — the top of a practice's own page.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why this is not `vault/blocks/hero`
 *
 * The home hero is a three-anchor composition carrying a studio name, an
 * index of practices, a scroll cue and a call to action — a page's *arrival*.
 * This is a subject's *nameplate*: one practice, said once, with the sentence
 * that already describes it everywhere else on the site. Sharing a component
 * between the two would mean six optional props and a hero that is mostly
 * `undefined` on one of its two callers.
 *
 * ## The name is a morph target
 *
 * `transitionName(...)` pairs this heading with the practice's name in the
 * home page's disclosure list, so pressing one carries it here rather than
 * cross-fading two unrelated screens. Same mechanism as the work card to its
 * detail page — and per `ui-ux-pro-max`, **one** pair per navigation, never
 * two compounding.
 */

import cn from 'clsx'
import type { ReactNode } from 'react'
import { ViewTransition } from 'react'

import { transitionName } from '@/lib/motion/transition-name'
import { Reveal } from '@/vault/motion/reveal'

import s from './practice-hero.module.css'

interface PracticeHeroProps {
  /** The practice key — becomes half of the shared transition name. */
  value: string
  /** The practice's name, localized. */
  label: ReactNode
  /** Mono label above the name. Says what kind of page this is. */
  eyebrow: ReactNode
  /** The one sentence that describes this practice everywhere on the site. */
  intro: ReactNode
  /** How many works sit under this practice — real, from the CMS. */
  count: ReactNode
  /**
   * The practice index, in the column the nameplate's measure leaves free.
   *
   * Optional because the measure is the block's contract and the index is
   * not: a caller with nothing to put beside the nameplate gets the single
   * column this shipped with, rather than a grid with an empty half.
   *
   * Measured at 1440x900 before this existed: every one of the hero's four
   * boxes ran x 16-616, and the remaining **824px — 57% of the first screen —
   * carried nothing**, against 95-97% width used on every other route. The
   * `max-width: 60ch` that caused it is correct about the nameplate and silent
   * about the rest of the screen. `docs/stages/TAHAP-75.md`.
   */
  index?:
    | {
        label: ReactNode
        /** One entry per sibling practice. The caller decides if they link. */
        items: { key: string; node: ReactNode }[]
      }
    | undefined
  className?: string | undefined
}

export function PracticeHero({
  value,
  label,
  eyebrow,
  intro,
  count,
  index,
  className,
}: PracticeHeroProps) {
  return (
    /*
      `practice-morph` — the home page's practice name becoming this hero,
      `MOTION-SPEC.md` §9.5 has listed it since Tahap 15 and nothing in the DOM
      said so until Tahap 52. The marker sits on the header rather than on the
      `<h1>` because the moment is the arrival of the block, and the `<h1>` is
      already inside a `<ViewTransition>` whose own name is the morph pair.
    */
    <Reveal
      as="header"
      data-epic="practice-morph"
      className={cn(s.hero, className)}
    >
      <p data-reveal-item className={cn('caption', s.eyebrow)}>
        {eyebrow}
      </p>

      <ViewTransition
        name={transitionName(`practice-${value}`)}
        share="morph"
        default="none"
      >
        <h1 data-reveal-item className={cn('h1', s.name)}>
          {label}
        </h1>
      </ViewTransition>

      <p data-reveal-item className={cn('p-big', s.intro)}>
        {intro}
      </p>
      <p data-reveal-item className={cn('caption', s.count)}>
        {count}
      </p>

      {index ? (
        <nav
          data-reveal-item
          className={s.index}
          aria-label={String(index.label)}
        >
          <p className={cn('caption', s.indexLabel)}>{index.label}</p>
          <ul className={s.indexList}>
            {index.items.map((item) => (
              <li key={item.key} className={cn('caption', s.indexItem)}>
                {item.node}
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </Reveal>
  )
}
