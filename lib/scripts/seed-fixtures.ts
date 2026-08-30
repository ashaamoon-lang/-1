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
 * ```
 *
 * Requires `SANITY_API_WRITE_TOKEN`. Read-only tokens cannot run it, which is
 * the correct failure: it writes.
 */

import { spawn } from 'node:child_process'

import sharp from 'sharp'
import { z } from 'zod'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!(projectId && token)) {
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
 * A painterly placeholder, generated rather than downloaded.
 *
 * The point of the fixture is to prove the image pipeline — reserved boxes,
 * derived aspect ratios, the CDN URL builder — so the picture only has to be a
 * real raster of known dimensions. Generating it keeps the script offline and
 * avoids attaching someone else's photograph to this project.
 */
async function makeImage(
  width: number,
  height: number,
  colors: [string, string, string]
) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="a" cx="25%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${colors[0]}"/>
        <stop offset="100%" stop-color="${colors[0]}00"/>
      </radialGradient>
      <radialGradient id="b" cx="80%" cy="75%" r="65%">
        <stop offset="0%" stop-color="${colors[1]}"/>
        <stop offset="100%" stop-color="${colors[1]}00"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${colors[2]}"/>
    <rect width="100%" height="100%" fill="url(#a)"/>
    <rect width="100%" height="100%" fill="url(#b)"/>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
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

async function seed() {
  console.log('Uploading fixture images...')
  const covers = await Promise.all([
    makeImage(1600, 2000, ['#e94f1d', '#1f4fd8', '#2a1c14']),
    makeImage(2000, 1250, ['#0f6b52', '#d9e2b6', '#10231c']),
    makeImage(1600, 2000, ['#6f3ea8', '#f2a03d', '#1a1226']),
  ])
  const detail = await makeImage(2000, 1500, ['#f6d64a', '#b8342c', '#241a12'])

  const uploaded: { _id: string }[] = []
  for (const [index, buffer] of [...covers, detail].entries()) {
    uploaded.push(await uploadImage(buffer, `${PREFIX}artwork-${index}.jpg`))
    console.log(`  uploaded ${index + 1}/4`)
  }

  const ref = (index: number) => ({
    _type: 'image' as const,
    asset: { _type: 'reference' as const, _ref: uploaded[index]?._id ?? '' },
  })

  const projects = [
    {
      _id: `${PREFIX}panas-sore`,
      title: i18n('Panas Sore', 'Panas Sore'),
      slug: 'panas-sore',
      order: 1,
      span: 6,
      featured: true,
      year: 2025,
      client: 'Rumah Tanjung',
      medium: i18n('Acrylic on linen', 'Akrilik di atas linen'),
      dimensions: '120 × 90 cm',
      coverIndex: 0,
      coverAlt: i18n(
        'Acrylic painting, three figures under a low orange sun',
        'Lukisan akrilik, tiga sosok di bawah matahari jingga rendah'
      ),
      body: i18nRich(
        'A commission for a west-facing room that spends four hours a day in direct light. The palette was chosen against that light rather than against a screen, and the piece was painted on site for the last two weeks.',
        'Pesanan untuk ruang menghadap barat yang menerima cahaya langsung empat jam sehari. Paletnya dipilih terhadap cahaya itu, bukan terhadap layar, dan dua minggu terakhir dikerjakan langsung di lokasi.'
      ),
    },
    {
      _id: `${PREFIX}rimbun`,
      title: i18n('Rimbun', 'Rimbun'),
      slug: 'rimbun',
      order: 2,
      span: 12,
      featured: true,
      year: 2025,
      client: 'Kedai Sembilan',
      medium: i18n('Mural, exterior', 'Mural, eksterior'),
      dimensions: '4.2 × 2.6 m',
      coverIndex: 1,
      coverAlt: i18n(
        'Exterior mural in deep greens across a two-storey wall',
        'Mural eksterior berwarna hijau tua di dinding dua lantai'
      ),
      body: i18nRich(
        'Painted over eleven days in the dry season. The wall had been resurfaced twice before, so the first three days were preparation rather than paint.',
        'Dikerjakan sebelas hari pada musim kemarau. Dindingnya sudah dua kali dilapis ulang, jadi tiga hari pertama adalah persiapan, bukan pengecatan.'
      ),
    },
    {
      _id: `${PREFIX}senja-ungu`,
      title: i18n('Senja Ungu', 'Senja Ungu'),
      slug: 'senja-ungu',
      order: 3,
      span: 6,
      featured: false,
      year: 2024,
      client: null,
      medium: i18n('Gouache on paper', 'Guas di atas kertas'),
      dimensions: '42 × 59 cm',
      coverIndex: 2,
      coverAlt: i18n(
        'Gouache study in violet and amber',
        'Studi guas dalam warna ungu dan kuning tua'
      ),
      body: i18nRich(
        'A study, not a commission. It is here because two later pieces came out of it.',
        'Sebuah studi, bukan pesanan. Ia ada di sini karena dua karya berikutnya lahir darinya.'
      ),
    },
  ]

  console.log('Creating fixture projects...')
  for (const project of projects) {
    await mutate([
      {
        createOrReplace: {
          _id: project._id,
          _type: 'project',
          title: project.title,
          slug: { _type: 'slug', current: project.slug },
          cover: {
            ...ref(project.coverIndex),
            alt: project.coverAlt,
          },
          gallery: [
            { ...ref(3), _key: 'g1', alt: project.coverAlt },
            { ...ref(project.coverIndex), _key: 'g2', alt: project.coverAlt },
          ],
          ...(project.client && { client: project.client }),
          year: project.year,
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
        email: 'studio@arth.example',
      },
    },
  ])

  console.log(`Seeded ${projects.length} projects and one studio document.`)
}

if (process.argv.includes('--clean')) {
  await clean()
} else {
  await seed()
}
