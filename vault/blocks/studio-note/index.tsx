import cn from 'clsx'
import type { ReactNode } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import { SectionHeader } from '@/components/ui/section-header'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'

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
 * The consequence: no scroll reveal here. `useReveal` is a client hook, and
 * the section reads perfectly without an entrance — a paragraph of prose does
 * not need to fade in to be taken seriously. `ProjectGrid` is where the
 * staggered entrance earns its place, because a grid of cards arriving at
 * once looks like a page dump.
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
  eyebrow: ReactNode
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
    <section id={id} className={cn(s.section, className)}>
      <SectionHeader eyebrow={eyebrow} title={title} className={s.header} />

      <div className={s.body}>
        <div className={s.prose}>{children}</div>

        {portrait && (
          <figure className={s.figure}>
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
      </div>
    </section>
  )
}
