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
/**
 * The one placeholder contact, shared.
 *
 * Exported since Tahap 35. `components/layout/footer` had its own copy of the
 * same address and the same two bare domains — a third, after this file and
 * `lib/seo/site.ts` — and nothing tied them together, so a studio filling in
 * its real address would have found two of the three.
 *
 * `lib/seo/site.ts` no longer carries one at all: a reserved-TLD address is a
 * placeholder to a person and a fact to a crawler, so the machine surfaces
 * omit it and the human surfaces label it. `docs/stages/TAHAP-35.md` §3.1.
 */
export const FALLBACK_CONTACT = {
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
  /**
   * Which rendered fields came from this file rather than from the CMS.
   *
   * Per field, because the resolution below is per field. It used to be one
   * boolean meaning "no `studioSettings` document exists at all", and that is
   * a different question: with a half-filled document present — the normal
   * state while a studio is onboarding, and the exact case this resolver was
   * written for — the flag read `false` while the fallback paragraphs
   * rendered anyway. The home page's "Placeholder copy…" note is driven by
   * this, so the note went unshown and scaffolding shipped unlabelled.
   * `docs/stages/TAHAP-35.md` §2 has the measurement.
   */
  fallbacks: {
    headline: boolean
    subline: boolean
    email: boolean
    socials: boolean
    statement: boolean
  }
}

/** A CMS string that is present and not merely an empty box an editor left. */
function usable(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/**
 * A field's value together with where it came from.
 *
 * The two have to be decided in one place. Deriving "did this fall back?"
 * from a separate `usable()` call is how the two drift, and drift here means
 * a page that renders scaffolding while reporting that it did not.
 */
function pick(
  cms: string | null | undefined,
  fallback: string
): { value: string; fromCms: boolean } {
  return usable(cms)
    ? { value: cms, fromCms: true }
    : { value: fallback, fromCms: false }
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

  const name = pick(settings?.name, FALLBACK_CONTACT.name)
  const headline = pick(settings?.headline, copy.headline)
  const subline = pick(settings?.subline, copy.subline)
  const email = pick(settings?.email, FALLBACK_CONTACT.email)
  const statement =
    settings?.statement && settings.statement.length > 0
      ? settings.statement
      : null

  return {
    name: name.value,
    headline: headline.value,
    subline: subline.value,
    email: email.value,
    socials: socials.length > 0 ? socials : FALLBACK_CONTACT.socials,
    portraitCaption: copy.portraitCaption,
    statement,
    statementFallback: copy.statement,
    fallbacks: {
      headline: !headline.fromCms,
      subline: !subline.fromCms,
      email: !email.fromCms,
      socials: socials.length === 0,
      statement: statement === null,
    },
  }
}
