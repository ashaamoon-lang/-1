'use client'

/**
 * TextReveal — one-shot line or word reveal on scroll entry.
 *
 * Provenance: original work for this project. No third-party code copied.
 * Built on GSAP + SplitText (see `docs/PROVENANCE.md` §2 on GSAP licensing)
 * and modelled on the structure of `components/effects/progress-text`
 * (Satūs, MIT, darkroom.engineering) — same a11y and reduced-motion
 * approach, different animation.
 *
 * ## How this differs from `ProgressText`
 *
 * `components/effects/progress-text` scrubs word opacity against scroll
 * position — the text brightens as you scroll through it, and reverses when
 * you scroll back. It is a *continuous, scroll-linked* effect.
 *
 * This is a *one-shot entrance*: lines or words rise into place behind a
 * clip mask when the element enters the viewport, then stay. It is the
 * "expensive-looking" heading reveal on essentially every site measured in
 * `docs/TEARDOWN.md`.
 *
 * Both are useful. Use `ProgressText` for a long passage the reader moves
 * through; use this for a heading that should land once.
 *
 * ## Accessibility
 *
 * SplitText shreds text into per-line/word spans, which screen readers would
 * otherwise announce disjointedly. The original string is preserved as
 * `aria-label` on the container and the generated spans are `aria-hidden`, so
 * assistive tech reads continuous text.
 *
 * Under `prefers-reduced-motion: reduce` the text is **never split and never
 * animated** — it renders as plain, fully visible content. This is deliberate:
 * skipping only the animation would leave the mask in place and the text
 * clipped.
 *
 * @example
 * ```tsx
 * <TextReveal as="h1" split="lines">
 *   Commissioned work for people who notice
 * </TextReveal>
 * ```
 */

import { useGSAP } from '@gsap/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type { RefObject } from 'react'
import { useRef } from 'react'

import { usePreferredReducedMotion } from '@/lib/hooks/use-sync-external'

import { duration, easing, stagger } from '../tokens'

import s from './text-reveal.module.css'

// Registered here rather than only in `components/effects/gsap.tsx` so this
// component is correct even when it renders before the Lenis↔ScrollTrigger
// bridge has been dynamically imported. `registerPlugin` is idempotent.
// oxlint-disable-next-line anti-slop/no-runtime-typeof -- SSR guard; literal typeof enables bundler dead-code elimination
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText)
}

interface TextRevealProps {
  /**
   * The text to reveal. Kept to `string` on purpose: SplitText takes
   * ownership of the rendered text nodes, so React updating children in place
   * would fight the split DOM. To change the content, remount with a `key`.
   */
  children: string
  /**
   * Element to render. Defaults to `p`; pass `h1`/`h2` for headings.
   *
   * Constrained to a fixed set rather than a fully polymorphic `ElementType`:
   * a generic `as` would make every prop on this component resolve to `never`
   * without a much heavier generic signature, and the extra machinery buys
   * nothing here — a text reveal is only ever a heading, paragraph, or span.
   */
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div' | undefined
  /**
   * Split granularity.
   * - `lines` (default) — the premium default. Reads as typography.
   * - `words` — more granular, good for short display text.
   * - `chars` — use sparingly; on more than a few words it reads as a gimmick
   *   and floods the DOM with spans.
   */
  split?: 'lines' | 'words' | 'chars' | undefined
  /** ScrollTrigger start position. Default `'top 85%'` — just inside the fold. */
  start?: string | undefined
  /** Play once and stay (default), or replay on every re-entry. */
  once?: boolean | undefined
  className?: string | undefined
}

/** Maps the public `split` prop to SplitText's config and result key. */
const SPLIT_CONFIG = {
  lines: { type: 'lines', key: 'lines', staggerStep: stagger.words },
  words: { type: 'words', key: 'words', staggerStep: stagger.words },
  chars: { type: 'chars', key: 'chars', staggerStep: stagger.chars },
} as const

