/**
 * Temporary fixture content, for verifying pages that need real data.
 *
 * **This is not seed data for a real site.** Every document it writes carries
 * an id prefixed `fixture.`, and `--clean` deletes all of them plus the image
 * assets they reference. It exists because two of Tahap 4's exit criteria —
 * an end-to-end test against a real slug, and a sitemap containing every
 * project — cannot be checked against an empty dataset, and inventing
 * permanent artwork in the studio's own content library is not an option.
 *
 * The intended cycle is: seed, verify, `--clean`. Leaving fixtures behind puts
 * work nobody made into a real portfolio, so `--clean` removes the assets too,
 * not just the documents.
 *
 * ```bash
 * bun --env-file .env.local lib/scripts/seed-fixtures.ts
 * bun --env-file .env.local lib/scripts/seed-fixtures.ts --clean
 * bun lib/scripts/seed-fixtures.ts --preview   # render only, no CMS, no token
 * ```
 *
 * `--preview` writes the plates to `.fixtures-preview/` and stops. The plates
 * exist to be judged by eye — that is the whole reason Tahap 12a replaced the
 * gradients — and the round trip of uploading ten assets, rebuilding and
 * reloading a page is a slow way to find out a colour is too dark. It is the
 * only path here that touches neither the network nor a token.
 *
 * Seeding and cleaning require `SANITY_API_WRITE_TOKEN`. Read-only tokens
 * cannot run them, which is the correct failure: they write.
 */

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import sharp from 'sharp'
import { z } from 'zod'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

/** Render the plates to disk and stop. Reaches nothing and needs no token. */
const PREVIEW = process.argv.includes('--preview')
const PREVIEW_DIR = '.fixtures-preview'

// Checked at load, before any work, so the failure is "you are missing a
// credential" rather than "ten plates rendered and then a 401".
if (!PREVIEW && !(projectId && token)) {
  console.error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN.'
  )
  process.exit(1)
}

const API = `https://${projectId}.api.sanity.io/v2025-03-01`

/**
 * Every Sanity call in this script goes through `curl`, deliberately.
 *
 * Neither `@sanity/client` nor Bun's own `fetch` completes a request to
 * `*.api.sanity.io` inside this development container: both die with a bare
 * ECONNRESET, and the agent proxy's `recentRelayFailures` shows the tunnel
 * closing mid-exchange after roughly six seconds. `curl` uses the proxy's
 * CONNECT path and completes every time. The failure is the transport, not the
 * API — and this is a developer utility, not shipped code, so the pragmatic
 * transport is the right one. Nothing in `app/` or `lib/integrations/` is
 * affected; those run inside Next, whose fetch reaches Sanity normally.
 */
function curl(args: readonly string[], body?: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('curl', ['-sS', '--fail-with-body', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let out = ''
    let err = ''
    child.stdout.on('data', (chunk) => {
      out += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      err += String(chunk)
    })
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(`curl exited ${code}: ${err || out}`))
    })

    if (body) child.stdin.write(body)
    child.stdin.end()
  })
}

const auth = ['-H', `Authorization: Bearer ${token}`]

async function query<T>(groq: string, schema: z.ZodType<T>): Promise<T> {
  const url = `${API}/data/query/${dataset}?query=${encodeURIComponent(groq)}`
  const raw: unknown = JSON.parse(await curl([...auth, url]))
  const parsed = z.object({ result: schema }).safeParse(raw)
  if (!parsed.success) throw new Error(`Unexpected query response for: ${groq}`)
  return parsed.data.result
}

async function mutate(mutations: readonly unknown[]): Promise<void> {
  await curl(
    [
      ...auth,
      '-H',
      'Content-Type: application/json',
      '-X',
      'POST',
      '--data-binary',
      '@-',
      `${API}/data/mutate/${dataset}`,
    ],
    Buffer.from(JSON.stringify({ mutations }))
  )
}

