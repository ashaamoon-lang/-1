/**
 * CatalogueFrame — the work, read by the structure that carries it.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## What it is for
 *
 * The catalogue's grid shows the surface of each work: its cover, its title.
 * It cannot show the frame behind them — which practice carried which work,
 * and when — and that is the question a client weighing an agency asks
 * first: has this kind of work been done here, more than once, recently? A
 * table answers it by position. Practices are rows, years are columns, and
 * each work sits in its bay, so the reader compares across practices and
 * across time at a glance, and goes from a row to the page about its
 * practice.
 *
 * Every fact is one the catalogue already fetched (`projectCardFields`); the
 * frame rearranges, it does not add. `buildFrame` places the works and
 * leaves a bay empty where there is no work in it.
 *
 * ## How it moves
 *
 * `vault/motion/bearing`: posts and beams first, then each work lands in its
 * bay and settles under its own weight. The table is complete in the server
 * HTML, so with no script — or reduced motion — the frame is simply there.
 *
 * `FrameReader` aims a crosshair at the work in hand and, for a work with a
 * `cover`, carries the cover beside it (`vault/motion/cover-preview`).
 *
 * ## Why a table
 *
 * Because it is one: two axes and a value at each crossing. Headers carry
 * `scope`, the table is named by the section's heading and described by its
 * sentence, and a screen reader announces "Consulting, 2025" on entering a
 * bay. The carried items are links, not paragraphs or list items, so nothing
 * here is prose that moves.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { Bearing } from '@/vault/motion/bearing'
import { PreviewCover } from '@/vault/motion/cover-preview'

import type { Frame } from './frame'
import { FrameReader } from './reader'

import s from './catalogue-frame.module.css'

/*
 * The widest the cover plate is laid out: two fifths of a bay at the widest
 * desktop (`reader.tsx`, `PLATE_SHARE`), rounded up.
 */
const PREVIEW_WIDTH = 240

interface CatalogueFrameProps<P extends string> {
  frame: Frame<P>
  /** The section heading — also the table's accessible name. */
  title: string
  /** One sentence on what the frame shows — the table's description. */
  intro: string
  /** Header of the column that names the practices. */
  practiceLabel: string
  /** Header of the column for works with no year. */
  undatedLabel: string
  /** Name of the row for works with no practice the site names. */
  unplacedLabel: string
  /** Already localized — "Arrow keys move between works." */
  keysHint: string
  /**
   * A practice's label, and the locale-free route to the page about it.
   *
   * A function rather than a map, so the caller derives both from its own
   * list of practices instead of restating it. This is a Server Component,
   * so the function never crosses into client code.
   */
  practiceLink: (practice: P) => { label: string; href: string }
  /** Base for the heading and description ids; one frame per page. */
  id?: string | undefined
  className?: string | undefined
}

export function CatalogueFrame<P extends string>({
  frame,
  title,
  intro,
  practiceLabel,
  undatedLabel,
  unplacedLabel,
  keysHint,
  practiceLink,
  id = 'catalogue-frame',
  className,
}: CatalogueFrameProps<P>) {
  const headingId = `${id}-title`
  const introId = `${id}-intro`
  const keysId = `${id}-keys`

  /*
   * The covers for the plate beside the work in hand — Tata & Gerak, stage 3.
   * `alt=""`: the plate is decoration, and the link already names the work.
   */
  const covers = frame.rows
    .flatMap((row) => row.bays.flat())
    .flatMap((work) =>
      work.cover
        ? [
            <PreviewCover key={work.id} id={work.id}>
              <SanityImage image={work.cover} alt="" maxWidth={PREVIEW_WIDTH} />
            </PreviewCover>,
          ]
        : []
    )

  return (
    <section
      className={cn(s.frame, className)}
      aria-labelledby={headingId}
      data-epic="catalogue-frame"
    >
      <h2 id={headingId} className={cn('h2', s.title)}>
        {title}
      </h2>
      <p id={introId} className={s.intro}>
        {intro}
      </p>
      {/*
        How to read it from the keyboard — stage 2 of Orientasi. Said once,
        and tied to the table so a screen reader hears it with the frame.
      */}
      <p id={keysId} className={cn('caption', s.keys)}>
        {keysHint}
      </p>

      <Bearing className={s.bearing}>
        <FrameReader covers={covers}>
          <table
            className={s.table}
            aria-labelledby={headingId}
            aria-describedby={`${introId} ${keysId}`}
          >
            <thead>
              <tr>
                <th
                  scope="col"
                  data-bearing="span"
                  className={cn('caption', s.head)}
                >
                  {practiceLabel}
                </th>
                {frame.years.map((year) => (
                  <th
                    key={year ?? 'undated'}
                    scope="col"
                    data-bearing="span post"
                    className={cn('caption', s.head)}
                  >
                    {year ?? undatedLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {frame.rows.map((row) => {
                const link =
                  row.practice === null ? null : practiceLink(row.practice)
                return (
                  <tr key={row.practice ?? 'unplaced'}>
                    <th scope="row" data-bearing="span" className={s.practice}>
                      {link === null ? (
                        <span className="caption">{unplacedLabel}</span>
                      ) : (
                        <Link
                          href={link.href}
                          className={cn('caption', s.practiceLink)}
                          data-press="nav"
                          data-intent=""
                        >
                          {link.label}
                        </Link>
                      )}
                    </th>
                    {row.bays.map((bay, column) => (
                      <td
                        key={frame.years[column] ?? 'undated'}
                        data-bearing="span post"
                        className={s.bay}
                      >
                        {bay.map((work) => (
                          <Link
                            key={work.id}
                            href={work.href}
                            className={s.work}
                            data-work-id={work.id}
                            data-reveal-item=""
                            data-bearing="load"
                            data-press="nav"
                            data-intent=""
                          >
                            <span className={s.name}>{work.title}</span>
                            {work.client && (
                              <span className={cn('caption', s.client)}>
                                {work.client}
                              </span>
                            )}
                          </Link>
                        ))}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </FrameReader>
      </Bearing>
    </section>
  )
}
