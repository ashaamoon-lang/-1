/**
 * NextPractice — the route out of a practice page.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Same job as `vault/blocks/next-project`, and deliberately not the same
 * component: that one carries a cover image and morphs it, this one carries a
 * name and a sentence. Sharing them would mean a block that is half-empty on
 * whichever caller it was not written for.
 *
 * ## Why a circuit and not a "back to work" link
 *
 * Three practice pages with no route between them are three dead ends: a
 * reader who finishes one has to go back up to the nav to find the next.
 * Linking each to the one after it — and the last back to the first — means
 * the set can be read straight through. `lib/content/practices.ts` owns the
 * order, so the circuit closes itself and cannot drift from the list.
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { Reveal } from '@/vault/motion/reveal'

import s from './next-practice.module.css'

interface NextPracticeProps {
  /** Localized href of the practice that follows this one. */
  href: string
  /** Mono label — "Next practice". */
  eyebrow: ReactNode
  /** The next practice's name. */
  label: ReactNode
  /**
   * The noun this press speaks as (`MOTION-SPEC.md` §9) — `next-practice` by
   * default. The journal passes `next-entry`: since the fork its onward link
   * is this component rather than markup of its own.
   */
  press?: string | undefined
  /**
   * The name's scale. `h1` by default — a practice's name is the page's
   * last invitation. The journal passes `h2`: a reading room stays quieter.
   */
  size?: 'h1' | 'h2' | undefined
  className?: string | undefined
}

export function NextPractice({
  href,
  eyebrow,
  label,
  press = 'next-practice',
  size = 'h1',
  className,
}: NextPracticeProps) {
  return (
    <Reveal as="aside" className={cn(s.next, className)}>
      <Link
        data-reveal-item
        href={href}
        className={s.link}
        data-cursor="view"
        // `MOTION-SPEC.md` §9. The name below is what acknowledges hover, so
        // the marker sits there while the noun is this link.
        data-press={press}
        // Names the practice circuit in the DOM. A gate read it to prove the
        // circuit existed until the fork removed that requirement; it stays
        // as a hook, and only on the practice pages' own link.
        {...(press === 'next-practice' && { 'data-next-practice': '' })}
      >
        <span className={cn('caption', s.eyebrow)}>{eyebrow}</span>
        <span data-intent="" className={cn(size, s.label)}>
          {label}
        </span>
      </Link>
    </Reveal>
  )
}
