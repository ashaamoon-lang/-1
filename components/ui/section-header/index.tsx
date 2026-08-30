import cn from 'clsx'
import type { ReactNode } from 'react'

import s from './section-header.module.css'

/**
 * SectionHeader — the mono eyebrow and title that opens every section.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## Why this is a component and not a copied pair of tags
 *
 * The eyebrow/title pair is the single most-repeated composition on a
 * portfolio site, and repeating it by hand is how a type scale drifts: one
 * section reaches for `h2`, the next for a `div` styled to look like one, and
 * six months later the page has four heading sizes. Naming it once means the
 * scale in `lib/styles/typography.ts` is the only place a size is decided.
 *
 * ## The eyebrow carries information, or it is not there
 *
 * A mono label above a heading reads as considered only when it says
 * something the heading does not — a count, a year range, a category. Used as
 * decoration it is the clearest template tell there is, which is why
 * `eyebrow` is optional rather than required with a placeholder.
 *
 * ## Heading level is a prop, deliberately
 *
 * `e2e/agent-readiness.e2e.ts` asserts the heading order never skips a level.
 * Hardcoding `<h2>` here would force every caller into one depth and make
 * that test fail the first time a section nests. The visual size is set by
 * the `.h2` type class regardless of level, so semantics and appearance stay
 * independent — which is what a heading level is for.
 */
interface SectionHeaderProps {
  title: ReactNode
  /** Short mono label above the title. Omit it rather than inventing one. */
  eyebrow?: ReactNode | undefined
  /** Trailing slot — a count, a "see all" link. Sits opposite the title. */
  aside?: ReactNode | undefined
  /** Heading level. Pick the one the document outline needs, not the size. */
  as?: 'h1' | 'h2' | 'h3' | undefined
  className?: string | undefined
  id?: string | undefined
}

export function SectionHeader({
  title,
  eyebrow,
  aside,
  as: Heading = 'h2',
  className,
  id,
}: SectionHeaderProps) {
  return (
    <header className={cn(s.header, className)}>
      {eyebrow && <p className={cn('caption', s.eyebrow)}>{eyebrow}</p>}
      <div className={s.row}>
        <Heading id={id} className={cn('h2', s.title)}>
          {title}
        </Heading>
        {aside && <div className={cn('caption', s.aside)}>{aside}</div>}
      </div>
    </header>
  )
}