export function TextReveal({
  children,
  as: TagName = 'p',
  split = 'lines',
  start = 'top 85%',
  once = true,
  className,
}: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = usePreferredReducedMotion()

  useGSAP(
    () => {
      const container = containerRef.current
      if (!container) return

      /*
       * The preference is read again here, from `matchMedia` directly, and
       * that repetition is the fix for a real bug rather than belt and braces.
       *
       * `usePreferredReducedMotion` is a `useSyncExternalStore` whose *server*
       * snapshot is `false`. React hydrates with the server snapshot, so the
       * first commit — the one this effect runs in — sees `false` even for a
       * reader who has the preference on. The split happened, `gsap.from` put
       * every line at `yPercent: 100` inside its mask, and whether the tween
       * then completed depended on a race with the re-render that carries the
       * real value.
       *
       * Measured on the home page under `prefers-reduced-motion`: the English
       * headline finished, the Indonesian one did not — lines 2 and 3 parked
       * at `matrix(1, 0, 0, 1, 0, 102)` inside 102px masks, 0% visible, at
       * `opacity: 1` the whole time. That is `CLAUDE.md` #5 — content stranded
       * invisible — and it shipped from Tahap 11c, because the gate that
       * exists for exactly this reads opacity and nothing was ever transparent.
       *
       * Inside an effect we are on the client and `matchMedia` is truthful
       * *now*, with no hydration snapshot in the way. The hook stays in the
       * dependencies so flipping the preference mid-session still re-runs and
       * reverts.
       */
      const reduced =
        prefersReducedMotion ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Reduced motion: never split, never animate. The element already
      // renders its text normally, so there is nothing to reveal — and
      // nothing left hidden.
      if (reduced) return

      const config = SPLIT_CONFIG[split]

      // `mask` makes SplitText wrap each part in an overflow-hidden parent, so
      // the rise happens *behind an edge* rather than the text simply sliding
      // in. That clipped edge is what separates a considered reveal from a
      // generic fade-up.
      const instance = SplitText.create(container, {
        type: config.type,
        mask: config.type,
        // 'auto', not 'hidden'. Both put aria-hidden on the generated spans,
        // but only 'auto' also writes the original string to an aria-label on
        // the container. With 'hidden' the element keeps its role and loses
        // its accessible name — an <h1> that screen readers and
        // getByRole('heading', { name }) both see as empty. Caught by
        // e2e/instant-navigation.e2e.ts, which is exactly what that test is for.
        aria: 'auto',
      })

      const parts: Element[] = instance[config.key]
      if (parts.length === 0) return

      const tween = gsap.from(parts, {
        yPercent: 100,
        duration: duration.slow,
        ease: easing.outExpo.gsap,
        // `amount` (total) rather than `each` (per item): the reveal takes the
        // same time whether the heading splits into two lines or six, so a
        // long heading never turns into a wait.
        stagger: { amount: Math.min(parts.length * config.staggerStep, 0.6) },
        scrollTrigger: {
          trigger: container,
          start,
          once,
          // Not scrubbed: this is a one-shot entrance, not scroll-linked.
          toggleActions: once ? 'play none none none' : 'play none none reset',
        },
      })

      // useGSAP reverts tweens and ScrollTriggers created in this scope, but
      // the SplitText DOM is ours to undo — revert() restores the original
      // text nodes so React is handed back the markup it rendered.
      return () => {
        tween.scrollTrigger?.kill()
        tween.kill()
        instance.revert()
      }
    },
    {
      scope: containerRef,
      dependencies: [prefersReducedMotion, split, start, once],
    }
  )

  // SAFETY: every member of the `as` union is an intrinsic element accepting
  // exactly the same ref/className/children shape, so narrowing the union to
  // one representative member for the JSX call cannot produce a prop the real
  // tag rejects. The cast exists only because TypeScript widens a union of
  // intrinsic elements to the *intersection* of their props (`never`) rather
  // than the union. The public prop type stays honest.
  const Tag = TagName as 'p'

  return (
    <Tag
      // SAFETY: `containerRef` is only ever attached to the element rendered
      // directly below, which is one of the intrinsic tags in the `as` union;
      // all of them are HTMLElement subtypes. The cast narrows to match the
      // representative tag above and is never dereferenced as a paragraph —
      // the ref is only passed to SplitText, which accepts any Element.
      ref={containerRef as RefObject<HTMLParagraphElement | null>}
      className={cn(s.reveal, className)}
    >
      {children}
    </Tag>
  )
}
