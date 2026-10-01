'use client'

/**
 * CapabilitySet — what a practice covers, read one statement at a time.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on GSAP ScrollTrigger (see `docs/PROVENANCE.md` §2 on GSAP licensing)
 * and CSS `position: sticky`.
 *
 * ## The subject this block was built for had been sitting in the dictionary
 *
 * `docs/stages/TAHAP-52.md` §2.1 refused to build "capabilities as a pinned
 * sequence" and gave the right reason for the page it was looking at:
 * `/practice/<value>` has no capability list. What it did not check is that
 * `messages/{en,id}.json` has carried one since Tahap 24 —
 * `studio.capabilities.<practice>`, twelve items across three lines, rendered
 * on `/studio` as three lines of `caption` and nowhere else.
 *
 * So this block invents nothing. It takes information the site already
 * publishes and gives it the shape the information actually has: a set, not a
 * sentence.
 *
 * ## Why it is not `vault/blocks/step-sequence`
 *
 * That block is the near neighbour — a held label, items that recede, the
 * same hook underneath — and reusing it would have been one import. It ships
 * a `01 / 04` counter, and its own doc records the rule that makes the
 * counter right there and wrong here: numbered markers belong to lists whose
 * order carries information. A studio's process is ordered; scoping
 * constrains what can be decided. "Architecture review" and "Decision
 * records" are not a sequence, and numbering them would assert a progression
 * that does not exist.
 *
 * What *is* shared is the mechanism: `vault/motion/use-active-in-sequence`,
 * the same hook, because "which one is being read" is a question this project
 * answers in one place.
 *
 * ## Why the items are the largest type on the screen
 *
 * A capability is two or three words. Given a step's layout — small title,
 * paragraph of body — four of them would be four mostly-empty screens. So the
 * proportions invert: the item *is* the display type, and the pinned column
 * that carries the section's label is the small print. The reader moves
 * through four full-scale statements instead of scanning a dot-separated run
 * of them.
 *
 * ## What the pinned column does, since a pin that says one word is not held
 *
 * `step-sequence` records the failure this avoids: a label pinned for three
 * screens saying one unchanging word is worse than no pin at all. The column
 * therefore echoes the item being read, `aria-hidden` because the list below
 * already says it. That echo is the only thing in the column that *can*
 * change here — the alternative signal, a numeral, is the one this block
 * exists to refuse.
 *
 * ## Accessibility
 *
 * A `<ul>`, because the set is unordered, and the browser announces it as
 * one. The echo in the pinned column is hidden from assistive tech for the
 * same reason `step-sequence` hides its counter: it is a second view of the
 * list, not a second piece of information.
 *
 * Under `prefers-reduced-motion` no trigger is created, nothing recedes, and
 * the section collapses to its natural height — the stylesheet promises all
 * three, because the component's state cannot (`CLAUDE.md` #5).
 *
 * @example
 * ```tsx
 * <CapabilitySet
 *   label={t('capabilitiesEyebrow')}
 *   items={capabilityItems(t(`capabilities.${value}`))}
 *   data-epic="practice-capabilities"
 * />
 * ```
 */

import cn from 'clsx'
import { useRef } from 'react'

import { useActiveInSequence } from '@/vault/motion/use-active-in-sequence'

import s from './capability-set.module.css'

interface CapabilitySetProps {
  /** The eyebrow that names the section — it holds while the items pass. */
  label: string
  /**
   * The capabilities, already split.
   *
   * Strings rather than `{ key, label }` objects: a capability has no body,
   * no href and no id, and the labels are unique within a practice, so the
   * label is the key. Inventing a second field to hold a copy of the first is
   * the shape `step-sequence` needs and this one does not.
   */
  items: readonly string[]
  /** The choreographed moment this belongs to, `MOTION-SPEC.md` §9.5. */
  'data-epic'?: string
  className?: string | undefined
}

export function CapabilitySet({
  label,
  items,
  'data-epic': epic,
  className,
}: CapabilitySetProps) {
  const rootRef = useRef<HTMLElement>(null)

  const active = useActiveInSequence(rootRef, '[data-capability]', items.length)

  const current = items[active]

  return (
    <section
      ref={rootRef}
      // Read by `e2e/practice-capabilities.e2e.ts`, which measures that the
      // column holds and that the lead actually moves between items.
      data-capability-set=""
      {...(epic && { 'data-epic': epic })}
      className={cn(s.set, className)}
    >
      <div className={s.column}>
        <div
          className={s.held}
          // The gate reads this to prove the lead moves. It sits on the
          // sticky element so one query answers both questions.
          data-capability-active={String(active)}
        >
          <p className={cn('caption', s.label)}>{label}</p>
          <p className={cn('caption', s.echo)} aria-hidden="true">
            {current}
          </p>
        </div>
      </div>

      <ul className={s.items}>
        {items.map((item, index) => (
          <li
            key={item}
            data-capability=""
            /*
             * Presence, not a boolean string — `data-active=""` is what CSS
             * matches and an absent attribute is the off state. A
             * `data-active="false"` would still match `[data-active]`.
             */
            {...(index === active && { 'data-active': '' })}
            className={s.item}
          >
            <p className={cn('h2', s.statement)}>{item}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
