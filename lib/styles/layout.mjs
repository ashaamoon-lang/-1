// THIS FILE HAS TO STAY .mjs AS ITS CONSUMED BY POSTCSS
const breakpoints = {
  dt: 800,
}

const screens = {
  mobile: { width: 375, height: 650 },
  desktop: { width: 1440, height: 816 },
}

const layout = {
  columns: { mobile: 4, desktop: 12 },
  gap: { mobile: 16, desktop: 16 },
  safe: { mobile: 16, desktop: 16 },
}

const customSizes = {
  /*
   * 72 at desktop, down from 98 — `taste-skill` SKILL.md section 4.7 caps the
   * navigation at 80px and calls 64-72 the default, because "no huge agency
   * nav bars that eat 15% of the viewport". At the 816px design height, 98px
   * was eating 12%.
   *
   * Nothing hardcodes it: `scroll-padding-top`, the hero's top padding, the
   * `step-sequence` sticky offset and the lightbox stage all read this token,
   * so lowering it moves them together. That was the point of making it a
   * token in Tahap 11.
   */
  'header-height': { mobile: 58, desktop: 72 },
  // Distance from a section's header to its body — the one number that sets
  // the page's internal rhythm. It was a literal repeated inside StudioNote
  // and ContactBlock and simply absent from the home page's work section,
  // which is how #work came to sit at 0px while its two siblings sat at 48px
  // (docs/stages/TAHAP-11.md §2.1). One token, generated per breakpoint, so
  // there is nowhere left for a fourth copy to drift.
  'section-lead': { mobile: 32, desktop: 48 },
}

export { breakpoints, customSizes, layout, screens }
