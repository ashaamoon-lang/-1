import type { Locale } from '@/lib/i18n/routing'

import { PRACTICES, type Practice } from './practices'

/**
 * Scaffolding entries for the journal, in both languages.
 *
 * **Every entry here loses to the CMS.** The moment the dataset holds one
 * published `journalEntry`, this list stops being rendered entirely — see
 * `resolveJournalEntries` below, and `journal-fallback.test.ts`, which asserts
 * that rather than trusting it.
 *
 * ## Why it exists, and why nothing was written to the dataset
 *
 * The same reasoning `lib/content/home-fallback.ts` already records, and it
 * applies here without modification. The dataset is named `production` and
 * seeding writes into it with a write token; putting invented articles into a
 * studio's live content library is not something to do on the way past. The
 * two honest options were a designed empty state, which cannot be judged as a
 * layout, or scaffolding in code that the CMS overrides. This is the second.
 *
 * ## Why these are about method rather than clients
 *
 * The site's own hardest constraint is that its work is not real yet. An
 * opinion piece about how a decision gets made invents nothing: no client, no
 * engagement, no outcome. A "case study" would have invented all three, and
 * would have had to be deleted rather than replaced.
 *
 * ## Why it is not in `messages/*.json`
 *
 * `messages/` holds **interface** text that ships with the code and changes
 * when the code changes. Editorial copy belongs to the studio and must be
 * editable without a deploy. This is editorial copy with nowhere else to live
 * *yet* — a stand-in for the CMS, not a second home for it.
 */

export interface JournalEntry {
  /** URL segment. Stable, lowercase, hyphenated. */
  slug: string
  /** ISO date. Rendered with the reader's locale, not this string. */
  date: string
  title: string
  /** One or two sentences. Shown on the index and at the top of the entry. */
  summary: string
  /** The body, as plain paragraphs. Portable Text takes over from the CMS. */
  body: readonly string[]
  /** The practice this belongs under, or `null` when it belongs to none. */
  practice: Practice | null
}

