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
 * alternatives were worse: shipping a blank page, or writing invented engagements
 * into the agency's real content library.
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
    headline: 'Work that has to hold up',
    subline:
      'Consulting, AI and data, and commissioned build, scoped to a brief and delivered against it.',
    statement: [
      'Arth works to a brief. Every engagement starts from the constraint that makes the problem hard (the deadline, the legacy system, the decision that cannot be reversed) and not from a menu of services.',
      'The work runs from a two-week architecture review to a build carried for several months. The scope and the estimate are agreed before anything starts rather than after, and what is delivered is measured against them.',
    ],
    portraitCaption: 'The studio',
  },
  id: {
    headline: 'Karya yang harus bertahan',
    subline:
      'Konsultasi, AI dan data, serta pengerjaan pesanan, dengan lingkup sesuai brief dan dikerjakan sesuai itu.',
    statement: [
      'Arth bekerja sesuai brief. Tiap penugasan dimulai dari kendala yang membuat masalahnya sulit (tenggatnya, sistem lamanya, keputusan yang tidak bisa ditarik kembali), bukan dari daftar layanan.',
      'Pekerjaannya berkisar dari tinjauan arsitektur dua minggu sampai pengerjaan yang berjalan beberapa bulan. Lingkup dan perkiraannya disepakati sebelum apa pun dimulai, bukan sesudah, dan hasilnya diukur terhadap keduanya.',
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
