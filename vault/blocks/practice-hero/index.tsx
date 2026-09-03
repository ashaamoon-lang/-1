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
  className?: string | undefined
}

export function PracticeHero({
  value,
  label,
  eyebrow,
  intro,
  count,
  className,
}: PracticeHeroProps) {
  return (
    <Reveal as="header" className={cn(s.hero, className)}>
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
    </Reveal>
  )
}
