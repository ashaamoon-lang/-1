/**
 * Icon — the site's only iconography.
 *
 * ## Provenance
 *
 * Path data copied from **Phosphor Icons**, regular weight.
 *
 * - Source: `github.com/phosphor-icons/core`, `assets/regular/*.svg`
 * - Licence: **MIT**, Copyright (c) 2023 Phosphor Icons
 * - Verified by reading that repository's own `LICENSE` file
 *   (`CLAUDE.md` #18 — never a badge, never an article). The React package
 *   `github.com/phosphor-icons/react` carries the same licence, Copyright
 *   (c) 2020 Phosphor Icons.
 * - **Code copied:** yes, the `d` attribute of eight glyphs. Everything else
 *   in this file is original.
 *
 * See `docs/PROVENANCE.md` §Phosphor.
 *
 * ## Why the paths and not the package
 *
 * `@phosphor-icons/react` is a fine package and adding it would be the
 * ordinary answer. It is the wrong answer here: `e2e/route-budget.e2e.ts`
 * allows `/en/work`, `/en/work/[slug]` and `/en/ai` **no** JavaScript beyond
 * the framework, and pulling an icon library onto those routes to draw five
 * glyphs would spend a budget the project spent two stages defending. MIT
 * permits the copy as long as the notice travels with it, and the notice is
 * above.
 *
 * ## Why icons at all, having shipped none for forty-two stages
 *
 * Because the site was already drawing them, badly. `components/ui/lightbox`
 * shipped its controls as the text glyphs `←`, `→`, `−`, `+` and `✕`, and
 * `components/ui/breadcrumbs` drew its separator as a character. A text glyph
 * is not an icon: it inherits font metrics rather than a box, it does not
 * align optically with the label beside it, and it is drawn by whichever
 * font on the reader's machine happens to claim that codepoint — so the
 * lightbox's arrows were a different shape on every platform.
 *
 * ## Using one
 *
 * ```tsx
 * import { Icon } from '@/vault/primitives/icon'
 * import { caretRight } from '@/vault/primitives/icon/paths/caret-right'
 *
 * <Icon path={caretRight} />
 * ```
 *
 * ## The rule
 *
 * **Every icon names an action, or it is not installed.** There are no
 * decorative icons on this site and there is no "icon set" to grow into;
 * this file holds exactly the glyphs something in the interface points at.
 * Adding one means an action exists that had no name.
 *
 * That rule already cost this file a glyph. The plan for Tahap 43 listed an
 * external-link marker as the fifth site, and `arrow-up-right` was fetched
 * for it. Measured, the site renders **no external links**: the only
 * `target="_blank"` outside `components/ui/link` is on `/ai`, inside
 * `SITE.sameAs.length > 0`, and Tahap 35 emptied `sameAs` rather than keep
 * publishing accounts the studio does not have. A marker for a link nothing
 * renders is the same defect as a token nothing consumes — three of which
 * this project has already caught — so the glyph was dropped instead of
 * shipped against a someday.
 */

interface IconProps {
  /**
   * The glyph, imported from `./paths/<name>` — one module per glyph.
   *
   * A `name` prop indexing a shared record is the ordinary shape, and it was
   * the shape here for about an hour. It cost `/en/practice/consulting` its
   * whole remaining budget: a record has to ship every entry to anything that
   * reads any entry, so a page with a breadcrumb and a search box downloaded
   * the lightbox's four glyphs too, and `e2e/route-budget.e2e.ts` measured
   * the route at exactly its 900KB ceiling. Separate modules let the bundler
   * drop what a route does not draw.
   */
  path: string
  /**
   * An accessible name, for the rare icon that is the only content of a
   * control that has no label of its own.
   *
   * Omitted — which is the normal case — the icon is `aria-hidden`. That is
   * the correct default: every icon on this site sits inside a `<button>` or
   * `<a>` that already carries an `aria-label`, and naming the glyph as well
   * makes a screen reader announce the control twice.
   */
  title?: string | undefined
  className?: string | undefined
}

export function Icon({ path, title, className }: IconProps) {
  return (
    <svg
      /*
       * `1em`, not a token of its own.
       *
       * An icon that sits in a line of text should be the size of that text,
       * and `1em` says so once instead of pairing every type class with a
       * matching icon size. It also means the type scale — which Tahap 36
       * clamped and Tahap 37 gated — stays the single authority on how big
       * anything is, which is exactly what a fourth display size would have
       * broken in Tahap 42.
       */
      width="1em"
      height="1em"
      viewBox="0 0 256 256"
      // The glyph takes the colour of the text it sits with, so it needs no
      // theme awareness of its own and cannot drift from its label.
      fill="currentColor"
      className={className}
      /*
       * `block` removes the inline baseline gap under an SVG, which is what
       * makes an icon in a flex row sit a pixel low.
       */
      style={{ display: 'block', flexShrink: 0 }}
      {...(title
        ? { role: 'img' as const }
        : { 'aria-hidden': true, focusable: false })}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} />
    </svg>
  )
}
