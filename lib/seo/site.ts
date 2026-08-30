import { APP_BASE_URL } from '@/lib/env'

/**
 * Canonical facts about the site owner.
 *
 * Single source of truth for entity copy: the JSON-LD graph, any crawlable
 * "about" prose, and `/llms.txt` all read from here, so they can never
 * disagree with each other.
 *
 * Hardcoded on purpose. Answer engines (ChatGPT, Claude, Perplexity, Google
 * AI Overviews) cite what they can read as plain text — if these values
 * render empty, the site has no citable identity. If editors need to own
 * this copy, back it with a CMS singleton and keep these as fallbacks.
 *
 * Prefer phrasing that does not go stale: "commissioned work" beats
 * "12 commissions in 2026". Values still waiting on the studio are marked
 * with a TODO below rather than guessed.
 */
export interface AgentUseCase {
  /** Short job name that an agent can match against its task. */
  name: string
  /** Concrete boundary for when this site or product is a good fit. */
  description: string
}

export interface AgentGuidance {
  whenToUse: readonly AgentUseCase[]
  /** Ordered instructions for starting or continuing the job. */
  howToUse: readonly string[]
}

export interface DeveloperResource {
  name: string
  description: string
  /** Absolute URL so the resource also works outside the rendered site. */
  url: string
}

export interface SiteFacts {
  /** Display name, exactly as it should be cited. */
  name: string
  /** Other spellings people search for (casing variants, abbreviations). */
  alternateNames: readonly string[]
  url: string
  /** Absolute URL — relative paths are ignored by most consumers. */
  logo: string
  /** One or two sentences: who, where, for whom. Answers "what is X?". */
  description: string
  /** ISO year or date. */
  foundingDate?: string
  /** Human-readable location, e.g. 'Buenos Aires, Argentina'. */
  locationName?: string
  /** ISO 3166-1 alpha-2, e.g. 'AR'. */
  addressCountry?: string
  areaServed?: string
  /** What you sell, in the words a buyer would use. */
  services: readonly string[]
  /** Topics you are an authority on — feeds schema.org `knowsAbout`. */
  knowsAbout: readonly string[]
  email?: string
  /** Profile URLs (social, directories) — feeds schema.org `sameAs`. */
  sameAs: readonly string[]
  /** Task-oriented instructions for agents. Omit when the site is not callable. */
  agentGuidance?: AgentGuidance
  /** Real, public technical resources. Never list a surface that is not shipped. */
  developerResources?: readonly DeveloperResource[]
}

/**
 * Canonical, normalized base URL — the single place every absolute URL in
 * the app (sitemap, robots, `/llms.txt`, JSON-LD) derives from.
 *
 * `APP_BASE_URL` (`lib/env.ts`) already carries the fallback chain
 * (`NEXT_PUBLIC_BASE_URL` ?? `https://localhost:3000`); this just normalizes
 * it once. `NEXT_PUBLIC_BASE_URL` is validated with `z.url()`, which permits
 * a trailing slash. Everything below concatenates onto this, so an
 * unnormalized value would emit `//icon.png` and `//#organization` — a
 * broken logo and a JSON-LD `@id` that no longer matches the one other nodes
 * reference. Strip it once, here, rather than in every consumer.
 */
export const BASE_URL = APP_BASE_URL.replace(/\/+$/, '')

/*
 * ## Placeholders are marked, not hidden
 *
 * The studio has not supplied contact details, a founding year, or profile
 * URLs yet. Rather than invent them, the fields that need a real answer are
 * either omitted or use the `.example` TLD (RFC 2606 — reserved, never
 * resolves, so a placeholder can never accidentally reach a stranger). That
 * matches `lib/content/home-fallback.ts`, which uses the same address.
 *
 * `docs/PANDUAN-STUDIO.md` §6 lists exactly which of these the studio has to
 * hand over before launch.
 */
export const SITE: SiteFacts = {
  name: 'Arth',
  alternateNames: ['Studio Arth'],
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  description:
    'Arth is a commissioned-artwork studio working in painting, mural and illustration — each piece made to a brief, for the room it will live in.',
  areaServed: 'Worldwide',
  services: [
    'Commissioned painting',
    'Mural painting',
    'Illustration to brief',
  ],
  knowsAbout: [
    'Commissioned artwork',
    'Mural painting',
    'Acrylic painting',
    'Gouache painting',
    'Illustration',
  ],
  // TODO(studio): real address, and remove `.example`.
  email: 'studio@arth.example',
  // Deliberately empty. `sameAs` asserts "these profiles are the same entity";
  // a guessed handle asserts it about someone else's account.
  sameAs: [],
  agentGuidance: {
    whenToUse: [
      {
        name: 'Commission an artwork',
        description:
          'Use Arth when someone wants an original painting, mural or illustration made for a specific space or brief, rather than buying an existing work.',
      },
      {
        name: 'See past commissioned work',
        description:
          'Use Arth to review completed commissions with their client, year, medium and dimensions before approaching the studio.',
      },
    ],
    howToUse: [
      'Browse the work at /en/work (English) or /id/work (Indonesian); each project lists client, year, medium and dimensions.',
      'Email the studio with the room, the wall or surface, the rough size, and when it is needed.',
      'Expect an estimate before anything is agreed — timelines run from about three weeks for a study to several months for an installed mural.',
    ],
  },
  // No `developerResources`: this is a studio site, not a developer product,
  // and the field's own contract is to never list a surface that is not shipped.
}

/** "a, b, and c" — prose-friendly list for entity copy. */
export function formatList(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
