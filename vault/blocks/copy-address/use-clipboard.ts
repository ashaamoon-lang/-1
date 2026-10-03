'use client'

/**
 * useClipboard — writing to the clipboard, and keeping what happened.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * Shared by the copy controls — `CopyAddress` on the home page, `CopyLink` in
 * a case study's spine — so they agree on when copying is possible at all and
 * on what a result is. The capability is read the way
 * `lib/hooks/use-sync-external.ts` reads a fine pointer: `false` on the
 * server, promoted on hydration, so a control that could not work is never
 * rendered and the server and first client render agree.
 */

import { useState, useSyncExternalStore } from 'react'

export type CopyState = 'rest' | 'copied' | 'failed'

export interface ClipboardWriter {
  /** Whether this browser can write to the clipboard here at all. */
  writable: boolean
  state: CopyState
  /** How many copies have landed — a new `key` for each, so each is stamped. */
  landed: number
  copy: (text: string) => Promise<void>
}

/**
 * Whether the clipboard can be written never changes under a page, so there is
 * nothing to subscribe to and nothing to tear down.
 */
function subscribe() {
  return () => undefined
}

/** The asynchronous clipboard exists only in a secure context. */
function canWrite(): boolean {
  return 'clipboard' in navigator
}

function cannotWriteOnServer(): boolean {
  return false
}

export function useClipboard(): ClipboardWriter {
  const writable = useSyncExternalStore(
    subscribe,
    canWrite,
    cannotWriteOnServer
  )
  const [state, setState] = useState<CopyState>('rest')
  const [landed, setLanded] = useState(0)

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
      setLanded((count) => count + 1)
    } catch {
      setState('failed')
    }
  }

  return { writable, state, landed, copy }
}
