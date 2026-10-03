'use client'

/**
 * The next-project link, and the press that arms its cover for the morph.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why the name waits for the press
 *
 * The next project's hero is named `transitionName(slug)` on its own page,
 * the same name its catalogue card carries, which is how card → hero morphs.
 * Naming this cover too would pair it with that hero — and also with the
 * card, so leaving a case study for the catalogue would carry *two* covers
 * into the grid: this page's hero to its card, and this cover to the next
 * one's. That is why the morph sat under *Ditunda* in `docs/HANDOFF.md` §4.1.
 *
 * So the name is given at COMMIT, the press, not at render — the moment the
 * reader has chosen this link and no other. It is taken back if the press
 * does not become a navigation here: on blur, on a cancelled pointer, or when
 * the pointer leaves before releasing. A modified click (new tab, new window)
 * never arms it, because no transition happens in this document.
 *
 * `<ViewTransition>` is always rendered, with `default="none"`, and only the
 * name and `share` change — the pattern `vault/blocks/project-hero` uses — so
 * arming never remounts the cover or restarts its veil. The pair is in the
 * `morph` class, so it moves exactly as card → hero does, and reduced motion
 * is handled where that class is (`lib/styles/css/global.css`).
 */

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useState,
  ViewTransition,
} from 'react'

import { Link } from '@/components/ui/link'
import { transitionName } from '@/lib/motion/transition-name'

interface NextProjectLinkProps {
  slug: string
  className?: string | undefined
  mediaClassName?: string | undefined
  /** The cover, rendered by the server and handed in; `null` when none. */
  media: ReactNode
  children: ReactNode
}

export function NextProjectLink({
  slug,
  className,
  mediaClassName,
  media,
  children,
}: NextProjectLinkProps) {
  const [armed, setArmed] = useState(false)

  const arm = (event: PointerEvent<HTMLAnchorElement>) => {
    const plain =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    if (plain) setArmed(true)
  }
  const armByKey = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter') setArmed(true)
  }
  const disarm = () => setArmed(false)

  return (
    <Link
      data-reveal-item
      // A template — `components/ui/link` applies the locale prefix.
      href={`/work/${slug}`}
      className={className}
      data-cursor="view"
      // `MOTION-SPEC.md` §9. The image is `aria-hidden` decoration, so the
      // acknowledgment is marked on it while the noun is this link.
      data-press="next"
      onPointerDown={arm}
      onKeyDown={armByKey}
      onPointerCancel={disarm}
      onPointerLeave={disarm}
      onBlur={disarm}
    >
      {media ? (
        <ViewTransition
          default="none"
          {...(armed && {
            name: transitionName(slug),
            share: 'morph' as const,
          })}
        >
          <div className={mediaClassName} aria-hidden="true">
            {media}
          </div>
        </ViewTransition>
      ) : null}
      {children}
    </Link>
  )
}
