import cn from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'

import s from './next-project.module.css'

/**
 * NextProject — the way out of a project page that is not the back button.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A detail page with no forward path asks the reader to go back and re-enter
 * the grid, and most of them simply leave instead. One large link to the next
 * work is the cheapest retention there is on a portfolio.
 *
 * ## The order is the curated one
 *
 * Which project comes next is decided by `nextProject()` in
 * `lib/content/next-project.ts`, not here: it follows the same
 * `order asc, publishedAt desc` sequence the grid uses, and wraps, so the last
 * work leads back to the first rather than dead-ending. This component only
 * renders what it is handed.
 */
interface NextProjectProps {
  eyebrow: ReactNode
  title: string
  slug: string
  /*
   * No `coverAlt`. The image here is decoration: it repeats the title that
   * sits beside it, so it is `aria-hidden` with an empty `alt`. Accepting alt
   * text would invite a caller to pass the real description and produce a link
   * announced as "Panas Sore, acrylic painting of three figures, Panas Sore".
   */
  cover?: (ImageSource & { alt?: unknown }) | null | undefined
  className?: string | undefined
}

export function NextProject({
  eyebrow,
  title,
  slug,
  cover,
  className,
}: NextProjectProps) {
  return (
    <aside className={cn(s.next, className)}>
      <Link
        // A template — `components/ui/link` applies the locale prefix.
        href={`/work/${slug}`}
        className={s.link}
        data-cursor="view"
      >
        {cover && (
          <div className={s.media} aria-hidden="true">
            <SanityImage
              image={toImageSource(cover)}
              alt=""
              maxWidth={704}
              className={s.image}
            />
          </div>
        )}
        <span className={s.text}>
          <span className={cn('caption', s.eyebrow)}>{eyebrow}</span>
          {/*
            The heading lives inside the link, so the link's accessible name is
            the work's title rather than the eyebrow plus the title plus an
            image description. The cover is `aria-hidden` and its `alt` empty
            for the same reason: it repeats the title, it does not add to it.
          */}
          <span className={cn('h2', s.title)}>{title}</span>
        </span>
      </Link>
    </aside>
  )
}
