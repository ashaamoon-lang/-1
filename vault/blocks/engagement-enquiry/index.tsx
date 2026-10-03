/**
 * EngagementEnquiry — from the case a reader has just read, straight to a
 * letter to the studio about one like it.
 *
 * Provenance: original work for this project. No third-party code copied.
 *
 * A case study is where a prospective client decides, and until now the only
 * way to act on that decision was to leave the page for the footer or the home
 * page's contact block and start a blank email. This is one link, at the head
 * of the case's way onward: it opens the reader's own mail client with the
 * studio's address, a subject naming the case, and a short brief — which case,
 * in what shape, then three empty lines for what the studio needs to know. The
 * caller builds the href (`enquiry.ts`) from strings it has already localized.
 *
 * Plain `mailto:` through the site's `Link`, as the home page's contact block
 * does — no form, no script, no service, no secret — so it works
 * with JavaScript off and sends nothing until the reader does. The link stands
 * alone in its paragraph rather than inline in running text, which is what
 * checkpoint 3 taught (`docs/HANDOFF.md` §4.2): axe cannot decide a link in a
 * text block over this site's backgrounds. It does not move: no reveal, so a
 * pointer that finds it keeps it.
 */

import cn from 'clsx'

import { Link } from '@/components/ui/link'

import s from './engagement-enquiry.module.css'

interface EngagementEnquiryProps {
  /** The `mailto:` from `enquiryHref`. */
  href: string
  /** Already localized — "Discuss a similar engagement". */
  label: string
  className?: string | undefined
}

export function EngagementEnquiry({
  href,
  label,
  className,
}: EngagementEnquiryProps) {
  return (
    <p className={cn(s.enquiry, className)}>
      <Link
        href={href}
        className={cn('p-big', s.link)}
        data-press="email"
        data-intent=""
      >
        {label}
      </Link>
    </p>
  )
}
