import cn from 'clsx'

import { Link } from '@/components/ui/link'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbSchema } from '@/lib/seo/schemas'

import s from './breadcrumbs.module.css'

/**
 * Where this page sits, and one click back to the level above.
 *
 * ## Why it exists
 *
 * Tahap 38 measured the site's inner pages: a project page offered **one**
 * link out of its own content, and a visitor arriving from search had no
 * visible sign that `/en/work` existed at all. The footer's Index column was
 * the only route navigation on the site, and it is identical everywhere, so
 * it tells a reader nothing about *where they are*.
 *
 * ## It carries its own structured data
 *
 * `lib/seo/schemas.ts` has exported `breadcrumbSchema()` since it was
 * written, and nothing had ever called it. Emitting the JSON-LD here rather
 * than at each call site means the visible trail and the machine-readable one
 * cannot drift: they are built from the same array.
 *
 * ## Accessibility
 *
 * A `<nav>` with its own label, an ordered list because the order is the
 * information, and `aria-current="page"` on the last crumb, which is text
 * rather than a link — a link to the page you are on is a dead control.
 */
export interface Crumb {
  /** Locale-free template; `components/ui/link` adds the prefix. */
  href?: string | undefined
  label: string
  /** Absolute URL, for the JSON-LD. */
  url: string
}

interface BreadcrumbsProps {
  label: string
  trail: readonly Crumb[]
  className?: string | undefined
}

export function Breadcrumbs({ label, trail, className }: BreadcrumbsProps) {
  if (trail.length < 2) return null

  return (
    <>
      <JsonLd
        data={breadcrumbSchema(
          trail.map((crumb) => ({ name: crumb.label, url: crumb.url }))
        )}
      />
      <nav aria-label={label} className={cn(s.breadcrumbs, className)}>
        <ol className={s.list}>
          {trail.map((crumb, index) => {
            const last = index === trail.length - 1
            return (
              <li className={cn('caption', s.crumb)} key={crumb.url}>
                {last || !crumb.href ? (
                  <span aria-current={last ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    className={s.link}
                    href={crumb.href}
                    // `MOTION-SPEC.md` §9.
                    data-press="crumb"
                    data-intent=""
                  >
                    {crumb.label}
                  </Link>
                )}
                {!last && (
                  <span aria-hidden="true" className={s.separator}>
                    /
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
