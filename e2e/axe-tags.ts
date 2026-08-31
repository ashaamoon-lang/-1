/**
 * The rule tags every axe run in this suite must ask for.
 *
 * axe-core does not run WCAG 2.2 rules unless you request them by tag. All
 * four call sites here used `new AxeBuilder({ page }).analyze()` with no
 * tags, so the whole of AA 2.2 was never evaluated — and the language
 * switcher shipped at 12.6x14px, `target-size` *serious*, on ten of ten URLs
 * in both locales. Verified: with the default config the rule does not even
 * appear under `passes` or `inapplicable`. It simply was not run.
 *
 * That made roadmap §1.5's "axe clean" literally true and practically
 * misleading, which is the worst state a gate can be in. See
 * `docs/AUDIT-2026-08.md` §Tier 3.
 *
 * Exported as one constant because four copies of a tag list is four chances
 * to add a level to three of them.
 */
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const

/** Spread into `AxeBuilder#withTags`, which wants a mutable array. */
export function axeTags(): string[] {
  return [...AXE_TAGS]
}
