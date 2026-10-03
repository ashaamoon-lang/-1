/**
 * ReplySlip — the perforated reply slip at the foot of a periodical's
 * article: tear here, and write back.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The journal already borrows a periodical's conventions — the opening plate
 * beside the essay, the onward link to the next entry. A periodical that
 * wanted its readers to answer printed a slip below the piece: a perforated
 * line, a few words of address, the reply already begun. This is that slip.
 * Above the perforation is the argument; below it, the reader's turn — a
 * label, the subject their letter will carry (shown, so nothing is hidden in
 * the link), and the action.
 *
 * ## No motion
 *
 * Deliberately still. The action is a press target, and checkpoint 2 showed
 * what a lift does to one (`docs/HANDOFF.md` §4.2). The perforation is a
 * drawn edge, not an animation: a slip is printed, not performed. Reduced
 * motion and no script therefore have nothing to undo.
 *
 * ## Reading it
 *
 * A labelled region: its label, the subject line, then the caller's action —
 * a standalone link, never inline in running text (checkpoint 3).
 *
 * @example
 * ```tsx
 * <ReplySlip
 *   label="Reply"
 *   subject="Re: Scope is the deliverable"
 *   action={<EngagementEnquiry href={href} label="Talk to the studio about this" />}
 * />
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './reply-slip.module.css'

interface ReplySlipProps {
  /** Names the region, and is printed as the slip's heading — "Reply". */
  label: string
  /** The subject the reader's letter will carry, shown in full. */
  subject: string
  action: ReactNode
  className?: string | undefined
  /** Declared rather than spread, for the reason `vault/motion/reveal` gives. */
  'data-epic'?: string | undefined
}

export function ReplySlip({
  label,
  subject,
  action,
  className,
  'data-epic': epic,
}: ReplySlipProps) {
  return (
    <section
      aria-label={label}
      className={cn(s.slip, className)}
      {...(epic && { 'data-epic': epic })}
    >
      <p className={cn('caption', s.label)} aria-hidden="true">
        {label}
      </p>
      <p className={cn('caption', s.subject)}>{subject}</p>
      <div className={s.action}>{action}</div>
    </section>
  )
}
