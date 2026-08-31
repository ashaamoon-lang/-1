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
  'header-height': { mobile: 58, desktop: 98 },
  // Distance from a section's header to its body — the one number that sets
  // the page's internal rhythm. It was a literal repeated inside StudioNote
  // and ContactBlock and simply absent from the home page's work section,
  // which is how #work came to sit at 0px while its two siblings sat at 48px
  // (docs/stages/TAHAP-11.md §2.1). One token, generated per breakpoint, so
  // there is nowhere left for a fourth copy to drift.
  'section-lead': { mobile: 32, desktop: 48 },
}

export { breakpoints, customSizes, layout, screens }
