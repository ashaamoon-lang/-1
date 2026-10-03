import cn from 'clsx'
import type { CSSProperties, ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { CopyAddress } from '@/vault/blocks/copy-address'
import { Reveal } from '@/vault/motion/reveal'
import { Magnetic } from '@/vault/primitives/magnetic'

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
 * ## And a copy of it
 *
 * A `mailto:` link does nothing for a reader whose mail lives in a browser
 * tab, and says nothing about having done nothing. Given `copy`, the block
 * sets `vault/blocks/copy-address` under the address: the same action, copied,
 * so it holds for that reader too. It is the one client island here, and it
 * renders nothing where it could not work.
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
  /**
   * The words for copying the address as well as opening it. A page that
   * passes none gets the address alone, as before.
   */
  copy?: CopyLabels | undefined
  className?: string | undefined
}

/** Already localized — what the copy control and its status say. */
export interface CopyLabels {
  /** "Copy address". */
  label: string
  /** What the status says once the address is copied. */
  copied: string
  /** What the status says when the browser refuses. */
  failed: string
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
  copy,
  className,
}: ContactBlockProps) {
  /*
   * How many characters the address has, for the stylesheet to size it by:
   * the address runs the full width of the block at whatever size makes it
   * fit on one line (`contact-block.module.css`, `.email`). A custom property
   * is not in React's `CSSProperties`, so the object is widened — the same
   * shape as `project-card`'s `parallaxStyle`.
   */
  const emailStyle = { '--email-chars': email.length } as CSSProperties

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
          {/*
            Magnetic on the site's one conversion action — Tahap 63.

            Same rule as `/studio`'s closing link: one per surface, on the
            action that surface exists to offer. For an agency site that
            action is the email address, and it is the only element on the
            page a visitor's whole visit resolves into — so if pointer
            attraction earns its place anywhere, it is here.

            The marker discipline above still holds: `data-press` stays on the
            link, `data-reveal-item` on the container, and `Magnetic` wraps
            without claiming either. It moves the wrapper, not the noun, so
            the 150ms COMMIT band is untouched.
          */}
          <Magnetic>
            <Link
              href={`mailto:${email}`}
              aria-label={emailLabel}
              className={cn('h2', s.email)}
              style={emailStyle}
              // `MOTION-SPEC.md` §9.
              data-press="email"
              data-intent=""
            >
              {email}
            </Link>
          </Magnetic>
          {copy && <CopyAddress address={email} {...copy} />}

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
