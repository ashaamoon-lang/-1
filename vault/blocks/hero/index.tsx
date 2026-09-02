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
 * | Cue | slot | says the page continues; not a control |
 *
 * ## The frame, and why it is not centred
 *
 * The three text elements sit on a diagonal: the index in the top right, the
 * headline and its action at the bottom left, the cue in the bottom right.
 * That is a composition. The previous arrangement — everything centred in a
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
  /**
   * The cue that the page continues below.
   *
   * `ui-ux-pro-max`'s `hero-centric-design` pattern is explicit about it:
   * let the hero dominate the first screen **without hiding the next content
   * cue**. This hero dominated 900px of a 5749px document and said nothing
   * about the rest.
   *
   * Deliberately not a control. The call to action is the interactive path;
   * a second clickable thing in the same corner would add a noun to the
   * interaction grammar and buy nothing.
   *
   * A label; the rule beneath it is the block's own.
   */
  cue?: string | undefined
  className?: string | undefined
}

export function Hero({
  headline,
  subline,
  action,
  index,
  cue,
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

        {cue && (
          /*
           * `aria-hidden`, and that is the right call rather than laziness.
           *
           * A screen-reader user does not need to be told the page scrolls,
           * and the word would be read as content between the call to action
           * and the first section. The information it carries is spatial, and
           * it is already carried by the document order.
           */
          <div data-reveal-item className={s.cue} aria-hidden="true">
            <p className={cn('caption', s.cueLabel)}>
              {cue}
              <span className={s.cueRule} />
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