const ENTRIES = {
  en: [
    {
      slug: 'scope-is-the-deliverable',
      date: '2026-02-11',
      title: 'Scope is the deliverable',
      summary:
        'The week spent deciding what a piece of work is not is the week that decides whether it ships.',
      body: [
        'Every engagement that went wrong went wrong in the same place, and it was never the build. It was the fortnight where the brief was still soft, where two people in the room held different pictures of the same sentence, and where nobody had written down which decisions were already closed.',
        'So we treat scope as a deliverable rather than a preamble. It has a length, it has a price, and it ends with a document that says what the work is, what it is not, and what would have to be true for the answer to change. If the honest conclusion is that the work should not happen, that document is still the thing we were paid to produce.',
        'The objection is always that this is time spent not building. It is. It is also the only time in a project that costs a week instead of a quarter. A decision made in the first fortnight can be argued with; the same decision discovered in the third month is a rewrite with a deadline attached.',
        'What we have found is that clients rarely disagree with this in principle and almost always feel it as a delay. That tension is worth naming out loud at the start, because a scope that is quietly resented gets skipped, and a skipped scope reappears later wearing a much larger invoice.',
      ],
      practice: 'consulting',
    },
    {
      slug: 'a-decision-you-can-defend',
      date: '2026-01-23',
      title: 'A decision you can defend six months later',
      summary:
        'Recommendations are easy. What a team needs is the reasoning, written where they can argue with it without you.',
      body: [
        'The failure mode of consulting is a recommendation that arrives without its reasoning. It is accepted because of who said it, implemented because it was accepted, and then defended by nobody when the context changes — because there is nothing to defend, only something to have been told.',
        'We write decisions down in a fixed shape: what was open, what constrained it, which alternatives were live, what each one cost, and why the chosen one won. It is not elegant and it is not short. It is readable by somebody who was not in the room, which is the only test that matters.',
        'Six months later the world moves. A dependency is deprecated, a volume assumption doubles, a team member leaves. With the reasoning on record, the team can ask the right question — has the thing that made this true stopped being true? — instead of the wrong one, which is whether to keep trusting a consultant they no longer have access to.',
        'This is also why we would rather be overruled with the facts in hand than agreed with on authority. An overruled recommendation that left a record behind is a better outcome than an accepted one that did not.',
      ],
      practice: 'consulting',
    },
    {
      slug: 'evaluation-before-pipeline',
      date: '2025-12-04',
      title: 'Evaluation before pipeline',
      summary:
        'Build the thing that tells you whether it works before you build the thing. Otherwise the demo is the only evidence you will ever have.',
      body: [
        'The most common shape of a stalled AI project is a working demo and no way to tell whether it is good. The pipeline was built first because it was the visible part, and the evaluation was left for later because it was not. Later never has a deadline.',
        'We build the evaluation first. Not a benchmark borrowed from a paper, but a set of cases drawn from the actual work, with the actual failure modes written out, scored in a way that somebody in the business can read. It is usually less sophisticated than the team expects and considerably more argued about, which is the point.',
        'The immediate effect is that conversations change register. "It feels better" becomes "it moved from 71 to 78 on the cases we agreed matter, and it got worse on two of them, here they are." That is a conversation a team can have without a specialist in the room.',
        'The second effect is slower and more valuable: it becomes possible to say no. A change that does not move the number is a change that does not ship, and a team that can decline work on evidence is a team that stops shipping on enthusiasm.',
      ],
      practice: 'ai-data',
    },
  ],
  id: [
    {
      slug: 'scope-is-the-deliverable',
      date: '2026-02-11',
      title: 'Lingkup adalah hasilnya',
      summary:
        'Minggu yang dipakai memutuskan sebuah pekerjaan itu bukan apa adalah minggu yang menentukan apakah ia selesai.',
      body: [
        'Setiap penugasan yang melenceng melenceng di tempat yang sama, dan tidak pernah di pengerjaannya. Ia melenceng di dua minggu ketika brief-nya masih lunak, ketika dua orang di ruangan memegang gambaran berbeda atas kalimat yang sama, dan ketika belum ada yang menuliskan keputusan mana yang sudah ditutup.',
        'Jadi kami memperlakukan lingkup sebagai hasil, bukan pembuka. Ia punya durasi, punya harga, dan berakhir dengan dokumen yang menyebut pekerjaan ini apa, bukan apa, dan apa yang harus berubah supaya jawabannya berubah. Kalau kesimpulan jujurnya adalah pekerjaan ini sebaiknya tidak terjadi, dokumen itu tetap hal yang kami dibayar untuk menghasilkannya.',
        'Keberatannya selalu bahwa ini waktu yang tidak dipakai membangun. Memang. Ia juga satu-satunya waktu dalam sebuah proyek yang berharga seminggu alih-alih satu kuartal. Keputusan yang dibuat di dua minggu pertama masih bisa dibantah; keputusan yang sama yang baru ditemukan di bulan ketiga adalah penulisan ulang dengan tenggat menempel padanya.',
        'Yang kami temukan: klien jarang tidak setuju dengan prinsipnya dan hampir selalu merasakannya sebagai penundaan. Ketegangan itu layak disebut lantang di awal, karena lingkup yang diam-diam disesalkan akan dilewati, dan lingkup yang dilewati muncul lagi belakangan dengan tagihan yang jauh lebih besar.',
      ],
      practice: 'consulting',
    },
    {
      slug: 'a-decision-you-can-defend',
      date: '2026-01-23',
      title: 'Keputusan yang bisa dibela enam bulan lagi',
      summary:
        'Rekomendasi itu mudah. Yang dibutuhkan tim adalah alasannya, ditulis di tempat mereka bisa membantahnya tanpa Anda.',
      body: [
        'Mode gagal sebuah konsultasi adalah rekomendasi yang tiba tanpa alasannya. Ia diterima karena siapa yang mengucapkannya, dikerjakan karena sudah diterima, lalu tidak dibela siapa pun saat konteksnya berubah — karena tidak ada yang bisa dibela, hanya ada sesuatu yang pernah disampaikan.',
        'Kami menuliskan keputusan dalam bentuk tetap: apa yang terbuka, apa yang membatasinya, alternatif mana yang hidup, ongkos masing-masing, dan kenapa yang terpilih menang. Ia tidak elegan dan tidak pendek. Ia terbaca oleh orang yang tidak ada di ruangan, dan itu satu-satunya ujian yang berarti.',
        'Enam bulan kemudian dunia bergerak. Sebuah dependensi ditinggalkan, asumsi volume berlipat, satu anggota tim keluar. Dengan alasannya tercatat, tim bisa mengajukan pertanyaan yang benar — apakah hal yang membuat ini benar sudah berhenti benar? — alih-alih yang salah, yaitu apakah masih perlu mempercayai konsultan yang sudah tidak bisa mereka hubungi.',
        'Ini juga kenapa kami lebih suka dibantah dengan fakta di tangan daripada disetujui karena otoritas. Rekomendasi yang dibantah tapi meninggalkan catatan adalah hasil yang lebih baik daripada yang diterima tapi tidak.',
      ],
      practice: 'consulting',
    },
    {
      slug: 'evaluation-before-pipeline',
      date: '2025-12-04',
      title: 'Evaluasi sebelum pipeline',
      summary:
        'Bangun dulu hal yang memberi tahu apakah ia bekerja, baru bangun hal itu sendiri. Kalau tidak, demo adalah satu-satunya bukti yang akan pernah Anda punya.',
      body: [
        'Bentuk paling umum sebuah proyek AI yang mandek adalah demo yang jalan dan tidak ada cara menilai apakah ia bagus. Pipeline-nya dibangun lebih dulu karena itu bagian yang terlihat, dan evaluasinya ditinggalkan untuk nanti karena bukan. "Nanti" tidak pernah punya tenggat.',
        'Kami membangun evaluasinya lebih dulu. Bukan benchmark pinjaman dari sebuah paper, melainkan sekumpulan kasus yang diambil dari pekerjaan sebenarnya, dengan mode gagalnya ditulis lengkap, dinilai dengan cara yang bisa dibaca orang bisnis. Ia biasanya kurang canggih dari dugaan tim dan jauh lebih diperdebatkan, dan itulah maksudnya.',
        'Efek langsungnya, percakapan berganti register. "Rasanya lebih baik" berubah jadi "ia naik dari 71 ke 78 pada kasus yang kita sepakati penting, dan turun pada dua di antaranya, ini yang mana." Itu percakapan yang bisa dijalani tim tanpa spesialis di ruangan.',
        'Efek keduanya lebih lambat dan lebih berharga: menjadi mungkin untuk berkata tidak. Perubahan yang tidak menggerakkan angkanya adalah perubahan yang tidak dikirim, dan tim yang bisa menolak pekerjaan berdasarkan bukti adalah tim yang berhenti mengirim berdasarkan antusiasme.',
      ],
      practice: 'ai-data',
    },
  ],
  /*
   * Inferred rather than annotated, and validated with `satisfies` — the
   * project's own lint rule for this: an explicit `Record<Locale, …>`
   * annotation would widen every literal here and discard the evidence that
   * both locales carry the same three slugs, which
   * `journal-fallback.test.ts` then has to check from the outside.
   */
} satisfies Record<Locale, readonly JournalEntry[]>