/*
 * A hyphen, not a dot, and the distinction is not cosmetic.
 *
 * Sanity reads a dotted document id as `<namespace>.<id>` — the same shape as
 * `drafts.<id>` — and treats anything so prefixed as an unpublished version.
 * Seeded with `fixture.<slug>` the documents were visible to a request
 * carrying a token and invisible to everyone else, so the site rendered its
 * 404 for a project the Studio showed as published. Nothing errored; the
 * project simply was not there.
 */
const PREFIX = 'fixture-'

/** The asset endpoint's response, parsed rather than asserted — it is I/O. */
const uploadResponseSchema = z.object({
  document: z.object({ _id: z.string() }),
})

/** Localized string in the `internationalizedArray` shape the schema uses. */
const i18n = (en: string, id: string) => [
  { _key: 'en', _type: 'internationalizedArrayStringValue', value: en },
  { _key: 'id', _type: 'internationalizedArrayStringValue', value: id },
]

const i18nText = (en: string, id: string) => [
  { _key: 'en', _type: 'internationalizedArrayTextValue', value: en },
  { _key: 'id', _type: 'internationalizedArrayTextValue', value: id },
]

const block = (text: string) => ({
  _type: 'block',
  _key: Math.random().toString(36).slice(2, 10),
  style: 'normal',
  markDefs: [],
  children: [
    {
      _type: 'span',
      _key: Math.random().toString(36).slice(2, 10),
      text,
      marks: [],
    },
  ],
})

const i18nRich = (en: string, id: string) => [
  {
    _key: 'en',
    _type: 'internationalizedArrayRichTextValue',
    value: [block(en)],
  },
  {
    _key: 'id',
    _type: 'internationalizedArrayRichTextValue',
    value: [block(id)],
  },
]

/**
 * One generated plate: a ground, a mass, a light, and a horizon.
 *
 * ## Why a composition and not a gradient
 *
 * The first version of this made two radial gradients over a flat fill. That
 * was enough to prove the image *pipeline* — reserved boxes, derived ratios,
 * the CDN URL builder — which was all Tahap 4 needed.
 *
 * It is not enough to judge a *layout*. A gradient has no subject, no focal
 * point and no direction of light, so a crop cannot be wrong on it and a
 * column cannot be unbalanced beside it. Every composition question this
 * project has left — how tall a hero should be, whether a card's crop keeps
 * the work, which side of a spread carries weight — is unanswerable against a
 * blur. `docs/stages/TAHAP-12.md` §3 measures what that cost.
 *
 * So each plate carries four things a reader's eye can actually use:
 *
 *  - a **horizon**, so the frame has a top and a bottom;
 *  - a **mass** that sits on it, shaded away from the light, so the frame has
 *    a subject;
 *  - a **light** with a stated position, so the frame has a direction;
 *  - one **hard edge**, so a crop is visibly a crop.
 *
 * Still generated, not downloaded: that keeps the script offline, keeps
 * `docs/PROVENANCE.md` out of it entirely (nothing is copied, so nothing needs
 * a licence), and — the part that matters here — lets the aspect ratio be a
 * parameter rather than whatever a stock photograph happens to be.
 */
interface Plate {
  width: number
  height: number
  /** The recessive field the mass sits against. */
  ground: string
  /** The subject. */
  mass: string
  /** The light, and the only bright value in the frame. */
  light: string
  /** Where the light falls, as a fraction of the frame. */
  lightX: number
  lightY: number
  /** Horizon height, as a fraction from the top. */
  horizon: number
  /** The mass's centre, as a fraction of the width. Deliberately off-centre. */
  subjectX: number
}

