import { expect, test } from '@playwright/test'

import { routing } from '../lib/i18n/routing'

/**
 * The site says what Arth actually does — measured on what it serves.
 *
 * ## Why served HTTP and not a source grep
 *
 * A grep over the repository can be satisfied by editing a comment. This
 * cannot: it reads the bytes a reader's browser and an answer engine receive.
 *
 * That distinction is not academic here. Twenty-seven files mentioned the old
 * vocabulary and only eleven carried a value; the rest were doc comments
 * explaining behaviour with the old domain as the example ("flashes white in
 * front of a painting", "`/work/mural`"). A source gate would have demanded
 * those be rewritten, which punishes documentation without protecting anyone.
 *
 * ## What it measured before Tahap 13
 *
 *   /en/ai      137        /id         84
 *   /en         113        /en/work    82
 *   /id/ai      109        /llms.txt   44
 *
 * and `knowsAbout` was five of five: "Commissioned artwork", "Mural painting",
 * "Acrylic painting", "Gouache painting", "Illustration". `/llms.txt` and
 * `/ai` exist to be trusted by machines, so being wrong there is worse than
 * being wrong in a paragraph a person can discount.
 */

/**
 * Words this site no longer does.
 *
 * `commission` is deliberately absent: it is one of the three practices now
 * ("Commission" / "Pesanan"), so banning it would ban the answer along with
 * the problem. What is banned is the *craft* vocabulary of a painting studio.
 */
const RETIRED = [
  'painting',
  'paintings',
  'mural',
  'murals',
  'illustration',
  'lukisan',
  'ilustrasi',
  'gouache',
  'guas',
  'acrylic',
  'akrilik',
  'artwork',
  'karya seni',
]

const PATTERN = new RegExp(`\\b(${RETIRED.join('|')})\\b`, 'gi')

/** Every surface a person or an agent reads a claim from. */
const SURFACES = [
  '/llms.txt',
  ...routing.locales.flatMap((locale) => [
    `/${locale}`,
    `/${locale}/ai`,
    `/${locale}/work`,
  ]),
]

test.describe('vocabulary', () => {
  for (const path of SURFACES) {
    test(`${path} promises nothing the studio no longer does`, async ({
      request,
    }) => {
      const response = await request.get(path)
      expect(response.status(), `${path} did not respond`).toBe(200)

      const body = await response.text()
      // A page that failed to render would pass by having no words at all.
      expect(body.length, `${path} served almost nothing`).toBeGreaterThan(500)

      const found = body.match(PATTERN) ?? []
      const counted = [...new Set(found.map((word) => word.toLowerCase()))]
        .map(
          (word) =>
            `${word}×${found.filter((f) => f.toLowerCase() === word).length}`
        )
        .sort()

      expect(
        counted,
        `${path} still says: ${counted.join(', ')} (${found.length} in total)`
      ).toEqual([])
    })
  }

  test('the structured data advertises the practices', async ({ request }) => {
    /*
     * Checked apart from the sweep above, because this is the claim an answer
     * engine acts on rather than renders. A page can read correctly to a
     * person while its JSON-LD still describes a different business — the two
     * come from `lib/seo/site.ts` but through different fields.
     */
    const body = await (await request.get('/en')).text()

    const services = /"(?:makesOffer|hasOfferCatalog|knowsAbout)":\[[^\]]*\]/g
    const blocks = body.match(services) ?? []
    expect(blocks.length, 'no structured data to check').toBeGreaterThan(0)

    for (const block of blocks) {
      expect(
        block.match(PATTERN) ?? [],
        `structured data still describes a painting studio: ${block.slice(0, 160)}`
      ).toEqual([])
    }
  })
})