/** Whether a CMS value is present and not just whitespace. */
function usable(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Whether a stored practice string is one the site actually has.
 *
 * Written as a `some` comparison rather than `PRACTICES.includes(value as
 * Practice)` so there is no type assertion to justify: the narrowing is
 * earned by the check instead of asserted over it. An editor can select only
 * from this list in the Studio, but a value can survive a rename of the
 * constant, and a page that renders a practice label for a practice that no
 * longer exists is worse than one that renders none.
 */
function isPractice(value: string | null | undefined): value is Practice {
  return PRACTICES.some((practice) => practice === value)
}

/** A `journalEntry` document as the query projects it. */
export interface JournalDocument {
  slug?: string | null
  date?: string | null
  title?: string | null
  summary?: string | null
  practice?: string | null
}

/**
 * The CMS's entries when it has any, this file's when it does not.
 *
 * All-or-nothing on purpose, and the alternative is worse: merging the two
 * would put invented articles alongside the studio's real ones with nothing
 * on the page to tell a reader which is which.
 */
export function resolveJournalEntries(
  locale: Locale,
  documents: readonly JournalDocument[] | null
): readonly JournalEntry[] {
  const published = (documents ?? [])
    .filter(
      (document): document is JournalDocument & { slug: string } =>
        usable(document.slug) && usable(document.title)
    )
    .map((document): JournalEntry => ({
      slug: document.slug,
      date: usable(document.date) ? document.date : '',
      title: document.title ?? '',
      summary: usable(document.summary) ? document.summary : '',
      // Portable Text is rendered by the entry route, which fetches the
      // document itself; the index only needs what it lists.
      body: [],
      practice: isPractice(document.practice) ? document.practice : null,
    }))

  return published.length > 0 ? published : (ENTRIES[locale] ?? ENTRIES.en)
}

/** One scaffolding entry by slug, or `undefined`. Used by the entry route. */
export function fallbackEntry(
  locale: Locale,
  slug: string
): JournalEntry | undefined {
  return (ENTRIES[locale] ?? ENTRIES.en).find((entry) => entry.slug === slug)
}

/** Every scaffolding slug, for `generateStaticParams`. */
export function fallbackSlugs(): readonly string[] {
  return ENTRIES.en.map((entry) => entry.slug)
}
