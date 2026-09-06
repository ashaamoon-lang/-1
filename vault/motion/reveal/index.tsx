'use client'

/**
 * Reveal — the entrance container for content that cannot be a client
 * component itself.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Wraps Satūs's `useReveal` (MIT, darkroom.engineering) in the one shape a
 * Server Component can use.
 *
 * ## Why this exists
 *
 * `useReveal` is a hook, so only a client component can call it. Two blocks
 * on this site are Server Components for reasons that are not negotiable:
 * `vault/blocks/studio-note` renders Portable Text through
 * `next/root-params`, which is server-only, and `vault/blocks/contact-block`
 * has no state at all and its own doc comment argues for keeping it that way.
 *
 * Both had therefore been shipped with no entrance, and Tahap 14's coverage
 * gate found them: on `/en`, four of eight headings arrived with no reveal
 * while the four beside them faded in. That inconsistency is more visible
 * than either treatment on its own — a page where half the sections animate
 * reads as unfinished rather than restrained.
 *
 * Children cross the boundary as a prop, so the server component keeps
 * rendering on the server and only this thin container is client code. That
 * is the standard RSC composition, and it is why converting the blocks
 * themselves was the wrong fix.
 *
 * ## What the caller still owns
 *
 * The *treatment*. This owns the mechanism only: it flips `data-reveal`, and
 * the global contract in `lib/styles/css/global.css` animates any
 * `[data-reveal-item]` inside. Mark the parts that should arrive in sequence,
 * and set `--reveal-transform` / `--reveal-stagger` / `--reveal-duration` in
 * the block's own stylesheet if the defaults are wrong for it.
 *
 * Nothing is animated that is not marked, so wrapping a block in this and
 * forgetting the markers is a no-op rather than a surprise.
 *
 * @example
 * ```tsx
 * // In a Server Component
 * <Reveal as="section" id="contact" className={s.section}>
 *   <SectionHeader data-reveal-item title={title} />
 *   <div data-reveal-item className={s.actions}>…</div>
 * </Reveal>
 * ```
 */

import cn from 'clsx'
import type { ReactNode } from 'react'

import { useReveal } from '@/lib/hooks/use-reveal'

interface RevealProps {
  children: ReactNode
  /**
   * The element to render. Defaults to `div`.
   *
   * A block that owns a landmark passes its own tag rather than nesting one
   * inside a wrapper div — an extra element between a `<section>` and its
   * heading is a change to the document outline, not a styling detail.
   */
  as?: 'div' | 'section' | 'header' | 'footer' | 'aside' | undefined
  id?: string | undefined
  className?: string | undefined
  /**
   * Names one of the choreographed moments this page is allowed
   * (`docs/MOTION-SPEC.md` §9.5), when the block that reveals *is* the moment.
   *
   * Declared rather than spread, the same way `vault/blocks/project-grid` and
   * `vault/blocks/step-sequence` declare it: this component spreads nothing,
   * so an attribute passed in without a prop for it is dropped silently and
   * the budget gate then measures correct markup as missing. Tahap 52 found
   * three routes in exactly that state.
   */
  'data-epic'?: string | undefined
  /**
   * Each `[data-reveal-item]` arrives on its own instead of the block
   * arriving as one — `lib/hooks/use-reveal.ts` carries the argument and the
   * measurement.
   *
   * For lists on long pages. A masthead is one thought and should stay one
   * event.
   */
  perItem?: boolean | undefined
}

export function Reveal({
  children,
  as: Element = 'div',
  id,
  className,
  'data-epic': epic,
  perItem = false,
}: RevealProps) {
  /*
   * `HTMLDivElement` rather than `HTMLElement`, even though `as` widens the
   * tag. React types a `ref` against the *specific* element of the JSX tag,
   * and every tag this accepts is a plain block container with no extra
   * interface of its own — so the narrower ref is accurate for all of them,
   * while `HTMLElement` is rejected as too wide. The hook only ever reads
   * `dataset` and `querySelectorAll`, which every element has.
   */
  const ref = useReveal<HTMLDivElement>({ perItem })

  return (
    <Element
      ref={ref}
      {...(id && { id })}
      {...(epic && { 'data-epic': epic })}
      className={cn(className)}
    >
      {children}
    </Element>
  )
}
