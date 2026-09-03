'use client'

/**
 * StepSequence — an ordered passage read against a label that holds.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on GSAP ScrollTrigger (see `docs/PROVENANCE.md` §2 on GSAP licensing)
 * and CSS `position: sticky`.
 *
 * ## What it is, and the measurement that produced it
 *
 * Tahap 24 shipped the studio page's "how we work" section as a sticky label
 * beside four steps. The sticky worked exactly as CSS says it should —
 * measured pinned at its offset, 146px, and holding. What it did not do is
 * *last*: the section was 580px tall in a 900px viewport, so the pin held for
 * roughly 200px of scroll and was over before a reader could register that
 * anything had been held.
 *
 * That is the same class of defect as Tahap 21's material layer, which moved
 * correctly and was never met. A held note that resolves inside one screen is
 * not held; it is a coincidence.
 *
 * So two things changed together, and neither works without the other:
 *
 * 1. **The section is given real height** — each step occupies most of a
 *    screen, so the pin outlasts the viewport several times over.
 * 2. **The label is given something to do** — it reports which step is being
 *    read, and the others recede.
 *
 * The second is what makes the first worth its length. A label pinned for
 * three screens saying one unchanging word is worse than no pin at all.
 *
 * ## Why the index is information rather than decoration
 *
 * "Where am I in this sequence" is the only question an ordered passage
 * raises that has an answer, and a reader three screens into a numbered list
 * genuinely cannot see the numbers they have passed. The counter answers it.
 * `docs/stages/TAHAP-25.md` §3.1 records the reasoning; the project's rule
 * against numbered markers on unordered lists is the same rule stated from
 * the other side.
 *
 * ## Accessibility
 *
 * The counter and the active title are `aria-hidden`: they are a second view
 * of an `<ol>` that already carries its own order, and announcing "01 / 04,
 * Scope" alongside the list item that says exactly that is duplication, not
 * assistance. The section's own label stays in the tree.
 *
 * Under `prefers-reduced-motion` no trigger is created, nothing recedes, and
 * the counter stands at the first step — every step ends **fully visible and
 * fully opaque**, which the stylesheet enforces rather than leaving to this
 * component's state.
 *
 * @example
 * ```tsx
 * <StepSequence
 *   label={t('processEyebrow')}
 *   steps={steps.map((key) => ({
 *     key,
 *     title: t(`process.${key}Title`),
 *     body: t(`process.${key}Body`),
 *   }))}
 * />
 * ```
 */

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import s from './step-sequence.module.css'

// Registered here as well as in `components/effects/gsap.tsx` so this block is
// correct even when it renders before that bridge is dynamically imported.
// `registerPlugin` is idempotent.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export interface Step {
  /** Stable key. Also the translation key the consumer read it from. */
  key: string
  title: string
  body: string
}

interface StepSequenceProps {
  /** The section's own label — stays in the accessibility tree. */
  label: string
  steps: readonly Step[]
  className?: string | undefined
}

/** `1` → `01`. Two digits, because four steps never need three. */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function StepSequence({ label, steps, className }: StepSequenceProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      /*
       * Read from `matchMedia` as well as the hook, for the reason
       * `vault/motion/text-reveal` records: the hook's *server* snapshot is
       * `false`, so the first commit — the one this effect runs in — sees
       * `false` even for a reader who has the preference on. Inside an effect
       * we are on the client and `matchMedia` is truthful now.
       */
      const reduced =
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (reduced) return

      const items = [...root.querySelectorAll('[data-step]')]
      if (items.length === 0) return

      /*
       * One trigger per step, reporting on entry in either direction.
       *
       * `top 60%` → `bottom 40%` is the middle band of the viewport: a step
       * becomes "the one being read" when it reaches the place a reader's eye
       * actually sits, not when its first pixel appears at the bottom of the
       * screen. Scrolling back up re-reports through `onEnterBack`, so the
       * counter is correct in both directions rather than only on the way
       * down.
       */
      const triggers = items.map((item, index) =>
        ScrollTrigger.create({
          trigger: item,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => setActive(index),
          onEnterBack: () => setActive(index),
        })
      )

      return () => {
        for (const trigger of triggers) trigger.kill()
      }
    },
    { scope: rootRef, dependencies: [prefersReducedMotion, steps.length] }
  )

  const current = steps[active]

  return (
    <section
      ref={rootRef}
      // Read by `e2e/motion.e2e.ts`, which measures how long the pin holds.
      data-step-sequence=""
      className={cn(s.sequence, className)}
    >
      <div className={s.column}>
        <div
          className={s.held}
          // The gate reads this to prove the index actually moves. It sits on
          // the pinned element so the same query answers both questions.
          data-step-index={pad(active + 1)}
        >
          <p className={cn('caption', s.label)}>{label}</p>

          {/*
            A second view of the list below, so assistive tech is spared it —
            the `<ol>` already carries the order, and announcing "01 / 04,
            Scope" next to the item that says exactly that is duplication.
          */}
          <p className={s.counter} aria-hidden="true">
            <span className={s.current}>{pad(active + 1)}</span>
            <span className={s.total}>/ {pad(steps.length)}</span>
          </p>
          <p className={cn('caption', s.activeTitle)} aria-hidden="true">
            {current?.title}
          </p>
        </div>
      </div>

      <ol className={s.steps}>
        {steps.map((step, index) => (
          <li
            key={step.key}
            data-step=""
            /*
             * Presence, not a boolean string: `data-active=""` is what CSS
             * matches on, and an absent attribute is the off state. A
             * `data-active="false"` would still match `[data-active]`.
             */
            {...(index === active && { 'data-active': '' })}
            className={s.step}
          >
            <p className={cn('caption', s.number)} aria-hidden="true">
              {pad(index + 1)}
            </p>
            <h3 className={cn('h3', s.title)}>{step.title}</h3>
            <p className={s.body}>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