function plateSvg(p: Plate) {
  const { width: w, height: h } = p
  const horizon = Math.round(h * p.horizon)
  const cx = Math.round(w * p.subjectX)
  const r = Math.round(Math.min(w, h) * 0.3)
  const edge = Math.max(2, Math.round(w * 0.004))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.ground}"/>
      <stop offset="100%" stop-color="${p.mass}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${p.lightX * 100}%" cy="${p.lightY * 100}%" r="72%">
      <stop offset="0%" stop-color="${p.light}" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="${p.light}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0.3">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </linearGradient>
    <!--
      The ground reads as a surface, not as a letterbox bar.

      The first version painted it flat: the ground colour at 0.92 with a
      further 0.34 of black over it. On a page whose own background is
      near-black that came out as a black band under every picture — so a
      third of each plate carried no information, and any crop judged against
      it would be judged against a frame that is partly missing. It reflects
      the light now, brightest at the horizon and falling away toward the
      bottom edge, which is also what a floor does.
    -->
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.light}" stop-opacity="0.22"/>
      <stop offset="35%" stop-color="${p.light}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.28"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#field)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <ellipse cx="${cx}" cy="${horizon - r * 0.35}" rx="${r}" ry="${Math.round(r * 1.12)}" fill="${p.mass}"/>
  <ellipse cx="${cx}" cy="${horizon - r * 0.35}" rx="${r}" ry="${Math.round(r * 1.12)}" fill="url(#shade)"/>
  <rect x="0" y="${horizon}" width="${w}" height="${h - horizon}" fill="${p.ground}"/>
  <rect x="0" y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#ground)"/>
  <rect x="${cx - Math.round(edge / 2)}" y="${Math.round(h * 0.08)}" width="${edge}" height="${horizon - Math.round(h * 0.08)}" fill="${p.light}" opacity="0.5"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`
}

/**
 * Renders a plate to JPEG.
 *
 * The grain is composited by sharp rather than drawn in the SVG: `feTurbulence`
 * is a filter primitive, and filter support in the SVG rasteriser sharp links
 * against is uneven enough that it would fail silently — a plate with no grain
 * looks fine, so nothing would ever report it. A generated noise layer at
 * `soft-light` is boring and works everywhere.
 */
async function makePlate(plate: Plate) {
  const base = await sharp(Buffer.from(plateSvg(plate)))
    .png()
    .toBuffer()
  const grain = await sharp({
    create: {
      width: plate.width,
      height: plate.height,
      channels: 3,
      // Mid grey is the identity value for `soft-light`, so the grain adds
      // texture without shifting the plate's exposure. sharp's types require
      // a background even when `noise` overwrites every pixel.
      background: '#808080',
      noise: { type: 'gaussian', mean: 128, sigma: 12 },
    },
  })
    .png()
    .toBuffer()

  return sharp(base)
    .composite([{ input: grain, blend: 'soft-light' }])
    .jpeg({ quality: 82 })
    .toBuffer()
}

/** Uploads one image and returns its asset document id. */
async function uploadImage(body: Buffer, filename: string) {
  const url = `${API}/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`
  const raw: unknown = JSON.parse(
    await curl(
      [
        ...auth,
        '-H',
        'Content-Type: image/jpeg',
        '-X',
        'POST',
        '--data-binary',
        '@-',
        url,
      ],
      body
    )
  )
  const parsed = uploadResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Asset upload returned an unexpected shape')
  }
  return parsed.data.document
}

async function clean() {
  const ids = await query(`*[_id match "${PREFIX}*"]._id`, z.array(z.string()))
  const assetIds = await query(
    `*[_type == "sanity.imageAsset" && originalFilename match "${PREFIX}*"]._id`,
    z.array(z.string())
  )

  if (ids.length === 0 && assetIds.length === 0) {
    console.log('Nothing to clean.')
    return
  }

  // Documents first, then assets. An asset still referenced by a document
  // cannot be deleted — Sanity refuses with a strength-reference error rather
  // than silently orphaning it.
  if (ids.length > 0) await mutate(ids.map((id) => ({ delete: { id } })))
  if (assetIds.length > 0) {
    await mutate(assetIds.map((id) => ({ delete: { id } })))
  }

  console.log(
    `Deleted ${ids.length} document(s) and ${assetIds.length} asset(s).`
  )
}

/**
 * The plates, and why these ratios.
 *
 * Aspect ratio is not decoration here: `vault/blocks/project-gallery`'s
 * `isFullWidth()` branches on it (>= 1 takes the full track, below takes the
 * half), and `vault/blocks/project-hero` reuses the same rule for the cover.
 * Until this stage the whole dataset held **two** ratios — 0.80 and 1.60 —
 * so the rule was exercised well away from its boundary and a square asset
 * had never once reached a rendered page. `isFullWidth(1)` was unit-tested
 * and passing the entire time; that is a different claim, and the gap between
 * the two is exactly where Tahap 11b's defect lived.
 *
 * So `ambang` is square on purpose. It is the boundary, and it is now on a
 * page a test can look at.
 */
const PLATES = {
  'panas-sore': {
    width: 1440,
    height: 1800, // 0.80 — portrait, half track
    ground: '#3a2a1e',
    mass: '#a8552a',
    light: '#f4d7a1',
    lightX: 0.24,
    lightY: 0.18,
    horizon: 0.68,
    subjectX: 0.38,
  },
  rimbun: {
    width: 2400,
    height: 1350, // 1.78 — 16:9, full track
    ground: '#1a3229',
    mass: '#2f6b52',
    light: '#dfe7c4',
    lightX: 0.74,
    lightY: 0.22,
    horizon: 0.74,
    subjectX: 0.6,
  },
  ambang: {
    width: 1600,
    height: 1600, // 1.00 — the boundary
    ground: '#2a2734',
    mass: '#4a4a6b',
    light: '#e8dfc8',
    lightX: 0.5,
    lightY: 0.16,
    horizon: 0.62,
    subjectX: 0.44,
  },
  'senja-ungu': {
    width: 1200,
    height: 1800, // 0.67 — the narrowest portrait
    ground: '#281c38',
    mass: '#6b3ea0',
    light: '#f2b463',
    lightX: 0.3,
    lightY: 0.78,
    horizon: 0.58,
    subjectX: 0.46,
  },
  gerimis: {
    width: 1800,
    height: 1200, // 1.50 — 3:2
    ground: '#36271b',
    mass: '#b0472f',
    light: '#f6d64a',
    lightX: 0.82,
    lightY: 0.66,
    horizon: 0.8,
    subjectX: 0.66,
  },
  'lantai-dua': {
    width: 1800,
    height: 1350, // 1.33 — 4:3
    ground: '#1e2833',
    mass: '#2c5670',
    light: '#cfe0e8',
    lightX: 0.18,
    lightY: 0.34,
    horizon: 0.7,
    subjectX: 0.32,
  },
  'plate-wide': {
    width: 2400,
    height: 1350, // gallery, landscape
    ground: '#2b241c',
    mass: '#7a5230',
    light: '#f0dcb4',
    lightX: 0.62,
    lightY: 0.28,
    horizon: 0.76,
    subjectX: 0.54,
  },
  'plate-tall': {
    width: 1200,
    height: 1600, // gallery, portrait
    ground: '#222926',
    mass: '#3c6350',
    light: '#dce8d2',
    lightX: 0.36,
    lightY: 0.24,
    horizon: 0.64,
    subjectX: 0.42,
  },
  'plate-square': {
    width: 1600,
    height: 1600, // gallery, boundary again
    ground: '#302430',
    mass: '#7c3a52',
    light: '#f2ccd4',
    lightX: 0.7,
    lightY: 0.7,
    horizon: 0.6,
    subjectX: 0.56,
  },
  portrait: {
    width: 1440,
    height: 1800, // studioSettings.portrait — 4:5
    // Lighter than the works on purpose. It sits in `#studio` beside body
    // text rather than in a grid of artwork, so it has to hold its own next
    // to prose on a near-black page instead of competing with the pieces.
    ground: '#4a4038',
    mass: '#8a7256',
    light: '#f4ead6',
    lightX: 0.28,
    lightY: 0.26,
    horizon: 0.72,
    subjectX: 0.44,
  },
} as const satisfies Record<string, Plate>

