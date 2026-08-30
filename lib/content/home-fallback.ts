import type { Locale } from '@/lib/i18n/routing'

/**
 * Placeholder copy for the home page, in both languages.
 *
 * **Every field here loses to the CMS.** The moment a `studioSettings`
 * document exists with a value, that value is used instead — see
 * `resolveHomeContent` below. Nothing in this file is meant to survive
 * contact with the real studio's words.
 *
 * ## Why it exists at all
 *
 * The `production` dataset currently holds zero documents (measured, see
 * `docs/stages/TAHAP-3.md` §0). A home page fed entirely from an empty CMS
 * renders with no `<h1>` and almost no text, which fails
 * `e2e/agent-readiness.e2e.ts` and cannot be judged by anyone. The two
 * alternatives were worse: shipping a blank page, or writing invented artwork
 * into the studio's real content library.
 *
 * ## Why it is not in `messages/*.json`
 *
 * `schemas/studioSettings.ts` draws the line and it is worth keeping:
 * `messages/` holds **interface** text — nav labels, button copy — that ships
 * with the code and changes when the code changes. Editorial copy belongs to
 * the studio and must be editable without a deploy. This file is editorial
 * copy that has nowhere else to live *yet*; it is a stand-in for the CMS, not
 * a second home for site copy.
 */

interface HomeCopy {
  /** The page's only `<h1>`. */
  headline: string
  /** One sentence under it. A hero is not a paragraph. */
  subline: string
  /** The studio statement, as plain paragraphs. */
  statement: readonly string[]
  /** Label under the portrait when the CMS has no image. */
  portraitCaption: string
}

const FALLBACK_COPY = {
  en: {
    headline: 'Commissioned work for people who notice',
    subline: 'Painting, mural and illustration, made to a brief and to a wall.',
    statement: [
      'Arth works to commission. Every piece starts from a conversation about the room it will live in — its light, its scale, what it is already doing — and not from a catalogue of available styles.',
      'The work is mostly acrylic and gouache, at sizes from a single sheet to a full wall. Timelines run from three weeks for a study to several months for an installed mural, and the estimate is given before anything is agreed rather than after.',
    ],
    portraitCaption: 'The studio',
  },
  id: {
    headline: 'Karya pesanan untuk mereka yang memperhatikan',
    subline:
      'Lukisan, mural, dan ilustrasi, dikerjakan sesuai brief dan sesuai dindingnya.',
    statement: [
      'Arth bekerja berdasarkan pesanan. Setiap karya dimulai dari percakapan tentang ruang yang akan menampungnya — cahayanya, ukurannya, apa yang sudah dilakukannya — bukan dari katalog gaya yang tersedia.',
      'Materialnya sebagian besar akrilik dan guas, dengan ukuran dari satu lembar sampai satu dinding penuh. Waktu pengerjaan berkisar tiga minggu untuk studi hingga beberapa bulan untuk mural terpasang, dan perkiraannya diberikan sebelum apa pun disepakati, bukan sesudah.',
    ],
    portraitCaption: 'Studio',
  },
} as const satisfies Record<Locale, HomeCopy>

/** Placeholder contact details. Replaced by `studioSettings` when it exists. */
const FALLBACK_CONTACT = {
  name: 'Arth',
  email: 'studio@arth.example',
  socials: [
    { label: 'Instagram', url: 'https://instagram.com/' },
    { label: 'Are.na', url: 'https://are.na/' },
  ],
} as const

export interface HomeContent {
  name: string
  headline: string
  subline: string
  email: string
  socials: readonly { label: string; url: string }[]
  portraitCaption: string
  /** Portable Text from the CMS, or `null` when the fallback paragraphs are used. */
  statement: unknown[] | null
  /** Plain paragraphs, used only when `statement` is null. */
  statementFallback: readonly string[]
  /** True when no `studioSettings` document was found at all. */
  isPlaceholder: boolean
}

/** A CMS string that is present and not merely an empty box an editor left. */
function usable(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * The CMS wins per field, not per document.
 *
 * A half-filled `studioSettings` — a name but no statement yet — is the normal
 * state while a studio is onboarding, and it must not blank out the sections
 * the editor has not reached. So each field falls back independently, and an
 * empty string counts as absent: Sanity keeps `""` for a field an editor
 * opened and cleared, and treating that as content renders a blank heading.
 */
export function resolveHomeContent(
  locale: Locale,
  settings: {
    name?: string | null
    headline?: string | null
    subline?: string | null
    email?: string | null
    statement?: unknown[] | null
    socials?: readonly { label?: string; url?: string }[] | null
  } | null
): HomeContent {
  const copy = FALLBACK_COPY[locale]

  const socials = (settings?.socials ?? [])
    .filter(
      (social): social is { label: string; url: string } =>
        usable(social.label) && usable(social.url)
    )
    .map((social) => ({ label: social.label, url: social.url }))

  return {
    name: usable(settings?.name) ? settings.name : FALLBACK_CONTACT.name,
    headline: usable(settings?.headline) ? settings.headline : copy.headline,
    subline: usable(settings?.subline) ? settings.subline : copy.subline,
    email: usable(settings?.email) ? settings.email : FALLBACK_CONTACT.email,
    socials: socials.length > 0 ? socials : FALLBACK_CONTACT.socials,
    portraitCaption: copy.portraitCaption,
    statement:
      settings?.statement && settings.statement.length > 0
        ? settings.statement
        : null,
    statementFallback: copy.statement,
    isPlaceholder: settings === null,
  }
}
