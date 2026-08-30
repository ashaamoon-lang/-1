import cn from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'

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
  className,
}: ContactBlockProps) {
  return (
    <section id={id} className={cn(s.section, className)}>
      <SectionHeader eyebrow={eyebrow} title={title} />

      <div className={s.actions}>
        <Link
          href={`mailto:${email}`}
          aria-label={emailLabel}
          className={cn('h2', s.email)}
        >
          {email}
        </Link>

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
    </section>
  )
}
