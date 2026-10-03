import cn from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

import { SanityImage } from '@/components/ui/sanity-image'
import {
  type ImageSource,
  toImageSource,
} from '@/lib/integrations/sanity/utils/image'
import { PixelImage } from '@/vault/magic/pixel-image'
import { Reveal } from '@/vault/motion/reveal'

import { NextProjectLink } from './link'

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
 *
 * ## The cover travels
 *
 * Pressing it carries the cover into the next project's hero — the same
 * `morph` pair card → hero uses, named only at the press (`./link`).
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
    /*
     * Revealed by hand.
     *
     * `e2e/reveal-coverage.e2e.ts` (deleted in the fork) walked headings, and
     * this block has none:
     * its title is a `<span>` inside the link so the link's accessible name is
     * the work's title alone (see the note below). It is still a full-width
     * block that arrives as the reader reaches the end of a project page, so
     * it gets the same entrance as everything else.
     */
    <Reveal as="aside" className={cn(s.next, className)}>
      {/*
        The link is a client island — `./link` — because its cover is named
        for the morph at the press, not at render; the reason is in that
        file. What it carries is still rendered here, on the server.
      */}
      <NextProjectLink
        slug={slug}
        className={s.link}
        mediaClassName={s.media}
        media={
          cover ? (
            <>
              <SanityImage
                image={toImageSource(cover)}
                alt=""
                maxWidth={840}
                className={s.image}
                data-intent=""
                sizes="(max-width: 799px) 100vw, 58vw"
              />
              {/*
                The next work assembles rather than fades — Tahap 63.

                This is one of only two image surfaces on the site that carry no
                WebGL material layer (the other is `studio-note`), which is why
                the veil belongs here and not on a catalogue cover: a plate
                already running `MaterialImage` would be two reveals arguing over
                one object.

                `--pixel-ground` is `--surface-2` because that is what `.media`
                paints while the asset is arriving, so an undissolved tile is
                indistinguishable from the empty box rather than announcing
                itself against it. Same reasoning as `project-gallery`.

                The dissolve keys off the ancestor `<Link data-reveal-item>`
                turning `visible`, so it is already inside this block's entrance
                rather than a second, competing one.
              */}
              <PixelImage className={s.pixels} />
              {/* No script, no veil — the fork; the reason is in `project-gallery`. */}
              <noscript>
                <style
                  // oxlint-disable-next-line react/no-danger -- a static, self-authored rule whose only interpolation is this module's own hashed class name, a build-time constant
                  dangerouslySetInnerHTML={{
                    __html: `.${s.pixels}{display:none!important}`,
                  }}
                />
              </noscript>
            </>
          ) : null
        }
      >
        <span className={s.text}>
          <span className={cn('caption', s.eyebrow)}>{eyebrow}</span>
          {/*
            The heading lives inside the link, so the link's accessible name is
            the work's title rather than the eyebrow plus the title plus an
            image description. The cover is `aria-hidden` and its `alt` empty
            for the same reason: it repeats the title, it does not add to it.
          */}
          <span
            className={cn('h1', s.title)}
            style={
              {
                '--fit-word': Math.max(
                  ...title.split(/\s+/).map((word) => Array.from(word).length)
                ),
              } as CSSProperties
            }
          >
            {title}
          </span>
        </span>
      </NextProjectLink>
    </Reveal>
  )
}
