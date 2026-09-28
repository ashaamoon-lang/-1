import type { CSSProperties } from 'react'

/**
 * The inline style a nameplate needs: how many characters its text has, for
 * the stylesheet to fit it to its container (`.nameplate-title` in
 * `lib/styles/css/global.css`).
 *
 * `Array.from` counts characters, not UTF-16 code units, so an accented or
 * astral character counts once. A custom property is not in React's
 * `CSSProperties`, so the object is widened — the same shape as
 * `vault/blocks/contact-block`'s `--email-chars`.
 */
export function nameplateStyle(text: string): CSSProperties {
  return { '--fit-chars': Array.from(text).length } as CSSProperties
}
