'use client'

/**
 * CopyAddress — the studio's address, put on the clipboard as well as opened.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The contact block's one action is a `mailto:` link, and for a reader whose
 * mail lives in a browser tab that link does nothing: no client opens, and
 * nothing says it failed. The page's only way to start a conversation breaks
 * silently at the one moment it is used. This is the other half of the same
 * action — the same address, copied — so the way in holds for every reader,
 * not only the ones with a mail client set up.
 *
 * ## Only where it can work
 *
 * Copying needs script and the asynchronous clipboard. Without either there is
 * no button at all: REST is the address, readable and selectable, which is what
 * `MOTION-SPEC.md` §9.4 rule 4 asks a page without script to be. `useClipboard`
 * reads the capability the way `lib/hooks/use-sync-external.ts` reads a fine
 * pointer —
 * `false` on the server, promoted on hydration — so the server and the first
 * client render agree, and the button arrives in a block far below the fold,
 * where its arrival moves nothing a reader is looking at.
 *
 * ## Saying what happened
 *
 * The outcome goes into a `role="status"` region that is always present, so a
 * screen reader hears what a sighted reader sees. A refusal — a browser that
 * will not write to the clipboard — points at the address above, which can
 * always be selected by hand.
 *
 * The button is a `chip` in the interaction grammar (`MOTION-SPEC.md` §9):
 * INTENT firms its border and underlines it, COMMIT is the shared `:active`
 * compression in `global.css`.
 *
 * The moment, `address-copy`, is `Stamp`'s: each copy that lands is stamped —
 * the frame comes down onto the sheet and the word appears on contact — and a
 * second copy stamps again. It spends nothing at load; it moves when pressed.
 */

import cn from 'clsx'

import { Stamp } from '@/vault/motion/stamp'

import { useClipboard } from './use-clipboard'

import s from './copy-address.module.css'

interface CopyAddressProps {
  address: string
  /** Already localized — "Copy address". */
  label: string
  /** Already localized — what the status says once the address is copied. */
  copied: string
  /** Already localized — what the status says when the browser refuses. */
  failed: string
  className?: string | undefined
}

export function CopyAddress({
  address,
  label,
  copied,
  failed,
  className,
}: CopyAddressProps) {
  const { writable, state, landed, copy } = useClipboard()

  if (!writable) return null

  return (
    <div data-epic="address-copy" className={cn(s.copy, className)}>
      <button
        type="button"
        className={cn('caption', s.button)}
        onClick={() => void copy(address)}
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
