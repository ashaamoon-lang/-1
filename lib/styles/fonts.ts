import { Geist_Mono, Syne } from 'next/font/google'

/*
 * Syne for display, Geist Mono for data.
 *
 * Syne was drawn for Synesthésie, a French art centre, and is widely used in
 * contemporary-art contexts. That provenance is the point: this site sits
 * around artwork, and a face from the art world reads as belonging there in a
 * way a general-purpose UI sans does not.
 *
 * It replaces Geist, which was the first Tahap 1 choice. Geist is a fine face
 * and basement.studio ships it — but it is a neutral tech sans, and neutrality
 * is what this site cannot afford once the palette gives up its accent. With
 * no colour carrying identity, the typography has to.
 *
 * Geist Mono stays. Every site measured in `docs/TEARDOWN.md` pairs its
 * display face with a mono that carries labels, captions and metadata, and
 * that division of labour is what makes a portfolio read as engineered rather
 * than merely decorated.
 *
 * No `weight` — both families ship a variable `wght` axis (Syne 400–800,
 * Geist Mono 100–900), so one file per family covers every weight the styles
 * use. Pinning explicit weights would download a separate static file each and
 * snap in-between weights to the nearest loaded one.
 */
const display = Syne({
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