type PlateName = keyof typeof PLATES

/**
 * One fixture work.
 *
 * Typed out rather than inferred so `cover` and `gallery` are checked against
 * `PLATES`: a plate renamed in one place and not the other becomes a type
 * error here, instead of a project that seeds with a dangling asset reference
 * and renders an empty box that looks exactly like a slow image.
 */
interface FixtureProject {
  slug: string
  order: number
  span: 6 | 12
  featured: boolean
  year: number
  client: string | null
  discipline: 'painting' | 'mural' | 'illustration'
  title: ReturnType<typeof i18n>
  medium: ReturnType<typeof i18n>
  dimensions: string
  cover: PlateName
  gallery: readonly PlateName[]
  alt: ReturnType<typeof i18n>
  body: ReturnType<typeof i18nRich>
}

/**
 * Six works, and the shape of the set is deliberate.
 *
 * - **Two per discipline**, so `/work/discipline/<value>` is a filter with
 *   something to filter rather than a route with one result.
 * - **Four featured, six total**, so the home page shows a *selection* and the
 *   catalogue shows everything. With three works and two featured, the two
 *   pages were nearly the same page, and `ProjectGrid`'s `layout` split —
 *   which exists precisely because a curated wall and a catalogue want
 *   different rhythms — had almost nothing to demonstrate.
 * - **Spans mixed**, so the 6/12 column rule appears on both pages.
 */
