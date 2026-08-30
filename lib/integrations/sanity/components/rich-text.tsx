import { PortableText, type PortableTextBlock } from '@portabletext/react'
import { locale as localeRootParam } from 'next/root-params'

import { Link } from '@/components/ui/link'
import { SanityImage } from '@/components/ui/sanity-image'
import { isLocale, routing } from '@/lib/i18n/routing'

import type { Link as SanityLink } from '../sanity.types'
import { getLinkAttributes } from '../utils/link'

interface RichTextProps {
  content: PortableTextBlock[]
}

/**
 * Server Component. The active locale is read from `next/root-params` rather
 * than taken as a prop: internal CMS links need the locale prefix, and
 * threading it through every caller of every rich-text field is exactly the
 * prop drilling root params exist to remove.
 *
 * This does mean RichText cannot be rendered from a Client Component — root
 * params are server-only. That is already true of everything else it touches
 * (SanityImage, the CMS fetch), so it costs nothing here.
 */
export async function RichText({ content }: RichTextProps) {
  if (!content) return null

  const requested = await localeRootParam()
  const locale = isLocale(requested) ? requested : routing.defaultLocale

  return (
    <PortableText
      value={content}
      components={{
        types: {
          image: ({ value }) => <SanityImage image={value} maxWidth={1920} />,
        },
        marks: {
          link: ({ children, value }) => {
            // SAFETY: `value` is whatever the `link` mark's own Sanity
            // schema produced (see `../schemas/link.ts`) — `@portabletext/react`
            // types every mark's `value` generically, with no per-mark shape.
            const linkData = value as SanityLink
            const { href, target, rel } = getLinkAttributes(linkData, locale)

            return (
              <Link
                href={href}
                target={target}
                rel={rel}
                data-sanity-edit-target
              >
                {children}
              </Link>
            )
          },
        },
        block: {
          h1: ({ children }) => <h1 className="h1">{children}</h1>,
          h2: ({ children }) => <h2 className="h2">{children}</h2>,
          h3: ({ children }) => <h3 className="h3">{children}</h3>,
          h4: ({ children }) => <h4 className="h4">{children}</h4>,
          h5: ({ children }) => <h5 className="h5">{children}</h5>,
          h6: ({ children }) => <h6 className="h6">{children}</h6>,
          normal: ({ children }) => <p className="p">{children}</p>,
        },
      }}
    />
  )
}
