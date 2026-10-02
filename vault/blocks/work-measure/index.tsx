/**
 * WorkMeasure — a body of work, measured: how many engagements, for how many
 * clients, drawn across the years they span.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The facts are counted (`measure.ts`), never written: the caller passes the
 * localized phrase, and this block decides only how it is drawn. With two or
 * more dated years the span is a `Dimension` — the years at its ends, a mark
 * for each year with work between them, the phrase as its value. With one
 * year there is nothing to span, and with none there is nothing to place, so
 * the phrase stands as a line of text: a zero-length dimension would draw a
 * measurement the work does not have.
 *
 * Its text arrives as reveal items, so it joins the sequence of whatever
 * `Reveal` it sits in; outside one, it is simply there.
 */

import cn from 'clsx'

import { Dimension } from '@/vault/motion/dimension'

import type { Measure } from './measure'

import s from './work-measure.module.css'

interface WorkMeasureProps {
  measure: Measure
  /** Localized and already counted — "6 engagements for 5 clients". */
  value: string
  className?: string | undefined
}

export function WorkMeasure({ measure, value, className }: WorkMeasureProps) {
  const { from, to, marks } = measure

  if (from !== null && to !== null && from < to)
    return (
      <Dimension
        data-epic="work-measure"
        from={String(from)}
        to={String(to)}
        marks={marks}
        className={cn('caption', s.measure, className)}
      >
        {value}
      </Dimension>
    )

  return (
    <p data-reveal-item="" className={cn('caption', s.measure, className)}>
      {value}
      {from !== null && (
        <>
          <span aria-hidden="true"> · </span>
          <span className={s.year}>{from}</span>
        </>
      )}
    </p>
  )
}