const PROJECTS: readonly FixtureProject[] = [
  {
    slug: 'panas-sore',
    order: 1,
    span: 6,
    featured: true,
    year: 2025,
    client: 'Rumah Tanjung',
    discipline: 'painting',
    title: i18n('Panas Sore', 'Panas Sore'),
    medium: i18n('Acrylic on linen', 'Akrilik di atas linen'),
    dimensions: '120 × 90 cm',
    cover: 'panas-sore',
    gallery: ['plate-wide', 'plate-tall'],
    alt: i18n(
      'Acrylic painting, a low sun behind a dark mass',
      'Lukisan akrilik, matahari rendah di balik massa gelap'
    ),
    body: i18nRich(
      'A commission for a west-facing room that spends four hours a day in direct light. The palette was chosen against that light rather than against a screen, and the piece was painted on site for the last two weeks.',
      'Pesanan untuk ruang menghadap barat yang menerima cahaya langsung empat jam sehari. Paletnya dipilih terhadap cahaya itu, bukan terhadap layar, dan dua minggu terakhir dikerjakan langsung di lokasi.'
    ),
  },
  {
    slug: 'rimbun',
    order: 2,
    span: 12,
    featured: true,
    year: 2025,
    client: 'Kedai Sembilan',
    discipline: 'mural',
    title: i18n('Rimbun', 'Rimbun'),
    medium: i18n('Mural, exterior', 'Mural, eksterior'),
    dimensions: '4.2 × 2.6 m',
    cover: 'rimbun',
    gallery: ['plate-tall', 'plate-wide'],
    alt: i18n(
      'Exterior mural in deep greens across a two-storey wall',
      'Mural eksterior berwarna hijau tua di dinding dua lantai'
    ),
    body: i18nRich(
      'Painted over eleven days in the dry season. The wall had been resurfaced twice before, so the first three days were preparation rather than paint.',
      'Dikerjakan sebelas hari pada musim kemarau. Dindingnya sudah dua kali dilapis ulang, jadi tiga hari pertama adalah persiapan, bukan pengecatan.'
    ),
  },
  {
    slug: 'ambang',
    order: 3,
    span: 6,
    featured: true,
    year: 2025,
    client: 'Koperasi Tirta',
    discipline: 'painting',
    title: i18n('Ambang', 'Ambang'),
    medium: i18n('Oil on board', 'Cat minyak di atas papan'),
    dimensions: '100 × 100 cm',
    cover: 'ambang',
    gallery: ['plate-square', 'plate-wide'],
    alt: i18n(
      'Square oil painting, a pale mass on a threshold of light',
      'Lukisan minyak persegi, massa pucat di ambang cahaya'
    ),
    body: i18nRich(
      'Square, and the squareness is the argument: the room it hangs in has no long wall, so a landscape would have been hung by default rather than by choice.',
      'Persegi, dan kepersegiannya adalah argumennya: ruang tempatnya digantung tidak punya dinding panjang, jadi format lanskap akan terpasang karena kebiasaan, bukan karena pilihan.'
    ),
  },
  {
    slug: 'gerimis',
    order: 4,
    span: 6,
    featured: true,
    year: 2024,
    client: 'Penerbit Lintas',
    discipline: 'illustration',
    title: i18n('Gerimis', 'Gerimis'),
    medium: i18n('Gouache and ink', 'Guas dan tinta'),
    dimensions: '59 × 42 cm',
    cover: 'gerimis',
    gallery: ['plate-wide', 'plate-square'],
    alt: i18n(
      'Gouache illustration in warm reds under a late light',
      'Ilustrasi guas dalam warna merah hangat di bawah cahaya senja'
    ),
    body: i18nRich(
      'One of nine plates for a reissued collection. The brief asked for the weather rather than the scene, which is a harder instruction than it sounds.',
      'Satu dari sembilan pelat untuk terbitan ulang sebuah kumpulan. Briefnya meminta cuacanya, bukan pemandangannya — instruksi yang lebih sulit daripada kedengarannya.'
    ),
  },
  {
    slug: 'senja-ungu',
    order: 5,
    span: 6,
    featured: false,
    year: 2024,
    client: null,
    discipline: 'illustration',
    title: i18n('Senja Ungu', 'Senja Ungu'),
    medium: i18n('Gouache on paper', 'Guas di atas kertas'),
    dimensions: '42 × 59 cm',
    cover: 'senja-ungu',
    gallery: ['plate-tall', 'plate-square'],
    alt: i18n(
      'Gouache study in violet and amber',
      'Studi guas dalam warna ungu dan kuning tua'
    ),
    body: i18nRich(
      'A study, not a commission. It is here because two later pieces came out of it.',
      'Sebuah studi, bukan pesanan. Ia ada di sini karena dua karya berikutnya lahir darinya.'
    ),
  },
  {
    slug: 'lantai-dua',
    order: 6,
    span: 12,
    featured: false,
    year: 2023,
    client: 'Griya Sembada',
    discipline: 'mural',
    title: i18n('Lantai Dua', 'Lantai Dua'),
    medium: i18n('Mural, interior stairwell', 'Mural, tangga interior'),
    dimensions: '6.0 × 3.1 m',
    cover: 'lantai-dua',
    gallery: ['plate-wide', 'plate-tall'],
    alt: i18n(
      'Interior stairwell mural in cool blues',
      'Mural tangga interior dalam warna biru dingin'
    ),
    body: i18nRich(
      'Read from below and from the side, never straight on, so the composition was set out on the landing rather than on paper.',
      'Dibaca dari bawah dan dari samping, tidak pernah dari depan, jadi komposisinya ditata di bordes, bukan di atas kertas.'
    ),
  },
]

