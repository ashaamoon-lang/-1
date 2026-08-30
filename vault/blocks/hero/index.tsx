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
  className?: string | undefined
}

export function Hero({ headline, subline, action, className }: HeroProps) {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className={cn(s.hero, className)}>
      <div className={s.background}>
        <SceneShell />
      </div>

      <div ref={ref} className={s.content}>
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
    </section>
  )
}
