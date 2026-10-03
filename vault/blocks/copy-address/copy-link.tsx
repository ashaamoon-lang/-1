'use client'

/**
 * CopyLink — a link to one section of this page, put on the clipboard.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A case study is read by more than one person before anyone commissions
 * anything, and what one reader wants another to see is usually one part of
 * it — the arc, the outcome — not the whole page. This copies the page's own
 * address with the section the reader is in (`#outcome`), worked out at the
 * moment of the press, so the colleague who opens it lands where it was sent
 * from. It is `CopyAddress`'s sibling: the same chip, status and stamp
 * (`copy-address.module.css`, `useClipboard`, `vault/motion/stamp`), and like
 * it, it renders nothing where it could not work — without script, the
 * spine's own rows are plain links whose address can be copied by hand.
 *
 * The moment, `section-link`, is the stamp a landed copy gets.
 */

import cn from 'clsx'

import { Stamp } from '@/vault/motion/stamp'

import { useClipboard } from './use-clipboard'

import s from './copy-address.module.css'

interface CopyLinkProps {
  /** The section's id — the part of the address after `#`. */
  hash: string
  /** Already localized — "Copy section link". */
  label: string
  /** Already localized — what the status says once the link is copied. */
  copied: string
  /** Already localized — what the status says when the browser refuses. */
  failed: string
  className?: string | undefined
}

export function CopyLink({
  hash,
  label,
  copied,
  failed,
  className,
}: CopyLinkProps) {
  const { writable, state, landed, copy } = useClipboard()

  if (!writable) return null

  const link = () =>
    `${window.location.origin}${window.location.pathname}#${hash}`

  return (
    <div data-epic="section-link" className={cn(s.copy, className)}>
      <button
        type="button"
        className={cn('caption', s.button)}
        onClick={() => void copy(link())}
        // `MOTION-SPEC.md` §9 — a chip: INTENT and COMMIT, like the filters.
        data-press="chip"
        data-intent=""
      >
        {label}
      </button>
      <span role="status" className={cn('caption', s.status)}>
        {state === 'copied' && <Stamp key={landed}>{copied}</Stamp>}
        {state === 'failed' && failed}
      </span>
    </div>
  )
}
