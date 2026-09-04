import cn from 'clsx'
import type { ReactNode } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import { SectionHeader } from '@/components/ui/section-header'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { Reveal } from '@/vault/motion/reveal'

import s from './studio-note.module.css'

/**
 * StudioNote — the About / Philosophy section.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Server Component, deliberately
 *
 * No `'use client'`. The body is Portable Text rendered by
 * `integrations/sanity/components/rich-text`, which reads the locale from
 * `next/root-params` and is therefore server-only. Making this a client
 * component would force the caller to render the rich text elsewhere and pass
 * it down, which is prop drilling around a constraint that costs nothing to
 * respect.
 *
 * That used to mean no scroll reveal here — `useReveal` is a client hook —
 * and the argument was that a paragraph of prose does not need to fade in to
 * be taken seriously. True on its own, and wrong in context: Tahap 14's
 * coverage gate measured `/en` and found four of eight headings arriving
 * with no entrance while the four beside them faded in. Half a page animating
 * reads as unfinished, not as restraint.
 *
 * `vault/motion/reveal` resolves it without giving up the Server Component:
 * children cross the boundary as a prop, so this file still renders on the
 * server and only the container is client code.
 *
 * ## Layout
 *
 * Text and portrait sit in a two-column grid on desktop and stack on mobile,
 * with the text first in both — the statement is the content, the portrait is
 * support. Reversing that on mobile (image first) is the reflex, and it puts
 * a decorative photo between the reader and the only thing this section says.
 */
interface StudioNoteProps {
  id: string
  /**
   * Optional, for the same reason `components/ui/section-header` makes it
   * optional: an eyebrow carries information or it is not there. The home
   * page drops it — see the note at its call site.
   */
  eyebrow?: ReactNode | undefined
  title: ReactNode
  /** The statement. Portable Text from the CMS, or plain paragraphs. */
  children: ReactNode
  /** Straight off the query; narrowed with `toImageSource` at render. */
  portrait?:
    | (ImageSource & { alt?: unknown; media?: unknown; _type?: string })
    | null
    | undefined
  /** Describes the photograph. Required whenever a portrait is passed. */
  portraitAlt?: string | undefined
  className?: string | undefined
}

export function StudioNote({
  id,
  eyebrow,
  title,
  children,
  portrait,
  portraitAlt,
  className,
}: StudioNoteProps) {
  return (
    <section
      id={id}
      className={cn(s.section, className)}
      data-has-portrait={portrait ? '' : undefined}
    >
      <SectionHeader
        reveal
        eyebrow={eyebrow}
        title={title}
        className={s.header}
      />

      <Reveal className={s.body}>
        <div data-reveal-item className={s.prose}>
          {children}
        </div>

        {portrait && (
          <figure data-reveal-item className={s.figure}>
            <div className={s.media}>
              <SanityImage
                image={toImageSource(portrait)}
                alt={portraitAlt ?? ''}
                maxWidth={704}
                className={s.image}
              />
            </div>
          </figure>
        )}
      </Reveal>
    </section>
  )
}
