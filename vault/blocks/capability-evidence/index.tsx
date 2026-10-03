/**
 * CapabilityEvidence — the work a practice's claim rests on, set under the
 * claim.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * `/studio` says what each practice covers — "Architecture review · System
 * mapping · Technical due diligence · Decision records" — and until now left
 * the reader to take it on trust: the work that shows it was a page away, on
 * the practice's own route. This sets it under the claim, in the claim's own
 * column: every listed work of that practice, in the catalogue's order, each
 * linked to its case, with its year. Nothing is picked or ranked (`cases.ts`),
 * and a practice with no listed work gets no row at all rather than an empty
 * "Seen in".
 *
 * It renders a `dd`, the practice's second description, so the practice, what
 * it covers and where that is seen read as one entry of the band's `dl`.
 *
 * The moment, `capability-evidence`, is `Leader`'s: a line drops from the
 * note, turns to the first work, and a dot lands on it. Each work is a flex
 * item, never a run of text, and the band it sits in fades in place, so no
 * link is carried out from under a pointer (checkpoints 2 and 3,
 * `docs/HANDOFF.md` §4.2).
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { Leader } from '@/vault/motion/leader'

import type { CapabilityCase } from './cases'

import s from './capability-evidence.module.css'

interface CapabilityEvidenceProps {
  /** Already localized — "Seen in". */
  label: string
  /** The practice's works; none, or an empty list, renders nothing. */
  cases: readonly CapabilityCase[] | undefined
  className?: string | undefined
}

export function CapabilityEvidence({
  label,
  cases,
  className,
}: CapabilityEvidenceProps) {
  if (!cases || cases.length === 0) return null

  return (
    <dd
      data-epic="capability-evidence"
      className={cn('caption', s.evidence, className)}
    >
      <span className={s.label}>{label}</span>
      <Leader />
      <ul className={s.list}>
        {cases.map((work) => (
          <li key={work.id} className={s.case}>
            <Link
              href={work.href}
              className={s.name}
              data-press="nav"
              data-intent=""
            >
              {work.title}
            </Link>
            {work.year !== null && <span className={s.year}>{work.year}</span>}
          </li>
        ))}
      </ul>
    </dd>
  )
}
