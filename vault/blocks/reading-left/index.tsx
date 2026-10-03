'use client'

/**
 * ReadingLeft — how much of the essay is left, kept with the reader.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * The essay's header says how long it takes ("6 min read"), but the header is
 * the first thing to leave the screen. This keeps the same measure with the
 * reader: a small tag under the header that says how much is left — "4 min
 * left" — counted from the paragraphs still ahead (`lib/content/reading-time`).
 * It appears once the essay has begun, changes as each paragraph rises past
 * the reading line, and leaves as soon as the essay's end is on screen: from
 * there the reader can see what is left, and the tag would only sit over the
 * reply slip and the links below.
 *
 * Two IntersectionObservers do the watching — the paragraphs against a line
 * 40% of the way down the screen, and the last paragraph against the screen's
 * foot — and each time one fires, the count is read again from where the
 * paragraphs actually are. No scroll listener and no loop. Without
 * script the tag is absent and the header's total still stands. It is
 * `aria-hidden`: it repeats for the eye what the header already says.
 */

import cn from 'clsx'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { minutesLeft } from '@/lib/content/reading-time'

import s from './reading-left.module.css'

/** The reading line, as a share of the viewport's height from the top. */
const LINE = 0.4

interface Progress {
  /** Whether the first paragraph has reached the reading line. */
  begun: boolean
  /** How many paragraphs have risen wholly above it. */
  read: number
  /** Whether the essay's last line is on screen. */
  ended: boolean
}

const NOT_BEGUN: Progress = { begun: false, read: 0, ended: false }

function progressOf(nodes: readonly Element[]): Progress {
  const line = window.innerHeight * LINE
  const first = nodes[0]
  const last = nodes.at(-1)
  return {
    begun: first ? first.getBoundingClientRect().top < line : false,
    read: nodes.filter((node) => node.getBoundingClientRect().bottom < line)
      .length,
    ended: last
      ? last.getBoundingClientRect().bottom < window.innerHeight
      : false,
  }
}

interface ReadingLeftProps {
  /** Words in each paragraph of the essay, in order. */
  words: readonly number[]
  /** Selects the essay's paragraphs, in the same order as `words`. */
  paragraphs: string
  className?: string | undefined
}

export function ReadingLeft({
  words,
  paragraphs,
  className,
}: ReadingLeftProps) {
  const t = useTranslations('journal')
  const [progress, setProgress] = useState<Progress>(NOT_BEGUN)

  useEffect(() => {
    const nodes = [...document.querySelectorAll(paragraphs)]
    if (nodes.length === 0) return

    // An observer reports every target once as soon as it starts watching,
    // so the first count needs no call of its own.
    const update = () => setProgress(progressOf(nodes))
    const reading = new IntersectionObserver(update, {
      rootMargin: `-${LINE * 100}% 0% -${(1 - LINE) * 100}% 0%`,
    })
    const ending = new IntersectionObserver(update, { threshold: [0, 1] })
    for (const node of nodes) reading.observe(node)
    const last = nodes.at(-1)
    if (last) ending.observe(last)

    return () => {
      reading.disconnect()
      ending.disconnect()
    }
  }, [paragraphs])

  const left = minutesLeft(words, progress.read)
  const shown = progress.begun && !progress.ended && left > 0

  return (
    <p
      aria-hidden="true"
      className={cn('caption', s.left, className)}
      data-reading-left=""
      {...(shown && { 'data-shown': '' })}
    >
      {left > 0 && t('readingLeft', { minutes: left })}
    </p>
  )
}
