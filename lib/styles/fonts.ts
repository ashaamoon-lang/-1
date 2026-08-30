import { Geist, Geist_Mono } from 'next/font/google'

/*
 * Geist + Geist Mono.
 *
 * Chosen from evidence, not taste: `docs/TEARDOWN.md` §4 measured
 * basement.studio — an award-winning agency — shipping exactly this pairing in
 * production. Of every typeface in that measurement set (Aeonik, Apercu,
 * Söhne, Maisonneue, ABC Arizona, Brier), Geist is the only one that is open
 * source, so it is the one place the research translates into something we can
 * actually use for free.
 *
 * It replaces Oswald, the upstream starter's placeholder — a CONDENSED face,
 * which is a poster register rather than a studio one. Every site measured
 * pairs a neutral neo-grotesque with a mono, and the mono is doing real work:
 * labels, captions, metadata. See `docs/stages/TAHAP-1.md` for the full
 * reasoning and the alternatives rejected.
 *
 * A licensed face (Aeonik, Söhne) remains the highest-leverage upgrade
 * available — `docs/RESOURCES.md` gap #1. Swapping one in touches only this
 * file.
 *
 * No `weight` — both families ship a variable `wght` axis, so one file per
 * family covers every weight the styles use. Pinning explicit weights would
 * download a separate static file each and snap in-between weights (500, 600)
 * to the nearest loaded one.
 */
const display = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-display',
  fallback: ['system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
})

const mono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--next-font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
})

const fonts = [display, mono]
const fontsVariable = fonts.map((font) => font.variable).join(' ')

export { fontsVariable }
