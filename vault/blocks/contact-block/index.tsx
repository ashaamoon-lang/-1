import cn from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { Reveal } from '@/vault/motion/reveal'

import s from './contact-block.module.css'

/**
 * ContactBlock — one call to action, an address, and where else to look.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * ## One action, and it is the email
 *
 * No form. A contact form on a commissioned-work site adds a field to fill
 * in, a server route to maintain, a spam surface, and a message the sender
 * has no copy of — in exchange for nothing the reader wanted. The address is
 * the action, rendered large enough to be the action.
 *
 * ## Server Component
 *
 * No state, no handlers, no `'use client'`. It renders inside `Wrapper`
 * (which is a client component) so it executes on the client in practice, but
 * nothing here needs to — and keeping it free of hooks means it can move back
 * the moment that changes.
 */
interface ContactBlockProps {
  id: string
  eyebrow: ReactNode
  title: ReactNode
  email: string
  /** Screen-reader label for the mail link — "Email {name}", not "click here". */
  emailLabel: string
  socials: readonly { label: string; url: string }[]
  socialsHeading: ReactNode
  /**
   * A qualification on the address above it, rendered only when there is one.
   *
   * Optional because a real address needs no note. The home page passes it
   * when `resolveHomeContent` reports the email came from the fallback rather
   * than the CMS — Tahap 35, where an unlabelled placeholder counted as a
   * defect rather than a rough edge.
   */
  note?: ReactNode | undefined
  className?: string | undefined
}

export function ContactBlock({
  id,
  eyebrow,
  title,
  email,
  emailLabel,
  socials,
  socialsHeading,
  note,
  className,
}: ContactBlockProps) {
  return (
    <section id={id} className={cn(s.section, className)}>
      <SectionHeader reveal eyebrow={eyebrow} title={title} />

      {/*
        The reveal marker goes on `.actions`, never on the address itself.

        `[data-reveal] [data-reveal-item]` in `global.css` sets a `transition`
        shorthand, and a shorthand *replaces* an element's own rather than
        joining it. Marked directly on this link, the reveal's 400ms silently
        overwrote the link's 150ms COMMIT — `e2e/interaction-grammar.e2e.ts`
        measured it as `email/commit: 400ms`, outside the micro band. A
        pressable noun never carries the marker; its container does.
      */}
      <Reveal>
        <div data-reveal-item className={s.actions}>
          <Link
            href={`mailto:${email}`}
            aria-label={emailLabel}
            className={cn('h2', s.email)}
            // `MOTION-SPEC.md` §9.
            data-press="email"
            data-intent=""
          >
            {email}
          </Link>

          {note && (
            <p data-placeholder-note className={cn('caption', s.note)}>
              {note}
            </p>
          )}

          {socials.length > 0 && (
            <div className={s.socials}>
              <h3 className={cn('caption', s.socialsHeading)}>
                {socialsHeading}
              </h3>
              <ul className={s.socialsList}>
                {socials.map((social) => (
                  <li key={social.url}>
                    <Link href={social.url} className={cn('caption', s.social)}>
                      {social.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  )
}