async function seed() {
  const plates = Object.entries(PLATES)
  console.log(`Rendering ${plates.length} fixture plates...`)

  /*
   * Rendered in parallel, uploaded in series.
   *
   * sharp releases the loop while libvips works, so rendering ten plates
   * concurrently is free. Uploading them concurrently is not: each is a
   * multi-megabyte POST through the same proxy tunnel, and the transport note
   * on `curl` above is what happens when that tunnel is pushed.
   */
  const rendered = await Promise.all(
    plates.map(([, plate]) => makePlate(plate))
  )

  const assets = new Map<string, string>()
  for (const [index, [name]] of plates.entries()) {
    const buffer = rendered[index]
    if (!buffer) throw new Error(`plate ${name} did not render`)
    const uploaded = await uploadImage(buffer, `${PREFIX}${name}.jpg`)
    assets.set(name, uploaded._id)
    console.log(`  uploaded ${index + 1}/${plates.length}  ${name}`)
  }

  const ref = (name: PlateName) => {
    const id = assets.get(name)
    if (!id) throw new Error(`plate ${name} was never uploaded`)
    return {
      _type: 'image' as const,
      asset: { _type: 'reference' as const, _ref: id },
    }
  }

  console.log('Creating fixture projects...')
  for (const project of PROJECTS) {
    await mutate([
      {
        createOrReplace: {
          _id: `${PREFIX}${project.slug}`,
          _type: 'project',
          title: project.title,
          slug: { _type: 'slug', current: project.slug },
          cover: { ...ref(project.cover), alt: project.alt },
          gallery: project.gallery.map((name, index) => ({
            ...ref(name),
            _key: `g${index + 1}`,
            alt: project.alt,
          })),
          ...(project.client && { client: project.client }),
          year: project.year,
          discipline: project.discipline,
          medium: project.medium,
          dimensions: project.dimensions,
          body: project.body,
          order: project.order,
          featured: project.featured,
          span: project.span,
          publishedAt: new Date().toISOString(),
        },
      },
    ])
  }

  await mutate([
    {
      createOrReplace: {
        _id: `${PREFIX}studioSettings`,
        _type: 'studioSettings',
        name: 'Arth',
        headline: i18n(
          'Commissioned work for people who notice',
          'Karya pesanan untuk mereka yang memperhatikan'
        ),
        subline: i18nText(
          'Painting, mural and illustration, made to a brief and to a wall.',
          'Lukisan, mural, dan ilustrasi, dikerjakan sesuai brief dan sesuai dindingnya.'
        ),
        /*
         * A portrait, which the dataset did not have before.
         *
         * `studio-note.module.css` gives `.body` a 7fr/5fr split only under
         * `[data-has-portrait]`. With no portrait that branch never fired, so
         * `#studio` rendered one column and left 748px of the viewport empty
         * beside a 650px text column — measured in `docs/stages/TAHAP-12.md`
         * §3.2 and read there as a layout defect. It was a *data* gap wearing
         * a layout defect's clothes, and the only way to tell the two apart
         * was to supply the data.
         */
        portrait: {
          ...ref('portrait'),
          alt: i18n('The studio at working light', 'Studio dalam cahaya kerja'),
        },
        email: 'studio@arth.example',
      },
    },
  ])

  console.log(
    `Seeded ${PROJECTS.length} projects, ${plates.length} assets, and one studio document.`
  )
}

async function preview() {
  const plates = Object.entries(PLATES)
  await mkdir(PREVIEW_DIR, { recursive: true })

  for (const [name, plate] of plates) {
    const buffer = await makePlate(plate)
    await writeFile(join(PREVIEW_DIR, `${name}.jpg`), buffer)
    const ratio = (plate.width / plate.height).toFixed(3)
    console.log(
      `  ${name.padEnd(12)} ${plate.width}×${plate.height}  ratio ${ratio}  ${Math.round(buffer.length / 1024)}kB`
    )
  }

  console.log(`\n${plates.length} plates written to ${PREVIEW_DIR}/`)
}

if (PREVIEW) {
  await preview()
} else if (process.argv.includes('--clean')) {
  await clean()
} else {
  await seed()
}
