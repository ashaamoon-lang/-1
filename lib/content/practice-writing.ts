import { resolveJournalEntries } from '@/lib/content/journal-fallback'
import type { Practice } from '@/lib/content/practices'
import type { Locale } from '@/lib/i18n/routing'
import { isConfigured } from '@/lib/integrations/registry'
import { sanityFetch } from '@/lib/integrations/sanity/live'
import { journalEntriesQuery } from '@/lib/integrations/sanity/queries'

/**
 * The writing filed under a practice — read by the practice page (round 4,
 * `practice-writing`) and by each case study in it (round 5,
 * `engagement-writing`).
 *
 * The same entries the journal index lists, resolved the same way
 * (`resolveJournalEntries`): the studio's published entries when there are
 * any, the scaffolding otherwise, never a mix — so no page can disagree with
 * `/journal` about what has been written. Filtered here rather than in GROQ,
 * so the query and its generated type stay the index's own; trimmed to the
 * four fields a listing reads, so the cached result carries no bodies.
 */
export async function writingForPractice(locale: Locale, practice: Practice) {
  'use cache'
  const data = isConfigured('sanity')
    ? (
        await sanityFetch({
          query: journalEntriesQuery,
          params: { locale },
          perspective: 'published',
          stega: false,
        })
      ).data
    : null

  return resolveJournalEntries(locale, data)
    .filter((entry) => entry.practice === practice)
    .map(({ slug, date, title, summary }) => ({ slug, date, title, summary }))
}
