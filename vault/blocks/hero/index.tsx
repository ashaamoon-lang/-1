'use client'

/**
 * Hero — the first screen, and the one that decides whether a visitor
 * believes the studio is expensive.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Composes this project's own vault primitives over Satūs's canvas system.
 *
 * ## The composition, and why each part is here
 *
 * | Layer | Component | Purpose |
 * |---|---|---|
 * | Background | `SceneShell` | WebGL accent, with a DOM gradient fallback |
 * | Headline | `TextReveal` | line-by-line masked rise — the premium reveal |
 * | Action | `Magnetic` | pointer attraction on the single CTA |
 * | Index | slot | a standing fact, in the columns the headline leaves |
 *
 * ## Where the scroll cue went — Tahap 34
 *
 * There was a fourth slot here: a `Scroll` label with a 1px rule under it,
 * bottom right. It was added in Tahap 12 for a measured reason —
 * `ui-ux-pro-max`'s `hero-centric-design` pattern says to let the hero
 * dominate the first screen *without hiding the next-content cue*, and this
 * hero dominated 900px of a 5749px document while saying nothing about the
 * rest.
 *
 * `taste-skill` SKILL.md section 14 bans scroll cues outright, as an AI tell.
 * Two vendored skills, opposite instructions, so the tie is broken on which
 * one is right about *this* page rather than on which arrived later.
 *
 * Both are. The problem Tahap 12 measured is real and the word is the tell.
 * A label is a weak way to say "there is more below"; the strong way is for
 * there to visibly be more below. So the hero gives up 12svh and the next
 * section's top edge now sits inside the first screen. The affordance is
 * kept, in a form that carries no copy, needs no `aria-hidden`, and adds no
 * element to the hero stack — which SKILL.md section 4.7 caps at four.
 *
 * ## The frame, and why it is not centred
 *
 * The text elements sit on a diagonal: the index in the top right, the
 * headline and its action at the bottom left. That is a composition. The previous arrangement — everything centred in a
 * column down the left — was not: it was one element's natural width three
 * times over, with the vertical position decided by `align-items: center`.
 * `docs/stages/TAHAP-12.md` §3.1 has the measurement it came from.
 *
 * ## Choreography
 *
 * The eyeline order is headline → subline → action, and the timing follows
 * it. The subline and CTA are revealed by the CSS `[data-reveal]` contract
 * with a stagger, rather than by a second GSAP timeline — one animation
 * system per block keeps the sequencing legible and avoids a second RAF
 * consumer for what is a fade.
 *
 * Total entrance stays under ~1.2s (`MOTION-SPEC.md` §3): a hero that takes
 * longer than that to settle is not dramatic, it is slow.
 *
 * ## Accessibility
 *
 * - One `<h1>` per page, and it is this one.
 * - The WebGL background is `aria-hidden` decoration and carries no meaning.
 * - Under reduced motion the headline renders as plain text, the reveals
 *   resolve instantly, the magnet is inert, and the background falls back to
 *   a static gradient. The hero is fully legible in every one of those paths.
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import { useReveal } from '@/lib/hooks/use-reveal'
import { TextReveal } from '@/vault/motion/text-reveal'
import { Magnetic } from '@/vault/primitives/magnetic'
import { SceneShell } from '@/vault/webgl/scene-shell'

import s from './hero.module.css'

interface HeroProps {
  /**
   * The headline. A plain string, because `TextReveal` hands the text to
   * SplitText, which takes ownership of the rendered text nodes.
   */
  headline: string
  /** Short supporting line. One sentence — a hero is not a paragraph. */
  subline?: string | undefined
  /** The single call to action. One, not three. */
  action?: ReactNode | undefined
  /**
   * A short standing fact about the practice, set in the columns the
   * headline does not use.
   *
   * Measured before this existed: the headline ran to 75% of the viewport,
   * the subline to 26% and the action to 12% — a staircase down the left
   * edge with nothing at all on the right, and 456px of ink in a 900px
   * screen (`docs/stages/TAHAP-12.md` §3.1). The emptiness was not a
   * composition, it was `align-items: center` and no second element.
   *
   * Keep it to a label and a few lines. It is a counterweight, not a column
   * of copy.
   *
   * Structured rather than a `ReactNode` slot: the block owns the markup and
   * the classes, the page owns the words. A slot would put the typography of
   * the hero in `page.tsx`, which is where the hardcoded values this project
   * spent Tahap 11 removing came from in the first place.
   */
  index?: { label: string; items: readonly string[] } | undefined
  className?: string | undefined
}

export function Hero({
  headline,
  subline,
  action,
  index,
  className,
}: HeroProps) {
  const ref = useReveal<HTMLDivElement>()

  return (
    /*
     * `data-epic` names one of the two choreographed moments a page is
     * allowed (`MOTION-SPEC.md` §9.5). The requirement is that both are
     * *named*; naming them in the DOM is what makes it checkable, and it
     * means `e2e/interaction-grammar.e2e.ts` can say which moment overspent
     * instead of pointing at an anonymous element.
     */
    <section className={cn(s.hero, className)} data-epic="hero-arrival">
      <div className={s.background}>
        <SceneShell />
      </div>

      <div ref={ref} className={s.frame}>
        {index && (
          <div data-reveal-item className={s.index}>
            <p className={cn('caption', s.indexLabel)}>{index.label}</p>
            <ul className={cn('caption', s.indexList)}>
              {index.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={s.content}>
          <TextReveal as="h1" split="lines" className={cn('h1', s.headline)}>
            {headline}
          </TextReveal>

          {subline && (
            <p data-reveal-item className={s.subline}>
              {subline}
            </p>
          )}

          {action && (
            <div data-reveal-item className={s.action}>
              <Magnetic>{action}</Magnetic>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
